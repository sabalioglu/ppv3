-- Cookbooks: the client feature shipped (create/list/detail/delete + add
-- recipes) but its tables were never created in prod (Bolt-era drift; only
-- the manage_cookbooks RPC exists). Every cookbook action failed with 42P01.
-- Shapes match what the client sends/selects:
--   cookbooks: user_id, name, description, emoji, color, created_at, updated_at
--   recipe_cookbooks: cookbook_id, recipe_id -> user_recipes, user_id (one
--   caller includes it), embedded selects user_recipes(...) and (count)

CREATE TABLE IF NOT EXISTS public.cookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_cookbooks (
  cookbook_id UUID NOT NULL REFERENCES public.cookbooks(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.user_recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cookbook_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_cookbooks_user ON public.cookbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_cookbooks_recipe
  ON public.recipe_cookbooks(recipe_id);

ALTER TABLE public.cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_cookbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cookbooks_owner_all" ON public.cookbooks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Link rows are owned through the parent cookbook.
CREATE POLICY "recipe_cookbooks_owner_all" ON public.recipe_cookbooks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cookbooks c
      WHERE c.id = cookbook_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cookbooks c
      WHERE c.id = cookbook_id AND c.user_id = auth.uid()
    )
  );
