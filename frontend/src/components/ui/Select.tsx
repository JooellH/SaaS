import { forwardRef, SelectHTMLAttributes } from "react";
import clsx from "clsx";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx(
        "input-field",
        "min-h-[44px]", // touch target
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = "Select";
