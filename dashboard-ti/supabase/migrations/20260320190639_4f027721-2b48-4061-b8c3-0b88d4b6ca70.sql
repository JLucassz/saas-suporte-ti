
ALTER TABLE public.historico_chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read historico_chamados"
ON public.historico_chamados
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert historico_chamados"
ON public.historico_chamados
FOR INSERT
TO authenticated
WITH CHECK (true);
