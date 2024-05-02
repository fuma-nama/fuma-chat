import type Pusher from "pusher-js";
import {create} from "zustand";
import {Channel, Message} from "../server/types";

interface StoreType {
    pusher?: Pusher

    channels: Map<string, ChannelInfo>
    getChannel: (channel: string) => ChannelInfo
}

interface ChannelInfo {
    messages: Message[]
    channel?: Channel
    permissions?: number

    pointer?: number
    nextPointer: () => void
    setMessage: (messages: Message[]) => void
    onLoad: (messages: Message[], before?: number) => void
    update: (channel: ChannelInfo) => void
}

function emptyChannelInfo(id: string): ChannelInfo {

    return {
        messages: [],
        setMessage(messages) {
            const channel = useStore.getState().getChannel(id)

            channel.update({
                ...channel,
                messages
            })
        },
        nextPointer() {
            const channel = useStore.getState().getChannel(id)

            channel.update({
                ...channel,
                pointer: channel.messages.length > 0 ? channel.messages[0].timestamp : undefined
            })
        },
        update(channel: ChannelInfo) {
            useStore.setState(prev => ({
                channels: new Map(prev.channels).set(id, channel)
            }))
        },
        onLoad(messages, before) {
            const channel = useStore.getState().getChannel(id)

            if (before) {
                const next = channel.messages.filter(m => m.timestamp >= before)
                next.unshift(...messages)

                channel.messages = next
            } else {
                channel.messages = messages
            }

            channel.update({
                ...channel
            })
        }
    }
}

export const useStore = create<StoreType>((_, get) => ({
    channels: new Map(),
    getChannel(channel) {
        const channels = get().channels
        const info = channels.get(channel)

        if (!info) {
            const initial = emptyChannelInfo(channel)
            channels.set(channel, initial)
            return initial
        }

        return info
    },
}));

export interface ToastItem {
    id: number
    type: 'default' | 'destructive'
    title: string
    description: string
}

interface ToastStoreType {
    toasts: ToastItem[];
    addToast: (item: Omit<ToastItem, 'id'>) => void;
}

let nextToastId = 0;

export const useToastStore = create<ToastStoreType>((set, get) => ({
    toasts: [],
    addToast(item) {
        set({
            toasts: [...get().toasts, {id: nextToastId++, ...item}]
        })
    }
}))