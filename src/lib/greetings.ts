export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return { text: 'Good morning', emoji: '👋', timeOfDay: 'morning' as const };
  } else if (hour >= 12 && hour < 17) {
    return { text: 'Good afternoon', emoji: '☀️', timeOfDay: 'afternoon' as const };
  } else if (hour >= 17 && hour < 21) {
    return { text: 'Good evening', emoji: '🌙', timeOfDay: 'evening' as const };
  } else {
    return { text: 'Hello', emoji: '✨', timeOfDay: 'night' as const };
  }
};

export const getPersonalizedGreeting = (userName: string | null) => {
  const { text, emoji } = getTimeBasedGreeting();
  if (!userName) return `Welcome! ${emoji}`;
  return `${text}, ${userName}! ${emoji}`;
};

export const getUrduGreeting = (userName: string | null) => {
  const hour = new Date().getHours();
  if (!userName) return 'خوش آمدید! 👋';

  if (hour >= 5 && hour < 12) return `صبح بخیر، ${userName}! 👋`;
  if (hour >= 12 && hour < 17) return `دوپہر بخیر، ${userName}! ☀️`;
  if (hour >= 17 && hour < 21) return `شام بخیر، ${userName}! 🌙`;
  return `السلام علیکم، ${userName}! ✨`;
};

export const getSindhiGreeting = (userName: string | null) => {
  const hour = new Date().getHours();
  if (!userName) return 'ڀلي ڪري آيا! 👋';

  if (hour >= 5 && hour < 12) return `صبح جو سلام، ${userName}! 👋`;
  if (hour >= 12 && hour < 17) return `منجهند جو سلام، ${userName}! ☀️`;
  if (hour >= 17 && hour < 21) return `شام جو سلام، ${userName}! 🌙`;
  return `السلام عليڪم، ${userName}! ✨`;
};

export const getLocalizedGreeting = (
  language: string,
  userName: string | null
): string => {
  switch (language) {
    case 'ur': return getUrduGreeting(userName);
    case 'sd': return getSindhiGreeting(userName);
    default: return getPersonalizedGreeting(userName);
  }
};
