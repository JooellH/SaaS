import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "input-field",
        "h-12",
        "w-full max-w-full",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
