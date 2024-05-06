import {ReactNode, useCallback, useMemo, useRef} from "react";
import {useQuery} from "@/lib/client/fetcher";
import {useStore} from "@/lib/client/store";
import {getDateString} from "@/lib/date";
import type {Message} from "@/lib/server/types";

export type ItemType = {
    type: 'message', message: Message,
    /**
     * Is the start of user's messages
     */
    userBlockStart: boolean
    /**
     * Is the end of user's messages
     */
    userBlockEnd: boolean
} | { type: 'date', date: string }

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
        const items: ItemType[] = []
        let prevDate: string | undefined = undefined

        for (let i = 0; i < messages.length; i++) {
            const dateStr = getDateString(new Date(messages[i].timestamp))

            if (prevDate !== dateStr) {
                items.push({type: 'date', date: dateStr})
                prevDate = dateStr
            }

            const prevItem = items.length > 0 ? items[items.length - 1] : undefined
            const inUserBlock = prevItem?.type === 'message' && prevItem.message.user.id === messages[i].user.id

            if (inUserBlock) {
                prevItem.userBlockEnd = false
            }

            items.push({
                type: 'message',
                message: messages[i],
                userBlockStart: !inUserBlock,
                userBlockEnd: true,
            })
        }

        return items
    }, [messages])
}