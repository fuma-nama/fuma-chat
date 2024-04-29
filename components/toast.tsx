"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import {cva, type VariantProps} from "class-variance-authority"
import {X} from "lucide-react"

import {cn} from "@/lib/cn"
import {buttonVariants} from "@/components/primitive";

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({className, ...props}, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
            className
        )}
        {...props}
    />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
    "flex flex-col group relative flex w-full overflow-hidden rounded-lg p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out data-[swipe=end]:animate-none",
    {
        variants: {
            variant: {
                default: "border border-neutral-700 bg-neutral-800 text-neutral-50",
                destructive:
                    "border border-red-400 bg-neutral-900 text-neutral-50",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Toast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({className, variant, ...props}, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({variant}), className)}
            {...props}
        />
    )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({className, ...props}, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            buttonVariants({color: 'ghost'}),
            className
        )}
        {...props}
    />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({className, ...props}, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            buttonVariants({color: 'ghost', size: 'icon', className: 'absolute right-2 top-2 text-neutral-400'}),
            className
        )}
        {...props}
    >
        <X className="size-4"/>
    </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({className, ...props}, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn("text-sm font-semibold mb-2", className)}
        {...props}
    />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({className, ...props}, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn("text-sm text-neutral-400", className)}
        {...props}
    />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
    type ToastProps,
    type ToastActionElement,
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
}
