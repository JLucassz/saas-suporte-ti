CREATE POLICY "Authenticated users can update chamados"
ON public.chamados
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);