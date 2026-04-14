import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "outline";
};

export function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  const styles =
    variant === "outline"
      ? "border border-zinc-700 bg-transparent text-zinc-300"
      : "bg-zinc-800 text-zinc-200";

  return (
    <div
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles} ${className}`}
      {...props}
    />
  );
}
