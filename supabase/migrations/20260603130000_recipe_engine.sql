-- ============================================================================
-- Stovd Recipe Engine — RAG schema (pgvector)
-- Backbone: cook-from-what-you-have, personalized by saved/liked + skill + cuisine.
-- Embeddings: Supabase native gte-small (384 dims). LLM: Gemini/Gemma (server-side).
-- ============================================================================

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- recipe_corpus: canonical, embedded recipe store.
--   owner_user_id NULL  => public/open corpus (TheMealDB, Wikibooks, generated)
--   owner_user_id set   => a user's own imported/saved recipe
-- ---------------------------------------------------------------------------
create table if not exists recipe_corpus (
  id              uuid primary key default gen_random_uuid(),
  source          text not null check (source in
                    ('user','themealdb','wikibooks','openfoodfacts','generated','imported')),
  external_id     text,                                   -- source-native id (dedupe)
  title           text not null,
  cuisine         text,
  ingredients     jsonb not null default '[]'::jsonb,     -- [{name, amount, unit}]
  ingredient_names text[] not null default '{}',          -- normalized lowercase, for overlap filter
  steps           jsonb not null default '[]'::jsonb,     -- ["step 1", ...]
  skill_level     text check (skill_level in ('beginner','intermediate','advanced')),
  total_time_min  int,
  servings        int,
  image_url       text,
  tags            text[] default '{}',
  embedding       vector(384),
  owner_user_id   uuid references auth.users(id) on delete cascade,
  created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- user_taste_profile: derived (onboarding + saved/liked), cached for ranking.
-- ---------------------------------------------------------------------------
create table if not exists user_taste_profile (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  skill_level          text,
  cuisines             text[] default '{}',
  diet                 text[] default '{}',
  allergies            text[] default '{}',
  disliked_ingredients text[] default '{}',
  liked_ingredients    text[] default '{}',
  profile_embedding    vector(384),
  updated_at           timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- recipe_feedback: interaction signal that feeds the taste profile + ranking.
-- ---------------------------------------------------------------------------
create table if not exists recipe_feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  recipe_id    uuid,
  recipe_title text,
  cuisine      text,
  action       text not null check (action in ('saved','liked','disliked','cooked','skipped')),
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists recipe_corpus_embedding_idx
  on recipe_corpus using hnsw (embedding vector_cosine_ops);
create index if not exists recipe_corpus_owner_idx       on recipe_corpus(owner_user_id);
create index if not exists recipe_corpus_ingredients_idx on recipe_corpus using gin(ingredient_names);
create index if not exists recipe_corpus_cuisine_idx     on recipe_corpus(cuisine);
create index if not exists recipe_feedback_user_idx      on recipe_feedback(user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table recipe_corpus       enable row level security;
alter table user_taste_profile  enable row level security;
alter table recipe_feedback     enable row level security;

drop policy if exists recipe_corpus_read on recipe_corpus;
create policy recipe_corpus_read on recipe_corpus for select to authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());

drop policy if exists recipe_corpus_write_own on recipe_corpus;
create policy recipe_corpus_write_own on recipe_corpus for all to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists taste_owner on user_taste_profile;
create policy taste_owner on user_taste_profile for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists feedback_owner on recipe_feedback;
create policy feedback_owner on recipe_feedback for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- match_recipes: hybrid retrieval — pantry ingredient overlap + vector similarity.
-- Returns candidates the user can mostly make, ranked by taste similarity,
-- restricted to public corpus + the caller's own recipes.
-- ---------------------------------------------------------------------------
create or replace function match_recipes(
  query_embedding vector(384),
  pantry          text[],
  p_user_id       uuid,
  match_count     int default 20,
  min_overlap     int default 1
)
returns table (
  id              uuid,
  title           text,
  cuisine         text,
  source          text,
  ingredients     jsonb,
  ingredient_names text[],
  steps           jsonb,
  skill_level     text,
  total_time_min  int,
  servings        int,
  image_url       text,
  matched_count   int,
  total_ingredients int,
  pantry_coverage numeric,
  similarity      numeric
)
language sql stable
as $$
  select
    c.id, c.title, c.cuisine, c.source, c.ingredients, c.ingredient_names,
    c.steps, c.skill_level, c.total_time_min, c.servings, c.image_url,
    cardinality(array(select unnest(c.ingredient_names) intersect select unnest(pantry)))            as matched_count,
    cardinality(c.ingredient_names)                                                                   as total_ingredients,
    round( cardinality(array(select unnest(c.ingredient_names) intersect select unnest(pantry)))::numeric
           / nullif(cardinality(c.ingredient_names),0), 3)                                            as pantry_coverage,
    round((1 - (c.embedding <=> query_embedding))::numeric, 4)                                        as similarity
  from recipe_corpus c
  where (c.owner_user_id is null or c.owner_user_id = p_user_id)
    and c.embedding is not null
    and cardinality(array(select unnest(c.ingredient_names) intersect select unnest(pantry))) >= min_overlap
  order by
    -- blended: pantry coverage (cookability) first, then taste similarity
    (0.6 * (cardinality(array(select unnest(c.ingredient_names) intersect select unnest(pantry)))::numeric
            / nullif(cardinality(c.ingredient_names),0))
     + 0.4 * (1 - (c.embedding <=> query_embedding))) desc
  limit match_count;
$$;
