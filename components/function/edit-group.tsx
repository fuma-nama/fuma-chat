import {SettingsIcon} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../dialog";
import {API, Channel, Member} from "@/lib/server/types";
import {cn} from "@/lib/cn";
import {buttonVariants, inputVariants, menuButtonVariants} from "../primitive";
import {typedFetch, useQuery} from "@/lib/client/fetcher";
import {useEffect, useState} from "react";
import Image from "next/image";
import {useAction, useMutation} from "@/lib/client/use-mutation";
import {Invite} from "./invite";
import {useStore, useToastStore} from "@/lib/client/store";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/alert-dialog";
import {useAuth} from "@clerk/nextjs";
import {hasPermission, Permissions} from "@/lib/server/permissions";
import {Presence} from "@radix-ui/react-presence";
import {FocusScope} from "@radix-ui/react-focus-scope";
import {Spinner} from "@/components/spinner";

export function EditGroup({channelId}: { channelId: string }) {
    const [open, setOpen] = useState(false);
    const info = useStore(s => s.getChannel(channelId))
    const auth = useAuth()

    const channel = info.channel

    const features = {
        edit: hasPermission(info.permissions ?? 0, Permissions.Admin),
        delete: channel && channel.ownerId === auth.userId
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                aria-label="Group Settings"
                className={cn(buttonVariants({className: "ml-auto", size: "icon"}))}
            >
                <SettingsIcon className="size-4"/>
            </DialogTrigger>
            {channel && <DialogContent>
                <DialogHeader>
                    <DialogTitle>{channel.name}</DialogTitle>
                    <DialogDescription>View chat group details.</DialogDescription>
                </DialogHeader>
                <div className='relative flex-1 max-h-[50vh] overflow-auto'>
                    <p className="text-xs font-medium mb-2">Members</p>
                    <Members channelId={channelId}/>

                    <div className='flex flex-col mt-4'>
                        {features.edit && <EditInfo channel={channel}/>}
                        <Invite channelId={channelId}/>
                        <LeaveGroup channelId={channelId}/>
                        {features.delete && <DeleteGroup channelId={channelId} name={channel.name}/>}
                    </div>
                </div>
            </DialogContent>}
        </Dialog>
    );
}

function Members({channelId}: { channelId: string }) {
    const query = useQuery(["/api/members", {channelId}]);

    return <div className='flex flex-col overflow-auto bg-neutral-800 h-[120px] rounded-lg'>
        {query.isLoading && (
            <Spinner className='size-8 m-auto text-neutral-400'/>
        )}
        {query.data?.map((member) => (
            <Item
                key={member.user.id}
                channelId={channelId}
                member={member}
            />
        ))}
    </div>
}

function EditInfo({channel}: { channel: Channel }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(channel.name)

    useEffect(() => {
        setValue(channel.name)
    }, [channel.name])

    const editMutation = useMutation(
        (input: API['/api/channels:patch']['input']) => typedFetch('/api/channels:patch', input),
        {
            mutateKey: ['/api/channels', undefined],
            revalidate: false,
            cache(data, current) {
                return current?.map(item => item.channel.id === data.id ? {...item, channel: data} : item) ?? []
            },
            onSuccess() {
                setOpen(false)
            }
        }
    )

    return <>
        <button className={cn(menuButtonVariants())} onClick={() => setOpen(true)}>Edit Info</button>
        <Presence present={open}>
            <FocusScope trapped asChild>
                <form
                    data-state={open ? 'open' : 'closed'}
                    className='absolute inset-0 flex flex-col gap-4 bg-neutral-900 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out'
                    onSubmit={e => {
                        void editMutation.trigger({name: value, channelId: channel.id})
                        e.preventDefault()
                    }}>
                    <fieldset className='flex flex-col'>
                        <label htmlFor='name' className='font-medium text-xs mb-2'>Name</label>
                        <input id='name' value={value} onChange={e => setValue(e.target.value)}
                               className={cn(inputVariants())}
                               required/>
                    </fieldset>
                    <div className='flex flex-row gap-2 mt-auto'>
                        <button type='submit' className={cn(buttonVariants({color: 'primary'}))}
                                disabled={editMutation.isMutating}>Done
                        </button>
                        <button type='button' className={cn(buttonVariants())} onClick={() => setOpen(false)}>Cancel
                        </button>
                    </div>
                </form>
            </FocusScope>
        </Presence>
    </>
}

function LeaveGroup({channelId}: { channelId: string }) {
    const mutation = useMutation(() => typedFetch('/api/channels/leave:post', {channelId}), {
        mutateKey: ['/api/channels', undefined],
        revalidate: false,
        cache(_, currentData) {
            return currentData?.filter(c => c.channel.id !== channelId) ?? []
        },
        onError(e) {
            useToastStore.getState().addToast({
                type: 'destructive',
                title: "Failed to leave",
                description: e.message,
            })
        }
    })

    return <button disabled={mutation.isMutating} className={cn(menuButtonVariants({variant: 'danger'}))}
                   onClick={() => mutation.trigger()}>
        Leave
    </button>
}

function DeleteGroup({channelId, name}: { channelId: string, name: string }) {
    const [alert, setAlert] = useState(false)

    const deleteMutation = useAction(
        () => typedFetch("/api/channels:delete", {channelId}),
        {
            onSuccess() {
                setAlert(false)
            },
        }
    );

    return <AlertDialog open={alert} onOpenChange={setAlert}>
        <AlertDialogTrigger className={cn(menuButtonVariants({variant: 'danger'}))}>
            Delete Group
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => deleteMutation.trigger()}
                    disabled={deleteMutation.isMutating}
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
}

function Item({channelId, member}: { channelId: string, member: Member }) {
    const info = useStore(s => s.getChannel(channelId))
    const auth = useAuth()
    const mutation = useMutation(() => typedFetch('/api/members:delete', {memberId: member.user.id, channelId}), {
        mutateKey: ['/api/members', {channelId}] as const,
        onError(error) {
            useToastStore.getState().addToast({
                type: 'destructive',
                title: "Failed to kick member",
                description: error.message,
            })
        }
    })

    const isOwner = info.channel && member.user.id !== info.channel.ownerId
    const isUser = member.user.id === auth.userId

    const canKick = hasPermission(info.permissions ?? 0, Permissions.Admin) && !isOwner && !isUser

    return <div
        className="flex flex-row items-center gap-2 font-medium text-sm p-2 rounded-xl hover:bg-neutral-700"
    >
        <Image
            alt="avatar"
            src={member.user.imageUrl}
            width={32}
            height={32}
            className="size-6 flex-shrink-0 rounded-full"
        />
        {member.user.name}
        {canKick && <button disabled={mutation.isMutating}
                            className={cn(buttonVariants({color: 'danger', size: 'sm', className: 'ml-auto'}))}
                            onClick={() => mutation.trigger()}>
            Kick
        </button>}
    </div>
}