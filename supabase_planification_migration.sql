-- Create planifications table
CREATE TABLE IF NOT EXISTS public.planifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_planifications_user_id ON public.planifications(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.planifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own planifications" ON public.planifications;
CREATE POLICY "Users can only access their own planifications" 
ON public.planifications FOR ALL 
USING (auth.uid() = user_id);

-- Update scenarios table
ALTER TABLE public.scenarios
ADD COLUMN IF NOT EXISTS planification_id UUID REFERENCES public.planifications(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scenarios_planification_id ON public.scenarios(planification_id);

-- Migrate existing scenarios:
DO $$
DECLARE
    r RECORD;
    new_plan_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT user_id FROM public.scenarios WHERE planification_id IS NULL LOOP
        -- Create a default planification for this user
        INSERT INTO public.planifications (user_id, name)
        VALUES (r.user_id, 'Planification Principale')
        RETURNING id INTO new_plan_id;

        -- Update the user's scenarios
        UPDATE public.scenarios
        SET planification_id = new_plan_id
        WHERE user_id = r.user_id AND planification_id IS NULL;
    END LOOP;
END $$;
