import {cn} from "@/lib/cn";
import {Popover, PopoverContent, PopoverTrigger} from "../popover";
import {buttonVariants, inputVariants, menuButtonVariants} from "../primitive";
import {useQuery} from "@/lib/client/fetcher";
import {useRef, useState} from "react";

export function Invite({channelId}: { channelId: string }) {
    const query = useQuery(["/api/invites", {channelId}]);
    const [isCopied, setCopied] = useState(false);
    const timerRef = useRef<number>();

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
                <div className={cn(inputVariants())}>{query.data}</div>
                <button
                    className={cn(buttonVariants({className: "mt-1"}))}
                    onClick={onCopy}
                    disabled={isCopied}
                >
                    {isCopied ? "Copied" : "Copy"}
                </button>
            </PopoverContent>
        </Popover>
    );
}
