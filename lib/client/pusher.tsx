"use client";

import React from "react";
import Pusher, {Channel as PusherChannel} from "pusher-js";
import {useEffect} from "react";
import {useStore} from "./store";
import {API, ChannelWithMember, Realtime} from "../server/types";
import {useQuery} from "./fetcher";
import {useUser} from "@clerk/nextjs";
import {mutate} from "swr";
import {useParams, useRouter} from "next/navigation";

const appId = process.env.NEXT_PUBLIC_PUSHER_API_KEY!;

export function RealtimeProvider({children}: { children: React.ReactNode }) {
    const auth = useUser();
    const pusher = useStore(s => s.pusher)
    const query = useQuery(["/api/channels", undefined]);
    const router = useRouter()
    const params = useParams()

    useEffect(() => {
        const data = query.data;
        if (!data) return;

        const previous = pusher?.channels.all() ?? []
        const next = new Set(data.map(item => getChannelName(item.channel.id)))

        previous.forEach(channel => {
            if (!next.has(channel.name) && channel.subscribed) {
                channel.disconnect()
            }
        })

        for (const item of data) {
            updateChannel(item)

            if (pusher) {
                const name = getChannelName(item.channel.id)
                const cachedChannel = pusher.channels.find(name)

                if (cachedChannel && cachedChannel.subscribed) continue;
                const channel = pusher.subscribe(name)
                initChannel(channel)
            }
        }

        if (typeof params.channel === 'string' && !next.has(getChannelName(params.channel))) {
            router.push('/channels')
        }
    }, [query.data, pusher, router, params.channel]);

    useEffect(() => {
        if (pusher || !auth.isSignedIn) return;

        const instance = new Pusher(appId, {
            cluster: "us3",
            channelAuthorization: {
                transport: 'ajax',
                endpoint: '/api/pusher/auth'
            },
            userAuthentication: {
                transport: 'ajax',
                endpoint: "/api/pusher/user-auth"
            },
        });

        instance.signin()

        bindUser(instance, 'channel-join', (data) => {
            void query.mutate((channels = []) => {
                if (channels.every(c => c.channel.id !== data.channel.id)) return [...channels, data]

                return channels
            }, {revalidate: false})
        })

        bindUser(instance, 'channel-leave', (data) => {
            void query.mutate((channels = []) => {
                return channels.filter(c => c.channel.id !== data.channelId)
            }, {revalidate: false})
        })

        useStore.setState({pusher: instance});
    }, [pusher, auth]);

    return <>{children}</>;
}

function bindUser<K extends keyof Realtime['user']>(pusher: Pusher, event: K, callback: (data: Realtime['user'][K]) => void) {
    pusher.bind(event, callback)
}

function bindChannel<K extends keyof Realtime['channel']>(channel: PusherChannel, event: K, callback: (data: Realtime['channel'][K]) => void) {
    channel.bind(event, callback)
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
    bindChannel(
        pusherChannel,
        "message-send",
        (data) => {
            const channel = useStore.getState().getChannel(data.channelId)

            channel.setMessage([...channel.messages, data])
        }
    );

    bindChannel(
        pusherChannel,
        "message-delete",
        (data) => {
            const channel = useStore.getState().getChannel(data.channelId)

            channel.setMessage(channel.messages.filter(m => m.id !== data.id))
        }
    );

    bindChannel(pusherChannel, 'channel-delete', (data) => {
        void mutate<API['/api/channels:get']['data']>(['/api/channels', undefined], (channels = []) => {
            return channels.filter(c => c.channel.id !== data.channelId)
        }, {revalidate: false})
    })
}

export function getChannelName(id: string): string {
    return `presence-channel-${id}`
}