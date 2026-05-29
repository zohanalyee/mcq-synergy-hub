import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_ORIGIN } from '@/lib/seoUrls';

/**
 * GlobalCanonical — single source of truth for <link rel="canonical">.
 *
 * Why global:
 *   Multiple per-page Helmet blocks were emitting conflicting canonicals
 *   (apex vs www, with/without lang query). Google then picked the wrong
 *   variant ("Duplicate without user-selected canonical").
 *
 * Rules enforced here:
 *   - Always https
 *   - Always the APEX origin https://mcqsai.com (never www.* — www. 302-redirects
 *     to apex, and crawlers must not be pointed at a redirecting URL; this also
 *     keeps og:url === og:image host, so social previews resolve directly).
 *   - Strip query string entirely (incl. ?lang=)
 *   - Strip trailing slash (except root)
 *
 * No other component in the app should emit a <link rel="canonical">.
 */
const GlobalCanonical = () => {
  const { pathname } = useLocation();

  let p = pathname || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);

  const canonical = `${SITE_ORIGIN}${p}`;

  return (
    // NOTE: do NOT use `prioritizeSeoTags` — react-helmet-async@2.0.4 has a
    // bug where enabling it on any Helmet in the tree empties helmet.link
    // and helmet.script outputs across the entire app (canonical + JSON-LD
    // disappear from SSR). Order does not matter for crawlers anyway.
    <Helmet>
      <link rel="canonical" href={canonical} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:url" content={canonical} />
    </Helmet>
  );
};

export default GlobalCanonical;
