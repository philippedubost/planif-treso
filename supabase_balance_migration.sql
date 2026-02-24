-- Mettre à jour la table planifications en ajoutant le solde initial
ALTER TABLE public.planifications
ADD COLUMN IF NOT EXISTS starting_balance NUMERIC DEFAULT 0;

-- Migrer le solde initial des scénarios vers leur planification parente (en prenant le solde du scenario principal s'il y en a un, ou du premier trouvé)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT planification_id, starting_balance 
             FROM (
                 SELECT planification_id, starting_balance,
                 ROW_NUMBER() OVER (PARTITION BY planification_id ORDER BY created_at ASC) as rn
                 FROM public.scenarios
             ) sub
             WHERE rn = 1
    LOOP
        UPDATE public.planifications
        SET starting_balance = r.starting_balance
        WHERE id = r.planification_id;
    END LOOP;
END $$;
