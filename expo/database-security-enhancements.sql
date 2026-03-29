-- Enhanced Row Level Security (RLS) Policies
-- Run this SQL in your Supabase SQL editor after the main database setup

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL, -- login, api_call, etc.
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, action, window_start)
);

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Audit logs policies (admin only)
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

-- Security events policies (users can view their own events, admins can view all)
CREATE POLICY "Users can view own security events" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events" ON public.security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Rate limits policies (system only)
CREATE POLICY "No direct access to rate limits" ON public.rate_limits
  FOR ALL USING (false);

-- Enhanced profiles policies with additional security checks
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

-- Enhanced food entries policies with time-based restrictions
DROP POLICY IF EXISTS "Users can view own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can insert own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can update own food entries" ON public.food_entries;
DROP POLICY IF EXISTS "Users can delete own food entries" ON public.food_entries;

CREATE POLICY "Users can view own food entries" ON public.food_entries
  FOR SELECT USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

CREATE POLICY "Users can insert own food entries" ON public.food_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

CREATE POLICY "Users can update own food entries" ON public.food_entries
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
    AND created_at > NOW() - INTERVAL '24 hours' -- Can only edit entries from last 24 hours
  );

CREATE POLICY "Users can delete own food entries" ON public.food_entries
  FOR DELETE USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
    AND created_at > NOW() - INTERVAL '24 hours' -- Can only delete entries from last 24 hours
  );

-- Create indexes for security tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON public.security_events(resolved);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON public.rate_limits(action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id, old_values, ip_address, user_agent
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id, new_values, ip_address, user_agent
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_food_entries_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.food_entries
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_recipes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id, event_type, severity, description, metadata, ip_address, user_agent
  ) VALUES (
    auth.uid(),
    p_event_type,
    p_severity,
    p_description,
    p_metadata,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := date_trunc('minute', NOW()) - (EXTRACT(minute FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
  
  -- Get current count for this window
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_start >= window_start;
  
  -- If limit exceeded, return false
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO public.rate_limits (identifier, action, window_start, count)
  VALUES (p_identifier, p_action, window_start, 1)
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old records
CREATE OR REPLACE FUNCTION public.cleanup_security_tables()
RETURNS VOID AS $$
BEGIN
  -- Clean up old audit logs (keep 90 days)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean up resolved security events (keep 30 days)
  DELETE FROM public.security_events 
  WHERE resolved = true AND created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() OR is_active = false;
  
  -- Clean up old rate limit records (keep 24 hours)
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-security-tables', '0 2 * * *', 'SELECT public.cleanup_security_tables();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;

-- Create view for user security dashboard
CREATE OR REPLACE VIEW public.user_security_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as account_created,
  u.last_sign_in_at,
  COUNT(DISTINCT s.id) as active_sessions,
  COUNT(DISTINCT se.id) FILTER (WHERE se.created_at > NOW() - INTERVAL '30 days') as recent_security_events,
  MAX(se.created_at) as last_security_event
FROM auth.users u
LEFT JOIN public.user_sessions s ON u.id = s.user_id AND s.is_active = true AND s.expires_at > NOW()
LEFT JOIN public.security_events se ON u.id = se.user_id
WHERE u.id = auth.uid()
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at;

-- Grant access to the view
GRANT SELECT ON public.user_security_summary TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';