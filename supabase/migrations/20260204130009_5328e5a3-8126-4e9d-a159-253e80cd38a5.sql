-- Add furniture_source column to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN furniture_source text DEFAULT 'open';

-- Add a check constraint for valid values
ALTER TABLE public.quiz_responses 
ADD CONSTRAINT quiz_responses_furniture_source_check 
CHECK (furniture_source IN ('shop_only', 'open'));