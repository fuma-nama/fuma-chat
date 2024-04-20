import { cn } from "@/lib/cn";
import { PlusIcon } from "lucide-react";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../dialog";
import { buttonVariants, inputVariants } from "../primitive";
import { typedFetch } from "@/lib/client/fetcher";
import { useState } from "react";
import { useMutation } from "@/lib/client/use-mutation";

export function CreateGroup() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({
            color: "secondary",
            size: "icon",
            className: "absolute right-4 bottom-4",
          })
        )}
        aria-label="Create chat group"
      >
        <PlusIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Group</DialogTitle>
          <DialogDescription>
            Chat Group allows you to talk to other group members.
          </DialogDescription>
        </DialogHeader>
        <Form close={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Form({ close }: { close: () => void }) {
  const [name, setName] = useState("");
  const mutation = useMutation(
    ({ name }: { name: string }) =>
      typedFetch("/api/channels:post", {
        bodyJson: { name },
      }),
    {
      mutateKey: ["/api/channels", undefined] as const,
      onSuccess() {
        close();
      },
    }
  );

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        mutation.trigger({ name });
        e.preventDefault();
      }}
    >
      <label htmlFor="name" className="text-xs font-medium">
        Name
      </label>
      <input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={cn(inputVariants())}
      />
      <DialogFooter>
        <button
          type="submit"
          disabled={mutation.isMutating}
          className={cn(buttonVariants({ color: "primary" }))}
        >
          Done
        </button>
        <DialogClose className={cn(buttonVariants())}>Cancel</DialogClose>
      </DialogFooter>
    </form>
  );
}
