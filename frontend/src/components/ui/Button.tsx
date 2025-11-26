import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-purple-600 to-indigo-500 px-4 py-2 text-white shadow-lg shadow-indigo-500/20 hover:translate-y-[-1px] hover:shadow-xl hover:shadow-indigo-500/25 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed",
  secondary:
    "bg-white/10 px-4 py-2 text-slate-100 border border-white/10 backdrop-blur hover:bg-white/15 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed",
  ghost:
    "px-3 py-2 text-slate-200 hover:text-white hover:bg-white/5 border border-transparent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
