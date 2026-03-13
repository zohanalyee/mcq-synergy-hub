import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsOfService = () => {
  return (
    <Header>
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
            <p>AI-MCQs Point provides educational content "as is" without warranties. We do not guarantee exam success.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Contact</h2>
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
