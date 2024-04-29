import {cn} from "@/lib/cn";
import {Popover, PopoverContent, PopoverTrigger} from "../popover";
import {buttonVariants, inputVariants, menuButtonVariants} from "../primitive";
import {typedFetch, useQuery} from "@/lib/client/fetcher";
import {useRef, useState} from "react";
import {CheckIcon, CopyIcon} from "lucide-react";
import {useMutation} from "@/lib/client/use-mutation";
import {useToastStore} from "@/lib/client/store";

export function Invite({channelId}: { channelId: string }) {
    const query = useQuery(["/api/invites", {channelId}]);
    const [isCopied, setCopied] = useState(false);
    const timerRef = useRef<number>();

    const mutation = useMutation(() => typedFetch('/api/invites:post', {channelId}), {
        mutateKey: ['/api/invites', {channelId}],
        revalidate: false,
        onError(err) {
            useToastStore.getState().addToast({
                type: 'destructive',
                title: "Failed to re-generate invite code",
                description: err.message
            })
        },
        cache(c) {
            return c
        }
    })

    const onCopy = () => {
        if (!query.data) return;

        if (timerRef.current) clearTimeout(timerRef.current);

        setCopied(true);
        timerRef.current = window.setTimeout(() => {
            setCopied(false);
        }, 1200);

        void navigator.clipboard.writeText(query.data);
    };

    return (
        <Popover>
            <PopoverTrigger className={cn(menuButtonVariants())}>Invite</PopoverTrigger>
            <PopoverContent>
                <p className="text-sm font-medium mb-1">Invite Code</p>
                <p className='text-xs text-neutral-400 mb-2'>The old invite code will expire once you generated a new
                    one.</p>
                <div className='flex flex-row gap-1 mb-2'>
                    <div className={cn(inputVariants({className: 'flex-1 truncate'}))}>{query.data}</div>
                    <button
                        aria-label="Copy"
                        className={cn(buttonVariants({size: 'icon', className: 'rounded-md'}))}
                        onClick={onCopy}
                        disabled={isCopied}
                    >
                        {isCopied ? <CheckIcon className='size-4'/> : <CopyIcon className='size-4'/>}
                    </button>
                </div>
                <button onClick={() => mutation.trigger()}
                        className={cn(buttonVariants({color: 'primary', className: 'w-full'}))}
                        disabled={mutation.isMutating}>Generate
                </button>
            </PopoverContent>
        </Popover>
    );
}
