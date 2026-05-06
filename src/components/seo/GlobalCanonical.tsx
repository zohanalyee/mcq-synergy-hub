import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

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
 *   - Always www.mcqsai.com (never apex)
 *   - Strip query string entirely (incl. ?lang=)
 *   - Strip trailing slash (except root)
 *
 * No other component in the app should emit a <link rel="canonical">.
 */
const GlobalCanonical = () => {
  const { pathname } = useLocation();

  let p = pathname || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);

  const canonical = `https://www.mcqsai.com${p}`;

  return (
    <Helmet prioritizeSeoTags>
      <link rel="canonical" href={canonical} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:url" content={canonical} />
    </Helmet>
  );
};

export default GlobalCanonical;
