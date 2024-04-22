"use client";

import { SendIcon } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/client/store";
import { typedFetch, useQuery } from "@/lib/client/fetcher";
import { cn } from "@/lib/cn";
import { inputVariants } from "@/components/primitive";
import Image from "next/image";
import type { Channel, Message } from "@/lib/server/types";
import { useAuth } from "@clerk/nextjs";
import { EditGroup } from "@/components/function/edit-group";
import { useMutation } from "@/lib/client/use-mutation";
import { useParams } from "next/navigation";

export default function View({
  params,
  channelInfo,
}: {
  params: { channel: string };
  channelInfo: Channel;
}) {
  const messages = useStore((s) => s.messages.get(params.channel) ?? []);
  const auth = useAuth();

  useQuery(["/api/messages", { channelId: params.channel }], undefined, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    onSuccess(data) {
      useStore.setState((prev) => ({
        messages: new Map(prev.messages).set(params.channel, data),
      }));
    },
  });

  if (!auth.isLoaded)
    return <p className="m-auto text-sm text-neutral-400">Loading</p>;

  return (
    <>
      <div className="sticky top-0 flex flex-row items-center px-4 bg-neutral-900/50 backdrop-blur-lg min-h-12">
        <p className="font-medium text-sm">{channelInfo.name}</p>
        <EditGroup channel={channelInfo} />
      </div>
      <div className="flex flex-col gap-6 py-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
      <Sendbar />
    </>
  );
}

function Sendbar() {
  const [text, setText] = useState("");

  const params = useParams() as { channel: string };
  const mutation = useMutation(
    ({ message }: { message: string }) =>
      typedFetch("/api/messages:post", {
        channelId: params.channel,
        message,
      }),
    {
      mutateKey: ["/api/messages", { channelId: params.channel }] as const,
      onSuccess() {
        setText("");
      },
      revalidate: false,
    }
  );

  return (
    <div className="sticky bottom-0 flex flex-row bg-neutral-900/50 px-4 pb-4 mt-auto gap-2 backdrop-blur-lg">
      <div className="grid flex-1 max-h-[20vh] overflow-auto *:overflow-hidden *:col-[1/2] *:row-[1/2]">
        <div
          className={cn(
            inputVariants({
              className: "whitespace-pre-wrap invisible",
              variant: "rounded",
            })
          )}
        >
          {text + " "}
        </div>
        <textarea
          value={text}
          disabled={mutation.isMutating}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              mutation.trigger({ message: text });
              e.preventDefault();
            }
          }}
          className={cn(
            inputVariants({
              className: "resize-none",
              variant: "rounded",
            })
          )}
        />
      </div>
      <button
        aria-label="send message"
        className="size-9 bg-blue-500 font-medium text-sm text-nuetral-50 rounded-full p-2.5 mt-2 transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={mutation.isMutating}
        onClick={() => mutation.trigger({ message: text })}
      >
        <SendIcon className="size-full" />
      </button>
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const auth = useAuth();

  if (auth.userId === message.user.id) {
    return (
      <div className="flex flex-row gap-2 ms-auto me-4 max-w-[70%]">
        <p className="p-2 rounded-xl bg-blue-500 text-sm whitespace-pre-wrap">
          {message.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 ms-4 max-w-[70%]">
      <Image
        alt="avatar"
        src={message.user.imageUrl}
        width={32}
        height={32}
        className="rounded-full size-8 min-w-8 mt-auto"
        unoptimized
      />
      <div>
        <p className="text-xs text-neutral-400 px-2 mb-1">
          {message.user.name}
        </p>

        <p className="p-2 rounded-xl bg-neutral-800 text-sm whitespace-pre-wrap">
          {message.message}
        </p>
      </div>
    </div>
  );
}
