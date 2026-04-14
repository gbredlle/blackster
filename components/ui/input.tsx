import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex w-full rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm outline-none ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
