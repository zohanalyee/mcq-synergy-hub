interface FlagIconProps {
  countryCode: 'gb' | 'pk';
  className?: string;
}

const flagUrls: Record<string, string> = {
  gb: 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f1ec-1f1e7.svg',
  pk: 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f1f5-1f1f0.svg',
};

export const FlagIcon = ({ countryCode, className = '' }: FlagIconProps) => (
  <img
    src={flagUrls[countryCode]}
    alt={`${countryCode.toUpperCase()} flag`}
    className={`inline-block w-5 h-4 object-contain ${className}`}
  />
);
