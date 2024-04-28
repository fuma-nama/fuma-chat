"use client";

import React from "react";
import Pusher from "pusher-js";
import {useEffect} from "react";
import {useStore} from "./store";
import {Realtime} from "../server/types";
import {useQuery} from "./fetcher";
import {useUser} from "@clerk/nextjs";

const appId = process.env.NEXT_PUBLIC_PUSHER_API_KEY!;

export function RealtimeProvider({children}: { children: React.ReactNode }) {
    const auth = useUser();
    const query = useQuery(["/api/channels", undefined]);

    useEffect(() => {
        const data = query.data;
        const pusher = useStore.getState().pusher;
        if (!pusher || !data) return;

        for (const item of data) {
            const channel = pusher.subscribe(item.id);
            channel.unbind_all();

            channel.bind(
                "message-send",
                (data: Realtime["channel"]["message-send"]) => {
                    const channel = useStore.getState().getChannel(data.channelId)

                    channel.setMessage([...channel.messages, data])
                }
            );
            channel.bind(
                "message-delete",
                (data: Realtime["channel"]["message-delete"]) => {
                    const channel = useStore.getState().getChannel(data.channelId)

                    channel.setMessage(channel.messages.filter(m => m.id !== data.id))
                }
            );
        }
    }, [query.data]);

    useEffect(() => {
        const pusher = useStore.getState().pusher;
        if (pusher || !auth.isSignedIn) return;

        const instance = new Pusher(appId, {
            cluster: "us3",
        });

        init(instance);

        useStore.setState({pusher: instance});
    }, [auth]);

    return <>{children}</>;
}

function init(pusher: Pusher) {
}

export function usePusher(): Pusher | undefined {
    return useStore((s) => s.pusher);
}
