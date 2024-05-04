import React, {TextareaHTMLAttributes} from "react";
import {cn} from "@/lib/cn";
import {inputVariants} from "@/components/primitive";

export const DynamicTextArea = React.forwardRef<HTMLDivElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({
         className,
         ...props
     }, ref) => {

        return <div ref={ref}
                    className={cn("grid overflow-auto *:col-[1/2] *:row-[1/2]", className)}>
            <div
                className={cn(
                    inputVariants({
                        className: "whitespace-pre-wrap invisible overflow-hidden",
                        variant: "rounded",
                    })
                )}
            >
                {(props.value || props.defaultValue) + " "}
            </div>
            <textarea
                className={cn(
                    inputVariants({
                        className: "resize-none",
                        variant: "rounded",
                    })
                )}
                {...props}
            />
        </div>
    })

DynamicTextArea.displayName = 'DynamicTextArea'