import { BookOpen, Brain, Briefcase, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

const suggestions = [
  {
    icon: Target,
    titleEn: 'Create Custom Test',
    titleUr: 'اپنا ٹیسٹ بنائیں',
    titleSd: 'پنهنجو ٽيسٽ ٺاهيو',
    descEn: 'Build your own test with Syllabus Builder',
    descUr: 'Syllabus Builder سے اپنا ٹیسٹ بنائیں',
    descSd: 'Syllabus Builder سان پنهنجو ٽيسٽ ٺاهيو',
    path: '/custom-syllabus',
    color: 'text-blue-500',
  },
  {
    icon: Brain,
    titleEn: 'Browse Boards',
    titleUr: 'بورڈز دیکھیں',
    titleSd: 'بورڊز ڏسو',
    descEn: 'Explore board-wise MCQ practice',
    descUr: 'بورڈ کے مطابق MCQs کی پریکٹس',
    descSd: 'بورڊ جي لحاظ کان MCQs جي مشق',
    path: '/boards',
    color: 'text-purple-500',
  },
  {
    icon: BookOpen,
    titleEn: 'Browse Subjects',
    titleUr: 'مضامین دیکھیں',
    titleSd: 'مضمون ڏسو',
    descEn: 'Practice subject-wise MCQs',
    descUr: 'مضمون کے مطابق MCQs کی پریکٹس',
    descSd: 'مضمون جي لحاظ کان MCQs جي مشق',
    path: '/subjects',
    color: 'text-emerald-500',
  },
  {
    icon: Briefcase,
    titleEn: 'Ready-Made Tests',
    titleUr: 'تیار شدہ ٹیسٹ',
    titleSd: 'تيار ڪيل ٽيسٽ',
    descEn: 'Try Job and Entry test papers',
    descUr: 'Job اور Entry ٹیسٹ آزمائیں',
    descSd: 'نوڪري ۽ داخلا ٽيسٽ آزمايو',
    path: '/mock-tests',
    color: 'text-amber-500',
  },
];

const EmptyCoachState = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const getText = (en: string, ur: string, sd: string) =>
    language === 'ur' ? ur : language === 'sd' ? sd : en;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center pb-3 pt-5">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">
              {getText(
                '👋 Welcome to AI Personal Coach!',
                '👋 AI Personal Coach میں خوش آمدید!',
                '👋 AI Personal Coach ۾ ڀلي ڪري آيا!'
              )}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {getText(
                "You haven't attempted any tests yet. Pick an option below to start:",
                'آپ نے ابھی تک کوئی ٹیسٹ attempt نہیں کیا۔ شروع کرنے کے لیے نیچے سے منتخب کریں:',
                'توهان اڃا تائين ڪو به ٽيسٽ attempt نه ڪيو آهي. هيٺان چونڊيو:'
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
            >
              <Card
                className="hover:shadow-md transition-shadow cursor-pointer group h-full"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted group-hover:scale-110 transition-transform ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5">
                      {getText(item.titleEn, item.titleUr, item.titleSd)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {getText(item.descEn, item.descUr, item.descSd)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {getText(
          '💪 Every expert was once a beginner. Start learning today!',
          '💪 ہر بڑا سفر ایک چھوٹے قدم سے شروع ہوتا ہے۔ آج ہی شروع کریں!',
          '💪 هر وڏو سفر هڪ ننڍڙي قدم سان شروع ٿئي ٿو۔ اڄ ئي شروع ڪريو!'
        )}
      </p>
    </div>
  );
};

export default EmptyCoachState;
