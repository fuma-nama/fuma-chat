"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import {cn} from "@/lib/cn";
import {cva} from "class-variance-authority";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

export const popoverVariants = cva("z-50 w-72 rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-neutral-50 shadow-lg outline-none data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out")

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({className, align = "center", sideOffset = 4, ...props}, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                popoverVariants(),
                className
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export {Popover, PopoverTrigger, PopoverContent};
