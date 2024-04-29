"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/dropdown";
import {CreateGroup} from "@/components/function/create-group";
import {JoinGroup} from "@/components/function/join-group";
import {buttonVariants} from "@/components/primitive";
import {useQuery} from "@/lib/client/fetcher";
import {cn} from "@/lib/cn";
import {useClerk, useUser} from "@clerk/nextjs";
import {LogOutIcon, PlusIcon, UserIcon} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useState} from "react";
import {Sidebar} from "@/components/layout/sidebar";
import {ToastLayout} from "@/components/layout/toast-layout";

export default function Layout({children}: { children: React.ReactNode }) {
    const [createGroup, setCreateGroup] = useState(false);
    const [joinGroup, setJoinGroup] = useState(false);
    const {signOut, openUserProfile} = useClerk();
    const {user} = useUser();
    const query = useQuery(["/api/channels", undefined]);
    const {channel: channelId} = useParams();

    return (
        <ToastLayout>
            <main className="flex h-dvh flex-row">
                <Sidebar>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="flex flex-row gap-3 items-center text-sm text-left px-4 -mx-4 pb-4 border-b border-neutral-700 mb-4 focus:outline-none hover:bg-neutral-800">
                            {user ? (
                                <Image
                                    alt="avatar"
                                    src={user.imageUrl}
                                    width={32}
                                    height={32}
                                    className="rounded-full size-8"
                                    unoptimized
                                />
                            ) : (
                                <div className="size-8 rounded-full bg-neutral-700"/>
                            )}
                            <div className={cn(!user && "opacity-0")}>
                                <p className="text-xs font-medium">{user?.fullName}</p>
                                <p className="text-xs text-neutral-400">Click to view profile</p>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openUserProfile()}>
                                <UserIcon className="size-4 mr-2"/>
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => signOut()}>
                                <LogOutIcon className="size-4 mr-2"/>
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {query.data?.map((channel) => (
                        <Link
                            key={channel.id}
                            href={`/channels/${channel.id}`}
                            className={cn(
                                "rounded-xl text-neutral-50 font-medium text-sm p-3 -mx-2 mb-1",
                                channelId === channel.id
                                    ? "bg-neutral-700/50"
                                    : "hover:bg-neutral-800"
                            )}
                        >
                            {channel.name}
                        </Link>
                    ))}
                    <CreateGroup open={createGroup} setOpen={setCreateGroup}/>
                    <JoinGroup open={joinGroup} setOpen={setJoinGroup}/>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label="New Chat"
                            className={cn(
                                buttonVariants({
                                    color: "secondary",
                                    size: "icon",
                                    className: "absolute right-4 bottom-4",
                                })
                            )}
                        >
                            <PlusIcon/>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => setCreateGroup(true)}>
                                Create Group
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setJoinGroup(true)}>
                                Join Group
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Sidebar>
                <div className="flex flex-col flex-1">{children}</div>
            </main>
        </ToastLayout>
    );
}
