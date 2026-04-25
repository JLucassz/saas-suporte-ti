-- Allow authenticated users to upload to arquivos_rag bucket
CREATE POLICY "Authenticated users can upload to arquivos_rag"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'arquivos_rag');

-- Allow authenticated users to read from arquivos_rag bucket
CREATE POLICY "Authenticated users can read arquivos_rag"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'arquivos_rag');