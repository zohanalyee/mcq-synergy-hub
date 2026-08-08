import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <Header>
      <SEOHead
        title="Privacy Policy"
        description="How MCQsAI collects, uses, and protects your data — account details, test performance, and analytics. Read our privacy commitments for Pakistani students."
      />
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
              <li>Google AdSense (for displaying advertisements)</li>
              <li>Supabase (for secure data storage)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Cookies & Advertising</h2>
            <p>
              We use cookies and similar technologies to keep you signed in, remember your
              preferences, and understand how our platform is used. You can disable cookies in
              your browser settings, though some features may not work as intended.
            </p>
            <p className="mt-3">
              We use Google AdSense to serve advertisements on this site. Google, as a
              third-party vendor, uses cookies (including the DoubleClick advertising cookie)
              to serve ads based on your prior visits to this and other websites. This enables
              Google and its partners to show relevant ads to you.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                You may opt out of personalized advertising by visiting{' '}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Google Ads Settings
                </a>.
              </li>
              <li>
                Learn more about how Google uses data at{' '}
                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Google's Privacy &amp; Terms
                </a>.
              </li>
              <li>
                You can opt out of third-party vendor cookies at{' '}
                <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.aboutads.info
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Analytics</h2>
            <p>
              We use Google Analytics 4 to understand which pages are useful and where visitors
              drop off. It sets cookies and records page views, approximate location (country/city
              level), device type and referral source. We do not send your name or email to
              Analytics.
            </p>
            <p className="mt-3">
              You can prevent Google Analytics from collecting your data using the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Children&apos;s Privacy</h2>
            <p>
              MCQsAI is intended for students aged 13 and above. We do not knowingly collect
              personal information from children under 13. If you believe a child under 13 has
              created an account, email us and we will delete the account and its data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account details are kept while your account is active.</li>
              <li>
                Test attempts, scores and progress history are kept while your account is active so
                your analytics and AI coach recommendations remain accurate.
              </li>
              <li>
                After you request deletion, account data is removed within 30 days. Aggregated,
                non-identifying statistics (for example total attempts on a topic) may be retained.
              </li>
              <li>Server and security logs are retained for up to 12 months.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. We Do Not Sell Your Data</h2>
            <p>
              We do not sell, rent or trade your personal information. Data is shared only with the
              service providers listed above (analytics, advertising, hosting and database), and
              only to the extent needed to operate the platform, or where we are required to do so
              by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request data deletion</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{' '}
              <a href="mailto:privacy@mcqsai.com" className="text-primary hover:underline">privacy@mcqsai.com</a>{' '}
              from the address on your account. We acknowledge requests within 48 hours and aim to
              complete them within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Changes to This Policy</h2>
            <p>
              We may update this policy as the platform evolves. The &quot;Last Updated&quot; date
              at the top of the page always reflects the current version, and material changes will
              be announced on the site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
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
