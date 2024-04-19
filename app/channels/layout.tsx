"use client";

import { CreateGroup } from "@/components/function/create-group";
import { typedPoster, useQuery } from "@/lib/client/fetcher";
import { cn } from "@/lib/cn";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWRMutation from "swr/mutation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const query = useQuery("/api/channels");
  const mutation = useSWRMutation(
    ["/api/channels", undefined] as const,
    ([key]) => typedPoster(key, { bodyJson: { name: "Hello" } })
  );
  const { channel: channelId } = useParams();

  return (
    <main className="flex h-dvh flex-row">
      <div className="flex flex-col border-r bg-neutral-800/50 border-neutral-700 p-4 w-[280px] relative overflow-auto">
        {user && (
          <Link
            href="/profile"
            className="flex flex-row gap-3 items-center text-sm px-4 -mx-4 pb-4 border-b border-neutral-700 mb-4"
          >
            <Image
              alt="avatar"
              src={user.imageUrl}
              width={32}
              height={32}
              className="rounded-full size-8"
              unoptimized
            />
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-xs text-neutral-400">Click to view profile</p>
            </div>
          </Link>
        )}

        {query.data?.map((channel) => (
          <Link
            key={channel.id}
            href={`/channels/${channel.id}`}
            className={cn(
              "rounded-lg text-neutral-50 font-medium text-sm px-4 py-3 -mx-2",
              channelId === channel.id ? "bg-blue-500" : "hover:bg-neutral-800"
            )}
          >
            {channel.name}
          </Link>
        ))}
        <CreateGroup />
      </div>
      <div className="flex flex-col flex-1 overflow-auto">{children}</div>
    </main>
  );
}
