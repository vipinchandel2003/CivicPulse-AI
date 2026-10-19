import React from "react";
import { cn } from "./utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "interactive";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-xl",
      bordered: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl",
      interactive: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all"
    };

    return (
      <div ref={ref} className={cn("p-4", variants[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
