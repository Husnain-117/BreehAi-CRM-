-- Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL, -- in seconds
  call_type TEXT NOT NULL CHECK (call_type IN ('inbound', 'outbound', 'callback', 'voicemail')),
  outcome TEXT NOT NULL CHECK (outcome IN ('completed', 'no_answer', 'busy', 'failed', 'voicemail')),
  notes TEXT,
  call_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.calls IS 'Tracks all calls made to/from leads';
COMMENT ON COLUMN public.calls.duration IS 'Duration of the call in seconds';
COMMENT ON COLUMN public.calls.call_type IS 'Type of call: inbound, outbound, callback, or voicemail';
COMMENT ON COLUMN public.calls.outcome IS 'Outcome of the call: completed, no_answer, busy, failed, or voicemail';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS calls_lead_id_idx ON public.calls(lead_id);
CREATE INDEX IF NOT EXISTS calls_user_id_idx ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS calls_call_start_time_idx ON public.calls(call_start_time);

-- Set up RLS (Row Level Security)
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view calls for leads they have access to"
  ON public.calls
  FOR SELECT
  USING (
    -- Users can see calls for leads they own or are assigned to
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
    OR
    -- Admins can see all calls
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can insert their own calls"
  ON public.calls
  FOR INSERT
  WITH CHECK (
    -- Users can only create calls for leads they have access to
    lead_id IN (
      SELECT id FROM public.leads 
      WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
    OR
    -- Admins can create calls for any lead
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calls_updated_at
BEFORE UPDATE ON public.calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
