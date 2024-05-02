"use client";

import React from "react";
import Pusher, {Channel as PusherChannel} from "pusher-js";
import {useEffect} from "react";
import {useStore} from "./store";
import {ChannelWithMember, Realtime} from "../server/types";
import {useQuery} from "./fetcher";
import {useUser} from "@clerk/nextjs";

const appId = process.env.NEXT_PUBLIC_PUSHER_API_KEY!;

export function RealtimeProvider({children}: { children: React.ReactNode }) {
    const auth = useUser();
    const pusher = useStore(s => s.pusher)
    const query = useQuery(["/api/channels", undefined]);

    useEffect(() => {
        const data = query.data;
        if (!data) return;

        for (const item of data) {
            updateChannel(item)

            if (pusher) {
                const cachedChannel = pusher.channels.find(item.channel.id)
                if (cachedChannel && cachedChannel.subscribed) continue;

                const channel = pusher.subscribe(item.channel.id)
                initChannel(channel)
            }
        }
    }, [query.data, pusher]);

    useEffect(() => {
        if (pusher || !auth.isSignedIn) return;

        const instance = new Pusher(appId, {
            cluster: "us3",
        });

        useStore.setState({pusher: instance});
    }, [pusher, auth]);

    return <>{children}</>;
}

function updateChannel(data: ChannelWithMember) {
    const channel = useStore.getState().getChannel(data.channel.id)

    channel.update({
        channel: data.channel,
        permissions: data.member.permissions,
        ...channel
    })
}

function initChannel(pusherChannel: PusherChannel) {
    pusherChannel.bind(
        "message-send",
        (data: Realtime["channel"]["message-send"]) => {
            const channel = useStore.getState().getChannel(data.channelId)

            channel.setMessage([...channel.messages, data])
        }
    );

    pusherChannel.bind(
        "message-delete",
        (data: Realtime["channel"]["message-delete"]) => {
            const channel = useStore.getState().getChannel(data.channelId)

            channel.setMessage(channel.messages.filter(m => m.id !== data.id))
        }
    );
}