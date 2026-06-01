import { mailtoForEmailHref, isBareEmailHref } from '@/lib/markdownSanitize';

/**
 * Anchor renderer for `react-markdown`. Guarantees an email never becomes a
 * relative internal route (e.g. `/blog/hr@x.com`). Bare-email hrefs become
 * `mailto:`; external links get safe rel/target attributes.
 */
export function SafeMarkdownLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const raw = href ?? '';
  const safe = mailtoForEmailHref(raw);
  const isMailto = safe.startsWith('mailto:') || isBareEmailHref(raw);
  const isExternal = /^https?:\/\//i.test(safe);

  return (
    <a
      href={safe}
      {...(isExternal ? { target: '_blank', rel: 'nofollow noopener noreferrer' } : {})}
      {...(isMailto ? { rel: 'nofollow' } : {})}
      {...props}
    >
      {children}
    </a>
  );
}

/** Ready-to-spread `components` map for react-markdown. */
export const safeMarkdownComponents = { a: SafeMarkdownLink };
