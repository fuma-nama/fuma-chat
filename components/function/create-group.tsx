import {cn} from "@/lib/cn";
import {
    DialogHeader,
    DialogFooter,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "../dialog";
import {buttonVariants, inputVariants} from "../primitive";
import {typedFetch} from "@/lib/client/fetcher";
import {useState} from "react";
import {useMutation} from "@/lib/client/use-mutation";

export function CreateGroup({
                                open,
                                setOpen,
                            }: {
    open: boolean;
    setOpen: (v: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Group</DialogTitle>
                    <DialogDescription>
                        Chat Group allows you to talk to other group members.
                    </DialogDescription>
                </DialogHeader>
                <Form close={() => setOpen(false)}/>
            </DialogContent>
        </Dialog>
    );
}

function Form({close}: { close: () => void }) {
    const [name, setName] = useState("");
    const mutation = useMutation(
        ({name}: { name: string }) =>
            typedFetch("/api/channels:post", {
                name,
            }),
        {
            mutateKey: ["/api/channels", undefined] as const,
            revalidate: false,
            onSuccess() {
                close();
            },
        }
    );

    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
                mutation.trigger({name});
                e.preventDefault();
            }}
        >
            <label htmlFor="name" className="text-xs font-medium">
                Name
            </label>
            <input
                id="name"
                value={name}
                aria-invalid={mutation.error !== undefined}
                required
                onChange={(e) => setName(e.target.value)}
                className={cn(inputVariants())}
            />
            {mutation.error && (
                <p className="text-red-400 text-xs">{mutation.error.message}</p>
            )}
            <DialogFooter>
                <button
                    type="submit"
                    disabled={mutation.isMutating}
                    className={cn(buttonVariants({color: "primary"}))}
                >
                    Done
                </button>
                <DialogClose className={cn(buttonVariants())}>Cancel</DialogClose>
            </DialogFooter>
        </form>
    );
}
