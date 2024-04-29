import {cva} from "class-variance-authority";

export const buttonVariants = cva(
    "rounded-lg text-sm font-medium px-4 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed",
    {
        variants: {
            color: {
                primary: "text-neutral-50 bg-blue-500 hover:bg-blue-600",
                secondary:
                    "text-neutral-100 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700",
                ghost: "bg-transparent hover:text-neutral-50 hover:bg-neutral-700",
                danger: "text-neutral-50 bg-red-500 hover:bg-red-600",
            },
            size: {
                icon: "p-2 rounded-full",
                sm: 'px-2 py-1 text-xs'
            },
        },
        defaultVariants: {
            color: "secondary",
        },
    }
);

export const menuButtonVariants = cva(buttonVariants({className: 'text-left py-2 first:rounded-t-lg rounded-none last:rounded-b-lg transition-none data-[state=open]:bg-neutral-700'}), {
    variants: {
        variant: {
            danger: "text-red-500"
        }
    }
});

export const inputVariants = cva(
    "bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-sm transition-colors focus:outline-none placeholder:text-neutral-400 focus-visible:bg-neutral-800",
    {
        variants: {
            variant: {
                rounded: "rounded-2xl px-3 py-2",
            },
        },
    }
);
