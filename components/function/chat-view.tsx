import {ReactNode, useCallback, useMemo, useRef} from "react";
import {useQuery} from "@/lib/client/fetcher";
import {useStore} from "@/lib/client/store";
import {getDateString} from "@/lib/date";
import type {Message} from "@/lib/server/types";

export type ItemType = { type: 'message', message: Message } | { type: 'date', date: string }

export function ChatView({channelId, children}: { channelId: string, children: ReactNode }) {
    const channel = useStore((s) => s.getChannel(channelId));
    const containerRef = useRef<HTMLDivElement>(null)
    const onScrollRef = useRef<() => void>()

    const query = useQuery(["/api/messages", {
        channelId,
        before: channel.pointer?.toString()
    }], undefined, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        onSuccess(data) {
            console.log(`Load Chunk: ${channel.pointer}, ${data.length} items`)
            channel.onLoad(data, channel.pointer)
        },
    });

    onScrollRef.current = () => {
        if (!containerRef.current) return;
        const element = containerRef.current

        const diff = Math.abs(element.scrollTop) + element.clientHeight - element.scrollHeight
        if (diff < 80 && !query.isLoading) {
            channel.nextPointer()
        }
    }

    const onScroll = useCallback(() => {
        onScrollRef.current?.()
    }, [])

    return <div ref={containerRef} className='group/chat relative flex flex-col-reverse overflow-auto h-full'
                onScroll={onScroll} data-loading={query.isLoading}>
        <div className='flex flex-col flex-1'>
            {children}
        </div>
    </div>
}

export function useItems(messages: Message[]): ItemType[] {
    return useMemo(() => {
        const lists: ItemType[] = []
        let prevDate: string | undefined = undefined
        for (const message of messages) {
            const date = new Date(message.timestamp)
            const dateStr = getDateString(date)

            if (prevDate !== dateStr) {
                lists.push({type: 'date', date: dateStr})
            }

            lists.push({type: 'message', message})
            prevDate = dateStr
        }

        return lists
    }, [messages])
}