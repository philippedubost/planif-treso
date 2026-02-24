-- Create the scenario_versions table
CREATE TABLE IF NOT EXISTS public.scenario_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planification_id UUID REFERENCES public.planifications(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_scenario_versions_user_id ON public.scenario_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_versions_scenario_id ON public.scenario_versions(scenario_id);

-- RLS (Row Level Security)
ALTER TABLE public.scenario_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own versions" 
ON public.scenario_versions FOR ALL 
USING (auth.uid() = user_id);
