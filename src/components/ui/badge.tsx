import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1",
    {
        variants: {
            variant: {
                default: "border-transparent bg-indigo-600 text-white hover:bg-indigo-700",
                secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
                destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
                outline: "border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
