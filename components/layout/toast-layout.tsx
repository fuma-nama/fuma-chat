'use client'
import {useToastStore} from "@/lib/client/store";
import {Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport} from "@/components/toast";

export function ToastLayout({children}: { children: React.ReactNode }) {
    const toasts = useToastStore(s => s.toasts)

    return <ToastProvider>
        {children}
        <ToastViewport>
            {toasts.map((t) => <Toast key={t.id} variant={t.type}>
                <ToastTitle>{t.title}</ToastTitle>
                <ToastDescription>{t.description}</ToastDescription>
                <ToastClose/>
            </Toast>)}
        </ToastViewport>
    </ToastProvider>
}