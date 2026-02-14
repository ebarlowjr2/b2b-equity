import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response("Missing authorization", { status: 401 });
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response("Invalid user", { status: 401 });
    }

    const body = await req.json();
    const milestoneId = body?.milestone_id as string | undefined;

    if (!milestoneId) {
      return new Response("Missing milestone_id", { status: 400 });
    }

    const { data: milestone, error: milestoneError } = await admin
      .from("deal_milestones")
      .select(
        "id, deal_id, equity_grant_units, status, deals!inner(id, founder_id, helper_id, business_id)"
      )
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return new Response("Milestone not found", { status: 404 });
    }

    if (milestone.deals.founder_id !== userData.user.id) {
      return new Response("Not authorized", { status: 403 });
    }

    if (milestone.status === "approved") {
      return new Response("Already approved", { status: 409 });
    }

    const { error: updateError } = await admin
      .from("deal_milestones")
      .update({ status: "approved" })
      .eq("id", milestoneId);

    if (updateError) {
      return new Response(updateError.message, { status: 400 });
    }

    const { error: ledgerError } = await admin
      .from("equity_ledger_entries")
      .insert({
        business_id: milestone.deals.business_id,
        recipient_user_id: milestone.deals.helper_id,
        deal_id: milestone.deal_id,
        milestone_id: milestone.id,
        units: milestone.equity_grant_units,
        memo: "Milestone approved",
      });

    if (ledgerError) {
      return new Response(ledgerError.message, { status: 400 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        milestone_id: milestone.id,
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(message, { status: 500 });
  }
});
