
CREATE POLICY "Authenticated users can insert usuarios"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update usuarios"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
