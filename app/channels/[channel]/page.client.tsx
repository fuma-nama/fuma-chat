"use client";

import {ChevronDownIcon, EditIcon, SendIcon, XIcon} from "lucide-react";
import {ReactNode, useCallback, useEffect, useRef, useState} from "react";
import {useStore} from "@/lib/client/store";
import {typedFetch} from "@/lib/client/fetcher";
import {cn} from "@/lib/cn";
import {buttonVariants} from "@/components/primitive";
import Image from "next/image";
import type {API, Message} from "@/lib/server/types";
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
import {getTimeString} from "@/lib/date";
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from "@/components/context-menu";
import {DropdownMenuItemProps} from "@radix-ui/react-dropdown-menu";
import {ContextMenuItemProps} from "@radix-ui/react-context-menu";
import {ChatView, useItems} from "@/components/function/chat-view";
import {hasPermission, Permissions} from "@/lib/server/permissions";
import {Spinner} from "@/components/spinner";
import {DynamicTextArea} from "@/components/text-area";

export default function View({channelId}: {
    channelId: string,
}) {
    const info = useStore((s) => s.getChannel(channelId));
    const auth = useAuth();
    const items = useItems(info.messages)

    if (!auth.isLoaded)
        return <p className="m-auto text-sm text-neutral-400">Loading</p>;

    return (
        <ChatView channelId={channelId}>
            <div
                className="sticky top-0 flex flex-row items-center px-4 bg-neutral-900/50 backdrop-blur-lg min-h-12 z-20 max-md:pl-12">
                <p className="font-medium text-sm">{info.channel?.name}</p>
                <EditGroup channelId={channelId}/>
            </div>
            <div className="flex flex-col gap-6 py-4 h-full">
                <Spinner className='hidden group-data-[loading=true]/chat:block mx-auto my-4'/>
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
                {items.length === 0 &&
                    <div className='text-center text-sm text-neutral-400 mt-8 group-data-[loading=true]/chat:hidden'>No
                        message here</div>}
            </div>
            <Sendbar/>
        </ChatView>
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
            <DynamicTextArea className="flex-1 max-h-[20vh]" value={text}
                             disabled={mutation.isMutating}
                             onChange={(e) => setText(e.target.value)}
                             onKeyDown={(e) => {
                                 if (e.key === "Enter" && !e.shiftKey) {
                                     mutation.trigger({message: text});
                                     e.preventDefault();
                                 }
                             }}/>
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
    const channel = useStore(s => s.getChannel(message.channelId))
    const isEditing = channel.editing?.id === message.id

    const features: Features = {
        edit: auth.userId === auth.userId,
        delete: auth.userId === message.user.id || hasPermission(channel.permissions ?? 0, Permissions.DeleteMessage) || hasPermission(channel.permissions ?? 0, Permissions.Admin)
    }

    if (isEditing) {
        return <EditMessage id={message.id} channelId={message.channelId} content={message.message}/>
    }

    if (auth.userId === message.user.id) {
        return (
            <MessageActions message={message} features={features}>
                <div
                    className="relative flex flex-row gap-3 items-end ms-auto me-4 max-w-[70%] rounded-xl bg-neutral-800 p-2 group">
                    <MessageActionsTrigger/>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className="text-xs text-neutral-400">{timeStr}</p>
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
                className="rounded-full size-8 mt-auto flex-shrink-0"
                unoptimized
            />
            <MessageActions message={message} features={features}>
                <div className="relative p-2 rounded-xl bg-neutral-800 group">
                    <MessageActionsTrigger/>
                    <p className="text-xs font-medium text-orange-200 mb-1">
                        {message.user.name}
                    </p>
                    <div className='flex flex-row gap-3 items-end'>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className="text-xs text-neutral-400">{timeStr}</p>
                    </div>
                </div>
            </MessageActions>
        </div>
    )
}

function EditMessage({id, channelId, content}: { id: string, channelId: string, content: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [value, setValue] = useState(content)
    const mutation = useMutation(() => typedFetch('/api/messages:patch', {messageId: id, channelId, content: value}), {
        mutateKey: ['/api/messages', undefined],
        revalidate: false,
        onSuccess() {
            onCancel()
        }
    })

    useEffect(() => {
        const element = ref.current
        if (!element) return;

        const textarea = element.getElementsByTagName('textarea').item(0)
        if (textarea) {
            textarea.focus()

            textarea.selectionStart = textarea.selectionEnd = textarea.value.length
        }
    }, [])

    const onCancel = useCallback(() => {
        const channel = useStore.getState().getChannel(channelId)
        channel.update({
            ...channel,
            editing: undefined
        })
    }, [channelId])

    return <div
        ref={ref}
        className='flex flex-col items-end ms-auto me-4 w-[calc(100%-2rem)] rounded-xl border border-blue-500/50 shadow-lg shadow-blue-500/30 p-2 md:w-[70%]'>
        <p className='text-xs text-neutral-400 w-full p-2'>Editing...</p>
        <DynamicTextArea
            value={value}
            onChange={e => setValue(e.target.value)}
            className='w-full max-h-[30vh]'
            onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    mutation.trigger()
                    e.preventDefault();
                }
                if (e.key === 'Escape') {
                    onCancel()
                    e.preventDefault()
                }
            }}/>
        <div className='flex flex-row gap-2 mt-2'>
            <button aria-label='Edit' onClick={() => mutation.trigger()}
                    className={cn(buttonVariants({size: 'icon', color: 'primary'}))}
                    disabled={mutation.isMutating}>
                <EditIcon className='size-4'/>
            </button>
            <button aria-label='Cancel' onClick={onCancel}
                    className={cn(buttonVariants({size: 'icon'}))}
                    disabled={mutation.isMutating}>
                <XIcon className='size-4'/>
            </button>
        </div>
    </div>
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
    edit: boolean
    delete: boolean
}

function MessageActions({message, features, children}: { message: Message, features: Features, children: ReactNode }) {
    const mutation = useMutation(
        (input: API["/api/messages:delete"]["input"]) =>
            typedFetch("/api/messages:delete", input),
        {
            mutateKey: ["/api/messages", undefined],
            revalidate: false,
        }
    );

    const onCopy = useCallback(() => {
        void navigator.clipboard.writeText(message.message);
    }, [message.message])

    const items: (DropdownMenuItemProps | ContextMenuItemProps)[] = [
        {key: 'copy', children: "Copy", onSelect: onCopy},
    ]

    if (features.edit) {
        items.push({
            key: 'edit',
            children: 'Edit',
            onSelect() {
                const channel = useStore.getState().getChannel(message.channelId)

                channel.update({
                    ...channel,
                    editing: message
                })
            }
        })
    }

    if (features.delete) items.push({
        key: 'delete',
        children: "Delete",
        disabled: mutation.isMutating,
        onSelect() {
            mutation.trigger({
                id: message.id,
                channelId: message.channelId,
            })
        }
    })

    return <DropdownMenu>
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent>
                {items.map(({key, ...item}) => <ContextMenuItem key={key} {...item} />)}
            </ContextMenuContent>
        </ContextMenu>
        <DropdownMenuContent>
            {items.map(({key, ...item}) => <DropdownMenuItem key={key} {...item} />)}
        </DropdownMenuContent>
    </DropdownMenu>
}