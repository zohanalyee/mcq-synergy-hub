interface AdBannerProps {
  size: 'leaderboard' | 'rectangle' | 'sidebar' | 'mobile';
  position?: string;
}

const sizeClasses: Record<AdBannerProps['size'], string> = {
  leaderboard: 'w-full h-24',
  rectangle: 'w-80 h-64',
  sidebar: 'w-40 h-[600px]',
  mobile: 'w-full h-16',
};

const AdBanner = ({ size, position }: AdBannerProps) => {
  return (
    <div className={`${sizeClasses[size]} mx-auto rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-muted-foreground`}>
      <p className="text-xs font-medium">Advertisement</p>
      {position && <p className="text-[10px]">{position}</p>}
    </div>
  );
};

export default AdBanner;
