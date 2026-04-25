
CREATE POLICY "Authenticated users can delete arquivos_conhecimento"
ON public.arquivos_conhecimento
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete from arquivos_rag"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'arquivos_rag');
