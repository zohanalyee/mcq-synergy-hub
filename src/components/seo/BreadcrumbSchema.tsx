interface Crumb {
  name: string;
  path: string;
}

/**
 * Emits BreadcrumbList JSON-LD. Renders no visible UI — pair with a visible
 * breadcrumb nav for users; this is purely for search engines.
 */
const BreadcrumbSchema = ({ items, baseUrl = 'https://mcqsai.com' }: { items: Crumb[]; baseUrl?: string }) => {
  if (!items.length) return null;
  const json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${baseUrl}${c.path}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
};

export default BreadcrumbSchema;
