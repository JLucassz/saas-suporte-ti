-- Enable RLS on arquivos_conhecimento
ALTER TABLE public.arquivos_conhecimento ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read arquivos_conhecimento"
ON public.arquivos_conhecimento
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert arquivos_conhecimento"
ON public.arquivos_conhecimento
FOR INSERT
TO authenticated
WITH CHECK (true);