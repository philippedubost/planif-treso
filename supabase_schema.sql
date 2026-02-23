-- Finaliser la configuration de la base de données via l'éditeur SQL de Supabase

-- Tables pour les transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    direction TEXT CHECK (direction IN ('income', 'expense')),
    category_id TEXT,
    recurrence TEXT CHECK (recurrence IN ('none', 'monthly', 'yearly')),
    month TEXT, -- YYYY-MM
    start_month TEXT, -- YYYY-MM
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own transactions" 
ON public.transactions FOR ALL 
USING (auth.uid() = user_id);

-- Fonction pour obtenir le nombre de flux
CREATE OR REPLACE FUNCTION get_user_flux_count(u_id UUID) 
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.transactions WHERE user_id = u_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
