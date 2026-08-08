import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsOfService = () => {
  return (
    <Header>
      <SEOHead
        title="Terms of Service"
        description="MCQsAI Terms of Service — account rules, acceptable use, AI-generated content, and limitations for our free exam-preparation platform in Pakistan."
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: March 12, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing MCQSAI, you agree to these Terms of Service. If you disagree, please discontinue use immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 13 years old to create an account</li>
              <li>You are responsible for maintaining account security</li>
              <li>One account per user</li>
              <li>Sharing accounts is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Share or distribute test content without permission</li>
              <li>Use bots or automated tools</li>
              <li>Attempt to hack or disrupt the service</li>
              <li>Violate any laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Intellectual Property</h2>
            <p>All content, including MCQs, analytics, and AI features, is owned by MCQSAI and protected by copyright laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Disclaimer</h2>
            <p>MCQSAI provides educational content "as is" without warranties. We do not guarantee exam success.</p>
            <p className="mt-3 font-medium text-foreground">
              This is an independent educational platform and not affiliated with any official
              government testing agency like FPSC, SPSC, or NTS. All information is for
              preparation purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Advertising &amp; Third-Party Content</h2>
            <p>
              MCQsAI is free to use and is funded in part by advertising. We display ads served by
              Google AdSense and may link to third-party websites (official board portals, exam
              authorities, reference material). We do not control third-party content and are not
              responsible for it. How advertising cookies work is described in our{' '}
              <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, MCQsAI is not liable for any indirect,
              incidental or consequential loss arising from your use of the platform — including
              exam outcomes, missed deadlines, or reliance on content later found to be inaccurate.
              Practice material is a study aid, not an official examination source.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Suspension &amp; Termination</h2>
            <p>
              We may suspend or terminate an account that breaches these Terms — for example
              scraping, automated access, bulk redistribution of question banks, or abuse of other
              users. You may delete your account at any time; see the Privacy Policy for what
              happens to your data afterwards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Changes to These Terms</h2>
            <p>
              We may revise these Terms as the platform develops. The &quot;Last Updated&quot; date
              above reflects the current version, and continued use after a change means you accept
              the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Islamic Republic of Pakistan, and any
              dispute will be subject to the jurisdiction of Pakistani courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
            <p>
              For questions, email us at{' '}
              <a href="mailto:hello@mcqsai.com" className="text-primary hover:underline">hello@mcqsai.com</a>
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </Header>
  );
};

export default TermsOfService;
