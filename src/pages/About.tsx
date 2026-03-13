import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BrainCircuit, Target, BarChart3, Wrench, GraduationCap } from 'lucide-react';

const features = [
  { icon: BrainCircuit, text: '6,000+ high-quality MCQs across 150+ subjects' },
  { icon: Target, text: 'AI-powered test generation and recommendations' },
  { icon: BarChart3, text: 'Detailed analytics and progress tracking' },
  { icon: Wrench, text: '50+ educational tools and calculators' },
  { icon: GraduationCap, text: 'Comprehensive exam prep (MDCAT, ECAT, CSS, etc.)' },
];

const About = () => {
  return (
    <Header>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-6">About MCQSAI</h1>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Our Mission</h2>
            <p className="leading-relaxed">
              AI-MCQs Point is Pakistan's premier AI-powered educational platform, dedicated to helping students excel in competitive exams through intelligent practice and personalized learning.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">What We Offer</h2>
            <ul className="space-y-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <f.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Our Team</h2>
            <p className="leading-relaxed">
              Founded by passionate educators and technologists, we combine pedagogical expertise with cutting-edge AI to revolutionize test preparation in Pakistan.
            </p>
          </section>

          <section>
            <div className="bg-gradient-to-r from-green-50 to-background dark:from-green-900/10 dark:to-card rounded-2xl p-8 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl">🇵🇰</span>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Proudly Pakistani</h2>
                  <p className="text-muted-foreground">Made in Pakistan, Made for Pakistanis</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">🎓 For Pakistani Students</h3>
                  <p className="text-sm text-muted-foreground">Tailored for MDCAT, ECAT, CSS, NUST, and all Pakistani competitive exams</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">🇵🇰 By Pakistani Educators</h3>
                  <p className="text-sm text-muted-foreground">Built by teachers who understand Pakistan's education system</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">🌐 In Pakistani Languages</h3>
                  <p className="text-sm text-muted-foreground">Available in English, Urdu, and Sindhi for maximum accessibility</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Contact Information</h2>
            <ul className="space-y-1.5 text-sm">
              <li>Email: <a href="mailto:hello@mcqsai.com" className="text-primary hover:underline">hello@mcqsai.com</a></li>
              <li>Phone: +92 300 1234567</li>
              <li>Address: Karachi, Sindh, Pakistan</li>
              <li>Business Hours: Mon-Fri, 9 AM - 6 PM (PKT)</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </Header>
  );
};

export default About;
