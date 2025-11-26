import clsx from "clsx";
import { HTMLAttributes } from "react";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "skeleton rounded-xl bg-white/10 relative overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
