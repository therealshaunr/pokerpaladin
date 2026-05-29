
REVOKE EXECUTE ON FUNCTION public.generate_license_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_license_key(text, text) TO service_role;

-- get_go_live_usage is read-only and only sums the caller's rows; keep callable by authenticated
REVOKE EXECUTE ON FUNCTION public.get_go_live_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_go_live_usage(uuid) TO authenticated, service_role;
