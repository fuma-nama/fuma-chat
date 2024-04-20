import { SettingsIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import { Channel } from "@/lib/server/types";
import { cn } from "@/lib/cn";
import { buttonVariants } from "../primitive";
import { typedFetch, useMutation } from "@/lib/client/fetcher";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditGroup({ channel }: { channel: Channel }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteMutation = useMutation(
    ["/api/channels", undefined] as const,
    "/api/channels:get",
    ([key]) =>
      typedFetch(`${key}:delete`, { params: { channelId: channel.id } }),
    {
      revalidate: false,
      populateCache(_, channels = []) {
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
        <button
          className={cn(buttonVariants({ color: "danger" }))}
          onClick={() => deleteMutation.trigger()}
          disabled={deleteMutation.isMutating}
        >
          Delete Group
        </button>
      </DialogContent>
    </Dialog>
  );
}
