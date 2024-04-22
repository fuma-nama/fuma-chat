import { useMutation } from "@/lib/client/use-mutation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { useState } from "react";
import { typedFetch } from "@/lib/client/fetcher";
import { cn } from "@/lib/cn";
import { inputVariants, buttonVariants } from "../primitive";
import { useRouter } from "next/navigation";

export function JoinGroup({
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
          <DialogTitle>Join Group</DialogTitle>
          <DialogDescription>
            Join a chat group with its invite code.
          </DialogDescription>
        </DialogHeader>
        <Form close={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Form({ close }: { close: () => void }) {
  const [code, setCode] = useState("");
  const router = useRouter();

  const mutation = useMutation(
    ({ code }: { code: string }) =>
      typedFetch("/api/channels/join:post", {
        code,
      }),
    {
      mutateKey: ["/api/channels", undefined] as const,
      onSuccess(channelId) {
        router.push(`/channels/${channelId}`);
        close();
      },
    }
  );

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        mutation.trigger({ code: code });
        e.preventDefault();
      }}
    >
      <label htmlFor="code" className="text-xs font-medium">
        Code
      </label>
      <input
        id="code"
        value={code}
        required
        aria-invalid={mutation.error !== undefined}
        onChange={(e) => setCode(e.target.value)}
        className={cn(inputVariants())}
      />
      {mutation.error && (
        <p className="text-red-400 text-xs">{mutation.error.message}</p>
      )}
      <DialogFooter>
        <button
          type="submit"
          disabled={mutation.isMutating}
          className={cn(buttonVariants({ color: "primary" }))}
        >
          Join
        </button>
        <DialogClose className={cn(buttonVariants())}>Cancel</DialogClose>
      </DialogFooter>
    </form>
  );
}
