import { HTMLAttributes, ReactElement } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type Variant = "error" | "success";

const styles: Record<Variant, string> = {
  error: "border-red-400/30 bg-red-500/10 text-red-100",
  success: "border-green-400/30 bg-green-500/10 text-green-100",
};

const icons: Record<Variant, ReactElement> = {
  error: <AlertTriangle className="w-4 h-4" />,
  success: <CheckCircle2 className="w-4 h-4" />,
};

type Props = HTMLAttributes<HTMLDivElement> & {
  variant: Variant;
  message: string;
};

export function FormFeedback({ variant, message, className, ...props }: Props) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
        styles[variant],
        className,
      )}
      role={variant === "error" ? "alert" : "status"}
      {...props}
    >
      {icons[variant]}
      {message}
    </div>
  );
}
