import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
  return Math.min(strength, 100);
};

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  const label = strength < 40 ? "Weak" : strength < 70 ? "Medium" : "Strong";
  const color = strength < 40 ? "bg-destructive" : strength < 70 ? "bg-yellow-500" : "bg-green-500";
  const textColor = strength < 40 ? "text-destructive" : strength < 70 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";

  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={`font-medium ${textColor}`}>{label}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${strength}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use 8+ characters with mix of letters, numbers & symbols
      </p>
    </div>
  );
};

export default PasswordStrengthIndicator;
