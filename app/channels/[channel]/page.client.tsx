"use client";

import {ChevronDownIcon, MoreHorizontalIcon, SendIcon} from "lucide-react";
import {ReactNode, useCallback, useMemo, useState} from "react";
import {useStore} from "@/lib/client/store";
import {typedFetch, useQuery} from "@/lib/client/fetcher";
import {cn} from "@/lib/cn";
import {buttonVariants, inputVariants} from "@/components/primitive";
import Image from "next/image";
import type {API, Channel, Message} from "@/lib/server/types";
import {useAuth} from "@clerk/nextjs";
import {EditGroup} from "@/components/function/edit-group";
import {useMutation} from "@/lib/client/use-mutation";
import {useParams} from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/dropdown";
import {getDateString, getTimeString} from "@/lib/date";
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from "@/components/context-menu";
import {DropdownMenuItemProps} from "@radix-ui/react-dropdown-menu";
import {ContextMenuItemProps} from "@radix-ui/react-context-menu";

type  ItemType = { type: 'message', message: Message } | { type: 'date', date: string }

export default function View({
                                 params,
                                 channelInfo,
                             }: {
    params: { channel: string };
    channelInfo: Channel;
}) {
    const messages = useStore((s) => s.messages.get(params.channel) ?? []);
    const auth = useAuth();

    useQuery(["/api/messages", {channelId: params.channel}], undefined, {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        onSuccess(data) {
            useStore.setState((prev) => ({
                messages: new Map(prev.messages).set(params.channel, data),
            }));
        },
    });

    const items = useMemo(() => {
        const lists: ItemType[] = []
        let prevDate: string | undefined
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

    if (!auth.isLoaded)
        return <p className="m-auto text-sm text-neutral-400">Loading</p>;

    return (
        <div className='relative flex flex-col-reverse overflow-auto h-screen'>
            <div className='flex flex-col flex-1'>
                <div
                    className="sticky top-0 flex flex-row items-center px-4 bg-neutral-900/50 backdrop-blur-lg min-h-12 z-20 max-md:pl-12">
                    <p className="font-medium text-sm">{channelInfo.name}</p>
                    <EditGroup channel={channelInfo}/>
                </div>
                <div className="flex flex-col gap-6 py-4 h-full">
                    {items.map((item) => {
                        if (item.type === 'message')
                            return <MessageItem key={item.message.id} message={item.message}/>
                        if (item.type === 'date')
                            return <div
                                key={item.date}
                                className='sticky top-16 p-2 w-24 text-center text-xs mx-auto rounded-xl bg-neutral-800 text-neutral-400'
                            >
                                {item.date}
                            </div>
                    })}
                </div>
                <Sendbar/>
            </div>
        </div>
    );
}

function Sendbar() {
    const [text, setText] = useState("");

    const params = useParams() as { channel: string };
    const mutation = useMutation(
        ({message}: { message: string }) =>
            typedFetch("/api/messages:post", {
                channelId: params.channel,
                message,
            }),
        {
            mutateKey: ["/api/messages", {channelId: params.channel}] as const,
            onSuccess() {
                setText("");
            },
            revalidate: false,
        }
    );

    return (
        <div className="sticky bottom-0 flex flex-row bg-neutral-900/50 px-4 pb-4 gap-2 backdrop-blur-lg">
            <div className="grid flex-1 max-h-[20vh] overflow-auto *:col-[1/2] *:row-[1/2]">
                <div
                    className={cn(
                        inputVariants({
                            className: "whitespace-pre-wrap invisible overflow-hidden",
                            variant: "rounded",
                        })
                    )}
                >
                    {text + " "}
                </div>
                <textarea
                    value={text}
                    disabled={mutation.isMutating}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            mutation.trigger({message: text});
                            e.preventDefault();
                        }
                    }}
                    className={cn(
                        inputVariants({
                            className: "resize-none",
                            variant: "rounded",
                        })
                    )}
                />
            </div>
            <button
                aria-label="send message"
                className="size-9 bg-blue-500 font-medium text-sm text-nuetral-50 rounded-full p-2.5 mt-2 transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={mutation.isMutating}
                onClick={() => mutation.trigger({message: text})}
            >
                <SendIcon className="size-full"/>
            </button>
        </div>
    );
}

function MessageItem({message}: { message: Message }) {
    const auth = useAuth();
    const timeStr = getTimeString(new Date(message.timestamp));

    const features: Features = {
        delete: auth.userId === message.user.id
    }

    if (auth.userId === message.user.id) {
        return (
            <MessageActions message={message} features={features}>
                <div
                    className="relative flex flex-col gap-2 ms-auto me-4 min-w-32 max-w-[70%] rounded-xl bg-neutral-800 p-2 group">
                    <MessageActionsTrigger/>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className="text-xs text-neutral-400 text-right">{timeStr}</p>
                </div>
            </MessageActions>
        );
    }

    return (
        <div className="relative flex flex-row gap-2 ms-4 max-w-[70%]">
            <Image
                alt="avatar"
                src={message.user.imageUrl}
                width={32}
                height={32}
                className="rounded-full size-8 min-w-8 mt-auto"
                unoptimized
            />

            <div>
                <p className="text-xs text-neutral-400 px-2 mb-1">
                    {message.user.name}
                </p>
                <MessageActions message={message} features={features}>
                    <p className="relative p-2 rounded-xl bg-neutral-800 text-sm whitespace-pre-wrap group">
                        <MessageActionsTrigger/>
                        {message.message}
                    </p>
                </MessageActions>
            </div>
        </div>
    )
}

function MessageActionsTrigger() {
    return <DropdownMenuTrigger
        className={cn(
            buttonVariants({
                size: "icon",
                className:
                    "absolute -top-2 right-2 p-1 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 focus-visible:ring-0",
            })
        )}
    >
        <ChevronDownIcon className="size-4"/>
    </DropdownMenuTrigger>
}

interface Features {
    delete: boolean
}

function MessageActions({message, features, children}: { message: Message, features: Features, children: ReactNode }) {
    const mutation = useMutation(
        (input: API["/api/messages:delete"]["input"]) =>
            typedFetch("/api/messages:delete", input),
        {
            mutateKey: ["/api/messages", {channelId: message.channelId}],
            revalidate: false,
        }
    );

    const onCopy = useCallback(() => {
        void navigator.clipboard.writeText(message.message);
    }, [message.message])

    const items: (DropdownMenuItemProps | ContextMenuItemProps)[] = [
        {key: 'copy', children: "Copy", onSelect: onCopy},
    ]

    if (features.delete) items.push({
        key: 'delete', children: "Delete", onSelect: () =>
            mutation.trigger({
                id: message.id,
                channelId: message.channelId,
            }),
    })

    return <DropdownMenu>
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent>
                {items.map(item => <ContextMenuItem key={item.key} {...item} />)}
            </ContextMenuContent>
        </ContextMenu>
        <DropdownMenuContent>
            {items.map(item => <DropdownMenuItem key={item.key} {...item} />)}
        </DropdownMenuContent>
    </DropdownMenu>
}