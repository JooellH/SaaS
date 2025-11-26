import { HTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "neutral" | "success" | "danger" | "warning" | "info";

const styles: Record<Variant, string> = {
  neutral: "bg-white/10 border-white/10 text-slate-100",
  success: "bg-green-500/15 border-green-400/30 text-green-100",
  danger: "bg-red-500/15 border-red-400/30 text-red-100",
  warning: "bg-amber-500/15 border-amber-400/30 text-amber-100",
  info: "bg-indigo-500/15 border-indigo-400/30 text-indigo-100",
};

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

export function Badge({ className, variant = "neutral", ...props }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
