"use client";

import React from "react";
import Pusher from "pusher-js";
import { useEffect } from "react";
import { useStore } from "./store";
import { Realtime } from "../server/types";
import { useQuery } from "./fetcher";

const appId = process.env.NEXT_PUBLIC_PUSHER_API_KEY!;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const query = useQuery("/api/channels", undefined);

  useEffect(() => {
    const data = query.data;
    const pusher = useStore.getState().pusher;
    if (!pusher || !data) return;

    for (const item of data) {
      const channel = pusher.subscribe(item.id);
      channel.unbind_all();

      channel.bind("my-event", (data: Realtime["channel"]["my-event"]) => {
        useStore.setState((prev) => ({
          messages: new Map(prev.messages).set(item.id, [
            ...(prev.messages.get(item.id) ?? []),
            data,
          ]),
        }));
      });
    }
  }, [query.data]);

  useEffect(() => {
    const pusher = useStore.getState().pusher;
    if (pusher) return;

    const instance = new Pusher(appId, {
      cluster: "us3",
    });

    init(instance);

    useStore.setState({ pusher: instance });
  }, []);

  return <>{children}</>;
}

function init(pusher: Pusher) {
  const channel = pusher.subscribe("my-channel");
}

export function usePusher(): Pusher | undefined {
  return useStore((s) => s.pusher);
}
