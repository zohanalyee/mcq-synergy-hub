-- Repair bare-email apply URLs so they never resolve as relative internal routes.
UPDATE external_opportunities
SET apply_url = 'mailto:' || apply_url
WHERE apply_url ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

-- Repair explicit markdown email links inside opportunity descriptions.
UPDATE external_opportunities
SET description = regexp_replace(
  description,
  '\]\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)',
  '](mailto:\1)',
  'g'
)
WHERE description ~ '\]\([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\)';

-- Repair explicit markdown email links inside blog post content.
UPDATE blog_posts
SET content = regexp_replace(
  content,
  '\]\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)',
  '](mailto:\1)',
  'g'
)
WHERE content ~ '\]\([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\)';