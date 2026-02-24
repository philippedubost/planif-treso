ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS planification_id UUID REFERENCES public.planifications(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_planification_id ON public.transactions(planification_id);

-- Migrate existing transactions:
DO $$
DECLARE
    r RECORD;
    new_plan_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT user_id FROM public.transactions WHERE planification_id IS NULL LOOP
        -- Check if user already has a planification
        SELECT id INTO new_plan_id FROM public.planifications WHERE user_id = r.user_id ORDER BY created_at ASC LIMIT 1;
        
        IF new_plan_id IS NULL THEN
            -- Create a default planification for this user if they don't have one
            INSERT INTO public.planifications (user_id, name)
            VALUES (r.user_id, 'Planification Principale')
            RETURNING id INTO new_plan_id;
        END IF;

        -- Update the user's transactions
        UPDATE public.transactions
        SET planification_id = new_plan_id
        WHERE user_id = r.user_id AND planification_id IS NULL;
    END LOOP;
END $$;
