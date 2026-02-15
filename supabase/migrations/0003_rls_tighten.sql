-- Tighten RLS + storage policies

-- Problem posts: only open posts for market or owner
DROP POLICY IF EXISTS "Problem posts are viewable by authenticated users" ON public.problem_posts;

CREATE POLICY "Problem posts are viewable by market or owner"
  ON public.problem_posts FOR SELECT
  USING (
    (status = 'open' AND auth.role() = 'authenticated')
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- Storage bucket: make private
UPDATE storage.buckets
SET public = false
WHERE id = 'milestone-evidence';

-- Storage policies
DROP POLICY IF EXISTS "Milestone evidence objects are readable" ON storage.objects;
DROP POLICY IF EXISTS "Milestone evidence objects are insertable" ON storage.objects;

CREATE POLICY "Milestone evidence objects are readable by participants"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'milestone-evidence'
    AND EXISTS (
      SELECT 1
      FROM public.milestone_evidence me
      JOIN public.deal_milestones m ON m.id = me.milestone_id
      JOIN public.deals d ON d.id = m.deal_id
      WHERE me.evidence_url = storage.objects.name
        AND (d.founder_id = auth.uid() OR d.helper_id = auth.uid())
    )
  );

CREATE POLICY "Milestone evidence objects are insertable by helper"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'milestone-evidence'
    AND auth.uid()::text = split_part(name, '/', 1)
    AND EXISTS (
      SELECT 1
      FROM public.deal_milestones m
      JOIN public.deals d ON d.id = m.deal_id
      WHERE m.id::text = split_part(name, '/', 2)
        AND d.helper_id = auth.uid()
    )
  );
