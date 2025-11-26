ALTER TABLE public.profiles
ADD COLUMN plan TEXT CHECK (plan IN ('digital', 'connect'));
