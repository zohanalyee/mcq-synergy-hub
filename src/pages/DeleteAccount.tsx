import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { safeJsonLd } from '@/lib/jsonLd';
import { Button } from '@/components/ui/button';
import { Mail, Trash2, Clock, ShieldCheck } from 'lucide-react';

const UPDATED = '2026-08-14';
const SUPPORT_EMAIL = 'zohaibalichanna@gmail.com';

/**
 * Public data-deletion instructions page — required by Meta (Facebook Login)
 * user data deletion policy. Must stay reachable without signing in.
 */
const DeleteAccount = () => {
  const url = 'https://mcqsai.com/delete-account';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Delete Your Account & Data',
    url,
    dateModified: UPDATED,
    publisher: { '@type': 'EducationalOrganization', name: 'MCQsAI', url: 'https://mcqsai.com' },
    about: 'How to permanently delete your MCQsAI account and personal data.',
  };

  return (
    <Header>
      <SEOHead
        title="Delete Your Account & Data"
        description="How to permanently delete your MCQsAI account and personal data — from inside the app, or by email request if you have lost access to your account."
        keywords="MCQsAI delete account, data deletion request, remove my data"
        url={url}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Delete Account', path: '/delete-account' },
        ]}
      />
      <Helmet>
        <script type="application/ld+json">{safeJsonLd(jsonLd)}</script>
      </Helmet>

      <article className="container mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Last updated{' '}
            {new Date(UPDATED).toLocaleDateString('en-PK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Delete Your Account &amp; Data
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            You can delete your MCQsAI account and all personal data at any time. Deletion is
            permanent and cannot be undone — this applies to accounts created with email, Google,
            Facebook, or Microsoft sign-in.
          </p>
        </header>

        <div className="space-y-6">
          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Trash2 className="h-5 w-5 text-primary" /> Delete from inside the app
            </h2>
            <ol className="text-sm text-muted-foreground leading-relaxed list-decimal pl-5 space-y-1">
              <li>Sign in to your MCQsAI account.</li>
              <li>
                Open <span className="text-foreground font-medium">Profile &amp; Settings</span> from
                the account menu.
              </li>
              <li>
                Scroll to the <span className="text-foreground font-medium">Delete Account</span>{' '}
                section and tap <span className="text-foreground font-medium">Delete My Account</span>.
              </li>
              <li>Read the confirmation notice, type DELETE to confirm, and submit.</li>
            </ol>
            <div className="mt-4">
              <Button asChild className="min-h-11">
                <Link to="/profile">Go to Profile &amp; Settings</Link>
              </Button>
            </div>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Mail className="h-5 w-5 text-primary" /> No longer have access to your account?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-foreground">
                {SUPPORT_EMAIL}
              </a>{' '}
              from the address you registered with, using the subject line{' '}
              <span className="text-foreground font-medium">"Account Deletion Request"</span>. Include
              your registered email address or username so we can locate the account. We may ask one
              verification question before deleting, to make sure nobody else can remove your data.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Clock className="h-5 w-5 text-primary" /> How long it takes
            </h2>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
              <li>
                <span className="text-foreground font-medium">In-app deletion:</span> immediate — your
                account and data are removed as soon as you confirm.
              </li>
              <li>
                <span className="text-foreground font-medium">Email request:</span> processed within 30
                days, usually within 7 working days. You get a confirmation email once it is done.
              </li>
              <li>
                Encrypted backups roll off automatically within 30 days of deletion.
              </li>
            </ul>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> What gets deleted
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your login identity (including any linked Google, Facebook, or Microsoft connection),
              profile details, test attempts and scores, progress and mastery records, badges,
              credits, saved syllabi, notifications, feedback linked to your account, and email
              preferences. Anonymous, aggregated statistics that cannot identify you may be retained,
              and any public educational content you contributed stays online with your personal link
              removed.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              <span className="text-foreground font-medium">Please note:</span> deleting your MCQsAI
              account does not delete your Facebook, Google, or Microsoft account. We only remove the
              connection between that account and MCQsAI, along with the data we stored about you.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              See our{' '}
              <Link to="/privacy-policy" className="underline text-foreground">
                Privacy Policy
              </Link>{' '}
              for full details on how we handle your data.
            </p>
          </section>
        </div>
      </article>
    </Header>
  );
};

export default DeleteAccount;
