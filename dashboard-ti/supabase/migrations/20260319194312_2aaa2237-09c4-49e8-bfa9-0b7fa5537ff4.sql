-- Enable RLS on chamados
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chamados"
ON public.chamados
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on categorias
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categorias"
ON public.categorias
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read usuarios"
ON public.usuarios
FOR SELECT
TO authenticated
USING (true);