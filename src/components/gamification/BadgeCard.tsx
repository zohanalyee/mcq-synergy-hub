import { Card } from "@/components/ui/card";

interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  category?: string;
  awardedAt?: string;
  compact?: boolean;
}

const BadgeCard = ({ name, description, icon, category, awardedAt, compact = false }: BadgeCardProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 text-center hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-3xl">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{name}</h3>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      {category && (
        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
          {category}
        </span>
      )}
      {awardedAt && (
        <p className="text-xs text-muted-foreground mt-2">
          Earned {new Date(awardedAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
};

export default BadgeCard;
