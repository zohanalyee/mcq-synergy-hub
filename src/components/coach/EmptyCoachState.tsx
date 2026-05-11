import { BookOpen, Brain, Briefcase, Target } from 'lucide-react';
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
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 rounded-2xl p-8 text-white text-center shadow-lg">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {getText(
              '👋 Welcome to AI Personal Coach!',
              '👋 AI Personal Coach میں خوش آمدید!',
              '👋 AI Personal Coach ۾ ڀلي ڪري آيا!'
            )}
          </h2>
          <p className="text-white/80 text-sm mb-6">
            {getText(
              "You haven't attempted any tests yet. Pick an option below to start:",
              'آپ نے ابھی تک کوئی ٹیسٹ attempt نہیں کیا۔ شروع کرنے کے لیے نیچے سے منتخب کریں:',
              'توهان اڃا تائين ڪو به ٽيسٽ attempt نه ڪيو آهي. هيٺان چونڊيو:'
            )}
          </p>
        </div>
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
              <button
                onClick={() => navigate(item.path)}
                className="w-full text-left border-2 border-purple-200 dark:border-purple-900/40 rounded-xl p-4 flex items-center gap-3 bg-card hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
              >
                <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
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
              </button>
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
