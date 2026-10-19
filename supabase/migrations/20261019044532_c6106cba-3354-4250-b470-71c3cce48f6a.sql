GRANT SELECT ON public.system_settings TO anon, authenticated;
CREATE POLICY "Public can read Join Alerts channel URL"
ON public.system_settings FOR SELECT TO anon, authenticated
USING (key = 'whatsapp_channel_url');