"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { buttonVariants } from "@/components/primitive";
import { cn } from "@/lib/cn";

export default function Home() {
  const { user } = useUser();

  return (
    <main className="flex h-dvh flex-col items-center justify-center">
      <h1 className="font-semibold text-xl">Hello, {user?.fullName}</h1>

      <Link
        href="/channels"
        className={cn(buttonVariants({ color: "primary", className: "mt-4" }))}
      >
        Getting Started
      </Link>
    </main>
  );
}
