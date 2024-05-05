import type Pusher from "pusher-js";
import {create} from "zustand";
import {Channel, Message} from "../server/types";

interface StoreType {
    pusher?: Pusher

    channels: Map<string, ChannelInfo>
    getChannel: (channel: string) => ChannelInfo
}

export interface PendingMessage {
    nonce: string
    content: string
    timestamp: number
}

interface ChannelInfo {
    messages: Message[]
    channel?: Channel
    permissions?: number
    pending: PendingMessage[]

    /**
     * The current editing message, content might not be up-to-date.
     * Message id won't be changed anyway
     */
    editing?: Message

    pointer?: number
    nextPointer: () => void
    addPending: (content: string) => PendingMessage
    onLoad: (messages: Message[], before?: number) => void
    update: (channel: ChannelInfo) => void
}

function emptyChannelInfo(id: string): ChannelInfo {

    return {
        messages: [],
        pending: [],
        addPending(content) {
            const channel = useStore.getState().getChannel(id)
            const pending: PendingMessage = {
                nonce: Date.now().toString(),
                content,
                timestamp: Date.now()
            }

            channel.update({
                ...channel,
                pending: [...channel.pending, pending]
            })

            return pending
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