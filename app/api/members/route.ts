import {channelTable, memberTable} from "@/lib/database/schema";
import {db} from "@/lib/server/db";
import {handler, requireAuth, validate} from "@/lib/server/route-handler";
import {deleteMember, getMembers} from "@/lib/server/zod";
import {clerkClient} from "@clerk/nextjs/server";
import {and, eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import {hasPermission, Permissions} from "@/lib/server/permissions";

export const GET = handler<"/api/members:get">(async (req) => {
    const {userId} = requireAuth();

    const data = await validate(req, getMembers);
    const members = await db
        .select()
        .from(memberTable)
        .where(eq(memberTable.channelId, data.channelId));

    if (members.every((m) => m.userId !== userId))
        return NextResponse.json(
            {message: "You must join the group to see its members"},
            {status: 401}
        );

    const users = await clerkClient.users.getUserList({
        userId: members.map((m) => m.userId),
    });
    const userMap = new Map(users.data.map((u) => [u.id, u]));

    return NextResponse.json(
        members.flatMap((m) => {
            const user = userMap.get(m.userId);
            if (!user) return [];

            return {
                user: {
                    id: user.id,
                    imageUrl: user.imageUrl,
                    name: `${user.firstName} ${user.lastName}`,
                },
                permissions: m.permissions,
            };
        })
    );
});

export const DELETE = handler<'/api/members:delete'>(async req => {
    const {userId} = requireAuth()
    const data = await validate(req, deleteMember)

    const channel = await db.select()
        .from(channelTable)
        .where(eq(channelTable.id, data.channelId))
        .limit(1)
        .then(res => res[0]);

    if (!channel)
        return NextResponse.json({message: "Channel not found"}, {status: 404});

    if (data.memberId === channel.ownerId)
        return NextResponse.json({message: "Group owner can't be kicked"}, {status: 401});

    const membership = await db.select()
        .from(memberTable)
        .where(and(eq(memberTable.channelId, data.channelId), eq(memberTable.userId, userId)))
        .limit(1)
        .then(res => res[0])

    if (!membership)
        return NextResponse.json({message: "You must be the member of channel"}, {status: 401});

    if (!hasPermission(membership.permissions, Permissions.Kick) && !hasPermission(membership.permissions, Permissions.Admin))
        return NextResponse.json({message: "You do not have the permission to kick members"}, {status: 401});

    await db.delete(memberTable).where(and(eq(memberTable.channelId, data.channelId), eq(memberTable.userId, data.memberId)));

    return NextResponse.json({message: "Successful"})
})