ALTER TABLE public.allocation_requests REPLICA IDENTITY FULL;
ALTER TABLE public.complaints REPLICA IDENTITY FULL;
ALTER TABLE public.allocations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'allocation_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.allocation_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'complaints') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'allocations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.allocations;
  END IF;
END $$;