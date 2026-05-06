import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact MCQsAI',
  description: 'Get in touch with the MCQsAI team for support, feedback, or partnerships.',
  mainEntity: {
    '@type': 'Organization',
    name: 'MCQsAI',
    url: 'https://www.mcqsai.com',
    contactPoint: [
      { '@type': 'ContactPoint', email: 'hello@mcqsai.com', contactType: 'general inquiry' },
      { '@type': 'ContactPoint', email: 'support@mcqsai.com', contactType: 'customer support' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Karachi',
      addressRegion: 'Sindh',
      addressCountry: 'PK',
    },
  },
};

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_inquiries')
        .insert({
          name: result.data.name,
          email: result.data.email,
          subject: result.data.subject,
          message: result.data.message,
        });

      if (error) {
        console.error('Error submitting inquiry:', error);
        toast.error('Failed to send message. Please try again.');
        return;
      }

      setIsSuccess(true);
      toast.success("Message sent! We'll get back to you soon.");
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Header>
      <SEOHead
        title="Contact Us"
        description="Get in touch with MCQsAI team. We'd love to hear from you about suggestions, feedback, or partnerships."
        keywords="contact MCQsAI, support, feedback, help"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <PageHeader
          icon={MessageSquare}
          title="Contact Us"
          tagline="We'd love to hear from you"
          description="Questions, feedback or partnerships — drop us a message and we'll respond within 24 hours."
        />

        <div className="grid md:grid-cols-5 gap-8">
          {/* Form */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center min-h-[300px]"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h2>
                  <p className="text-muted-foreground">Thank you for contacting us. We'll respond within 24 hours.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={formData.name} onChange={e => update('name', e.target.value)} placeholder="Your name" disabled={isSubmitting} />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" disabled={isSubmitting} />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={formData.subject} onChange={e => update('subject', e.target.value)} placeholder="How can we help?" disabled={isSubmitting} />
                    {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" rows={5} value={formData.message} onChange={e => update('message', e.target.value)} placeholder="Your message..." disabled={isSubmitting} />
                    {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Info cards */}
          <div className="md:col-span-2 space-y-4">
            {[
              { icon: Mail, title: 'Email', lines: ['hello@mcqsai.com', 'support@mcqsai.com'] },
              { icon: Phone, title: 'Phone', lines: ['+92 300 1234567', 'Mon-Fri, 9 AM - 6 PM (PKT)'] },
              { icon: MapPin, title: 'Address', lines: ['Karachi, Sindh', 'Pakistan'] },
            ].map(card => (
              <div key={card.title} className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{card.title}</h3>
                  {card.lines.map((line, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </Header>
  );
};

export default Contact;
