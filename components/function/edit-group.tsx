import { SettingsIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Channel } from "@/lib/server/types";
import { cn } from "@/lib/cn";
import { buttonVariants } from "../primitive";
import { typedFetch, useQuery } from "@/lib/client/fetcher";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation } from "@/lib/client/use-mutation";

export function EditGroup({ channel }: { channel: Channel }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const query = useQuery("/api/members", { params: { channelId: channel.id } });
  const deleteMutation = useMutation(
    () =>
      typedFetch("/api/channels:delete", { params: { channelId: channel.id } }),
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
        className={cn(buttonVariants({ className: "ml-auto", size: "icon" }))}
      >
        <SettingsIcon className="size-4" />
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
          <div
            key={member.user.id}
            className="flex flex-row items-center gap-2 font-medium text-sm p-2 bg-neutral-800 rounded-xl"
          >
            <Image
              alt="avatar"
              src={member.user.imageUrl}
              width={32}
              height={32}
              className="size-6 min-w-6 rounded-full"
            />
            {member.user.name}
          </div>
        ))}
        <DialogFooter>
          <button
            className={cn(buttonVariants({ color: "danger" }))}
            onClick={() => deleteMutation.trigger()}
            disabled={deleteMutation.isMutating}
          >
            Delete Group
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
