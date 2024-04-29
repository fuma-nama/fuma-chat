import {SettingsIcon} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../dialog";
import {Channel, Member} from "@/lib/server/types";
import {cn} from "@/lib/cn";
import {buttonVariants} from "../primitive";
import {typedFetch, useQuery} from "@/lib/client/fetcher";
import {useState} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {useMutation} from "@/lib/client/use-mutation";
import {Invite} from "./invite";
import {useToastStore} from "@/lib/client/store";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/alert-dialog";

export function EditGroup({channel}: { channel: Channel }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const query = useQuery(["/api/members", {channelId: channel.id}]);
    const deleteMutation = useMutation(
        () => typedFetch("/api/channels:delete", {channelId: channel.id}),
        {
            mutateKey: ["/api/channels", undefined] as const,
            revalidate: false,
            cache(_, channels = []) {
                return channels.filter((c) => channel.id !== c.id);
            },
            onSuccess() {
                setOpen(false);
                router.push("/channels");
            },
        }
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                aria-label="Group Settings"
                className={cn(buttonVariants({className: "ml-auto", size: "icon"}))}
            >
                <SettingsIcon className="size-4"/>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{channel.name}</DialogTitle>
                    <DialogDescription>View chat group details.</DialogDescription>
                </DialogHeader>
                <p className="text-xs font-medium">Members</p>
                {query.isLoading && (
                    <p className="text-sm text-neutral-400">Loading...</p>
                )}
                {query.data?.map((member) => (
                    <Item
                        key={member.user.id}
                        channelId={channel.id}
                        member={member}
                    />
                ))}
                <Invite channelId={channel.id}/>
                <DialogFooter>
                    <DeleteGroup channelId={channel.id}/>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteGroup({channelId}: { channelId: string }) {
    const [alert, setAlert] = useState(false)
    const router = useRouter()

    const deleteMutation = useMutation(
        () => typedFetch("/api/channels:delete", {channelId}),
        {
            mutateKey: ["/api/channels", undefined] as const,
            revalidate: false,
            cache(_, channels = []) {
                return channels.filter((c) => channelId !== c.id);
            },
            onSuccess() {
                setAlert(false)
                router.push("/channels");
            },
        }
    );

    return <AlertDialog open={alert} onOpenChange={setAlert}>
        <AlertDialogTrigger className={cn(buttonVariants({color: "danger"}))}>
            Delete Group
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Do you sure?</AlertDialogTitle>
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
    const mutation = useMutation(() => typedFetch('/api/members:delete', {memberId: member.user.id, channelId}), {
        mutateKey: ['/api/members', {channelId,}],
        onError(e) {
            useToastStore.getState().addToast({
                type: 'destructive',
                title: "Failed to kick member",
                description: e.message,
            })
        }
    })

    return <div
        className="flex flex-row items-center gap-2 font-medium text-sm p-2 bg-neutral-800 rounded-xl"
    >
        <Image
            alt="avatar"
            src={member.user.imageUrl}
            width={32}
            height={32}
            className="size-6 flex-shrink-0 rounded-full"
        />
        {member.user.name}
        <button disabled={mutation.isMutating}
                className={cn(buttonVariants({color: 'danger', size: 'sm', className: 'ml-auto'}))}
                onClick={() => mutation.trigger()}>
            Kick
        </button>
    </div>
}