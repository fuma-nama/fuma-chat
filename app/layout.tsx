import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ClerkProvider} from "@clerk/nextjs";
import {dark} from "@clerk/themes";
import {RealtimeProvider} from "@/lib/client/pusher";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Fuma Chat",
    description: "A chat app",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider
            appearance={{
                baseTheme: dark,
            }}
        >
            <RealtimeProvider>
                <html lang="en">
                <body className={inter.className}>{children}</body>
                </html>
            </RealtimeProvider>
        </ClerkProvider>
    );
}
