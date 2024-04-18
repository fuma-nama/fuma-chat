"use client";

import React from "react";
import Pusher from "pusher-js";
import { useEffect } from "react";
import { useStore } from "./store";
import { Schema } from "../server/types";

const appId = process.env.NEXT_PUBLIC_PUSHER_API_KEY!;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
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

  channel.bind("my-event", (data: Schema["channel"]["my-event"]) => {
    useStore.setState((prev) => ({
      messages: [...prev.messages, data],
    }));
  });
}

export function usePusher(): Pusher | undefined {
  return useStore((s) => s.pusher);
}
