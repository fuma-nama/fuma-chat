"use client";

import { SendIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useStore } from "@/lib/client/store";
import useSWR from "swr";

export default function Home() {
  const { user } = useUser();
  const [value, setValue] = useState("");
  const messages = useStore((s) => s.messages);
  const query = useSWR(
    "/api/messages",
    (key) => fetch(key).then((res) => res.json()),
    {
      onSuccess(data) {
        useStore.setState({ messages: data });
      },
    }
  );

  return (
    <main className="flex h-dvh flex-row">
      <div className="border-r bg-neutral-800/50 border-neutral-700 p-8 w-[280px]">
        <h1 className="font-semibold text-xl">Hello, {user?.fullName}</h1>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 h-12 flex flex-row items-center px-8 bg-neutral-900/50 backdrop-blur-lg">
          <p className="font-medium">Chat</p>
        </div>
        <div className="flex flex-col gap-6 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="p-4 font-medium mx-4 rounded-xl bg-neutral-800/50"
            >
              {message.message}
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 flex flex-row items-center bg-neutral-900/50 px-8 pb-4 mt-auto gap-2 backdrop-blur-lg">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-2xl px-3 py-2 text-sm transition-colors focus:outline-none placeholder:text-neutral-400 focus-visible:bg-neutral-800"
          />
          <button
            aria-label="send message"
            className="size-9 bg-blue-500 font-medium text-sm text-nuetral-50 rounded-full p-2.5 transition-colors hover:bg-blue-600"
            onClick={() => {
              void fetch("/api/messages", {
                method: "POST",
                body: JSON.stringify({ content: value }),
              });
            }}
          >
            <SendIcon className="size-full" />
          </button>
        </div>
      </div>
    </main>
  );
}
