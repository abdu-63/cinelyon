-- Fix pour l'erreur 401 Unauthorized sur public.friend_follows
ALTER TABLE public.friend_follows ENABLE ROW LEVEL SECURITY;

-- Autorise tout accès avec la clé "anon" (utilisateur anonyme)
CREATE POLICY "Enable read access for all users" ON "public"."friend_follows"
AS PERMISSIVE FOR SELECT
TO anon
USING (true);

CREATE POLICY "Enable insert for all users" ON "public"."friend_follows"
AS PERMISSIVE FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON "public"."friend_follows"
AS PERMISSIVE FOR DELETE
TO anon
USING (true);
