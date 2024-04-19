"use client";

import { SendIcon } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/client/store";
import { typedPoster, useQuery } from "@/lib/client/fetcher";
import useSWRMutation from "swr/mutation";
import { cn } from "@/lib/cn";
import { inputVariants } from "@/components/primitive";

export default function Page({ params }: { params: { channel: string } }) {
  const [value, setValue] = useState("");
  const messages = useStore((s) => s.messages.get(params.channel) ?? []);

  useQuery(
    "/api/messages",
    { params: { channelId: params.channel } },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      onSuccess(data) {
        useStore.setState((prev) => ({
          messages: new Map(prev.messages).set(params.channel, data),
        }));
      },
    }
  );

  const mutation = useSWRMutation(
    ["/api/messages", { channelId: params.channel }] as const,
    ([key, params], { arg }: { arg: string }) =>
      typedPoster(key, {
        bodyJson: { channelId: params.channelId, message: arg },
      }),
    {
      revalidate: false,
    }
  );

  return (
    <>
      <div className="sticky top-0 flex flex-row items-center px-4 bg-neutral-900/50 backdrop-blur-lg min-h-12">
        <p className="font-medium">Chat</p>
      </div>
      <div className="flex flex-col gap-6 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="p-4 text-sm mx-4 rounded-xl bg-neutral-800/50"
          >
            <p className="font-medium mb-2">{message.user}</p>

            <p>{message.message}</p>
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 flex flex-row items-center bg-neutral-900/50 px-4 pb-4 mt-auto gap-2 backdrop-blur-lg">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(
            inputVariants({ className: "flex-1", variant: "rounded" })
          )}
        />
        <button
          aria-label="send message"
          className="size-9 bg-blue-500 font-medium text-sm text-nuetral-50 rounded-full p-2.5 transition-colors hover:bg-blue-600"
          disabled={mutation.isMutating}
          onClick={() => mutation.trigger(value)}
        >
          <SendIcon className="size-full" />
        </button>
      </div>
    </>
  );
}
