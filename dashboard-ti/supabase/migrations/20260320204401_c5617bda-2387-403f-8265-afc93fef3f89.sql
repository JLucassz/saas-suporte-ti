CREATE POLICY "Authenticated users can insert chamados"
ON public.chamados
FOR INSERT
TO authenticated
WITH CHECK (true);