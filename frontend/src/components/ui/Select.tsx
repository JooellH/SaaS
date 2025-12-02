import { forwardRef, SelectHTMLAttributes } from "react";
import clsx from "clsx";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx(
        "input-field",
        "h-12",
        "w-full max-w-full overflow-hidden",   // ← FIX REAL
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = "Select";
