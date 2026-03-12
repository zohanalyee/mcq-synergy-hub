import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <Header>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: March 12, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name and email address (when you create an account)</li>
              <li>Test performance data and analytics</li>
              <li>Usage information and preferences</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve our services</li>
              <li>To personalize your learning experience</li>
              <li>To send important updates and notifications</li>
              <li>To analyze usage patterns and optimize performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data. All sensitive information is encrypted and stored securely.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Third-Party Services</h2>
            <p>We use trusted third-party services including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Analytics (for usage analytics)</li>
              <li>Supabase (for secure data storage)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
            <p>
              For privacy-related questions, email us at{' '}
              <a href="mailto:privacy@mcqsai.com" className="text-primary hover:underline">privacy@mcqsai.com</a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </Header>
  );
};

export default PrivacyPolicy;
