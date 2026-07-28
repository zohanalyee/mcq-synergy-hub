import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export interface PasswordChecks {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  digit: boolean;
  symbol: boolean;
}

export const getPasswordChecks = (password: string): PasswordChecks => ({
  length: password.length >= 8,
  lowercase: /[a-z]/.test(password),
  uppercase: /[A-Z]/.test(password),
  digit: /\d/.test(password),
  symbol: /[^a-zA-Z0-9]/.test(password),
});

export const passwordMeetsPolicy = (password: string): boolean => {
  const c = getPasswordChecks(password);
  return c.length && c.lowercase && c.uppercase && c.digit && c.symbol;
};

export const getPasswordPolicyError = (password: string): string | null => {
  const c = getPasswordChecks(password);
  const missing: string[] = [];
  if (!c.length) missing.push("at least 8 characters");
  if (!c.uppercase) missing.push("an uppercase letter");
  if (!c.lowercase) missing.push("a lowercase letter");
  if (!c.digit) missing.push("a digit");
  if (!c.symbol) missing.push("a symbol (e.g. !@#$)");
  if (missing.length === 0) return null;
  return `Password must include ${missing.join(", ")}.`;
};

export const calculatePasswordStrength = (password: string): number => {
  const c = getPasswordChecks(password);
  let strength = 0;
  if (c.length) strength += 25;
  if (password.length >= 12) strength += 15;
  if (c.lowercase && c.uppercase) strength += 20;
  if (c.digit) strength += 20;
  if (c.symbol) strength += 20;
  return Math.min(strength, 100);
};

const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
  <li className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
    {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-60" />}
    <span>{label}</span>
  </li>
);

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const checks = useMemo(() => getPasswordChecks(password), [password]);

  const label = strength < 40 ? "Weak" : strength < 80 ? "Medium" : "Strong";
  const color = strength < 40 ? "bg-destructive" : strength < 80 ? "bg-yellow-500" : "bg-green-500";
  const textColor = strength < 40 ? "text-destructive" : strength < 80 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";

  if (!password) {
    return (
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <Rule ok={false} label="8+ characters" />
        <Rule ok={false} label="Uppercase (A-Z)" />
        <Rule ok={false} label="Lowercase (a-z)" />
        <Rule ok={false} label="Digit (0-9)" />
        <Rule ok={false} label="Symbol (!@#$…)" />
      </ul>
    );
  }

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
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
        <Rule ok={checks.length} label="8+ characters" />
        <Rule ok={checks.uppercase} label="Uppercase (A-Z)" />
        <Rule ok={checks.lowercase} label="Lowercase (a-z)" />
        <Rule ok={checks.digit} label="Digit (0-9)" />
        <Rule ok={checks.symbol} label="Symbol (!@#$…)" />
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
