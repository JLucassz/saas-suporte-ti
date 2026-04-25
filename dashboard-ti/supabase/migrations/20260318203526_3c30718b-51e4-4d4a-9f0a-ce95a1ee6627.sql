
-- Enable RLS on equipe_ti (may already be enabled, this is idempotent)
ALTER TABLE public.equipe_ti ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own row
CREATE POLICY "Users can read own equipe_ti row"
ON public.equipe_ti
FOR SELECT
TO authenticated
USING (id = auth.uid());
