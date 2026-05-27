DROP FUNCTION IF EXISTS public.check_login_rate_limit(text, integer, integer);

GRANT SELECT, INSERT, DELETE ON public.login_attempts TO anon, authenticated;
GRANT ALL ON public.login_attempts TO service_role;

DROP POLICY IF EXISTS "Rate limiter can count attempts for current IP" ON public.login_attempts;
DROP POLICY IF EXISTS "Rate limiter can record attempts for current IP" ON public.login_attempts;
DROP POLICY IF EXISTS "Rate limiter can clean attempts for current IP" ON public.login_attempts;

CREATE POLICY "Rate limiter can count attempts for current IP"
ON public.login_attempts
FOR SELECT
TO anon, authenticated
USING (ip = current_setting('app.rate_limit_ip', true));

CREATE POLICY "Rate limiter can record attempts for current IP"
ON public.login_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (ip = current_setting('app.rate_limit_ip', true));

CREATE POLICY "Rate limiter can clean attempts for current IP"
ON public.login_attempts
FOR DELETE
TO anon, authenticated
USING (ip = current_setting('app.rate_limit_ip', true));

CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  _ip text,
  _limit integer DEFAULT 5,
  _window_seconds integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  safe_ip text := COALESCE(NULLIF(btrim(_ip), ''), 'unknown');
  safe_limit integer := LEAST(GREATEST(COALESCE(_limit, 5), 1), 20);
  safe_window_seconds integer := LEAST(GREATEST(COALESCE(_window_seconds, 60), 1), 3600);
  window_start timestamptz := now() - make_interval(secs => LEAST(GREATEST(COALESCE(_window_seconds, 60), 1), 3600));
  attempt_count integer := 0;
  retry_after_seconds integer := 60;
BEGIN
  PERFORM set_config('app.rate_limit_ip', safe_ip, true);

  DELETE FROM public.login_attempts
  WHERE ip = safe_ip
    AND attempted_at < window_start;

  SELECT count(*)::integer
  INTO attempt_count
  FROM public.login_attempts
  WHERE ip = safe_ip
    AND attempted_at >= window_start;

  IF attempt_count >= safe_limit THEN
    SELECT GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (MIN(attempted_at) + make_interval(secs => safe_window_seconds) - now())))::integer
    )
    INTO retry_after_seconds
    FROM public.login_attempts
    WHERE ip = safe_ip
      AND attempted_at >= window_start;

    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retryAfterSec', COALESCE(retry_after_seconds, safe_window_seconds)
    );
  END IF;

  INSERT INTO public.login_attempts (ip)
  VALUES (safe_ip);

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', safe_limit - (attempt_count + 1)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_login_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text, integer, integer) TO anon, authenticated, service_role;