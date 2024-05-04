import Pusher from "pusher";
import {Realtime} from "@/lib/server/types";

export const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_API_KEY!,
    secret: process.env.PUSHER_API_SECRET!,
    cluster: "us3",
    useTLS: true,
});

export async function sendChannel<K extends keyof Realtime['channel']>(id: string, event: K, data: Realtime['channel'][K]): Promise<void> {
    await pusher.trigger(getChannelName(id), event, data)
}

export async function sendUser<K extends keyof Realtime['user']>(userId: string, event: K, data: Realtime['user'][K]): Promise<void> {
    await pusher.sendToUser(userId, event, data)
}

export function getChannelName(id: string): string {
    return `presence-channel-${id}`
}