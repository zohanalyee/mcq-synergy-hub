import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ResultAdviceCardProps {
  name?: string;
  score: number;
  subject?: string;
  topic?: string;
  weakTopic?: string;
  strongTopic?: string;
}

const getAdvice = (
  score: number,
  name: string,
  subject: string,
  topic: string,
  weakTopic: string,
  strongTopic: string
): { emoji: string; message: string; color: string } => {
  const n = name || 'Bhai';
  const s = subject || topic || 'is subject';
  const w = weakTopic || topic || 'weak topics';
  const st = strongTopic || s;

  if (score >= 90) return {
    emoji: '🏆',
    color: 'from-emerald-500 to-green-400',
    message: `Mashallah ${n}! ${score}% — tu toh ${s} ka ustaad ban gaya! Agli baar 50 questions try kar aur apna record tod!`,
  };
  if (score >= 75) return {
    emoji: '💪',
    color: 'from-blue-500 to-indigo-400',
    message: `Wah bhai wah! ${score}% — solid performance! ${st} mein toh chhaa gaya! Bas ${w} pe 10 min aur de — perfect ho jayega!`,
  };
  if (score >= 60) return {
    emoji: '😊',
    color: 'from-purple-500 to-violet-400',
    message: `Theek hai yaar ${score}%! ${w} thoda weak lag raha hai — kal wahi topic se shuru karna. Tu kar sakta hai!`,
  };
  if (score >= 50) return {
    emoji: '😐',
    color: 'from-amber-500 to-yellow-400',
    message: `${score}% — ho sakta tha better ${n}! ${w} mein aur practice chahiye. Aaj raat 15 min nikal — kal result khud dikhega!`,
  };
  if (score >= 35) return {
    emoji: '😅',
    color: 'from-orange-500 to-amber-400',
    message: `Arre yaar ${score}%? Reels band kar thori der ke liye! ${w} dobara karo — abhi nahi toh exam mein pachtaoge! Chal uth!`,
  };
  return {
    emoji: '💙',
    color: 'from-rose-500 to-pink-400',
    message: `${score}% bhai seriously? Koi baat nahi — sab ka bura din hota hai! Kal ${w} se fresh start karo — sirf 5 questions. Bas mat chhodna!`,
  };
};

const ResultAdviceCard: React.FC<ResultAdviceCardProps> = ({
  name,
  score,
  subject,
  topic,
  weakTopic,
  strongTopic,
}) => {
  const navigate = useNavigate();
  const advice = getAdvice(
    score,
    name || 'Bhai',
    subject || '',
    topic || '',
    weakTopic || '',
    strongTopic || ''
  );

  return (
    <div className={`mt-3 rounded-xl p-[2px] bg-gradient-to-br ${advice.color} shadow-md`}>
      <div className="rounded-xl bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${advice.color} flex items-center justify-center text-xl shadow-sm`}>
            {advice.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
              🤖 Ustaad Ki Advice
            </p>
            <p className="text-xs leading-relaxed text-foreground">
              {advice.message}
            </p>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="mt-2 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              📊 Dashboard mein apni detailed performance dekho →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultAdviceCard;
