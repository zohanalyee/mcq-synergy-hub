INSERT INTO system_settings (key, value, description)
VALUES (
  'social_links',
  '{"facebook": "", "instagram": "", "tiktok": "", "twitter": "", "youtube": ""}'::jsonb,
  'Social media profile URLs displayed in the footer'
)
ON CONFLICT (key) DO NOTHING;