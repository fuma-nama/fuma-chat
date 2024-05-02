import {channelTable, memberTable, messageTable} from "@/lib/database/schema";
import {db} from "@/lib/server/db";
import {
    handler,
    requireAuth,
    requireUser,
    validate,
} from "@/lib/server/route-handler";
import {deleteChannel, patchChannel, postChannel} from "@/lib/server/zod";
import {createId} from "@paralleldrive/cuid2";
import {and, eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import {hasPermission, Permissions} from "@/lib/server/permissions";

export const GET = handler<"/api/channels:get">(async () => {
    const {userId} = requireAuth();

    const result = await db
        .select()
        .from(memberTable)
        .where(eq(memberTable.userId, userId))
        .innerJoin(channelTable, eq(channelTable.id, memberTable.channelId));

    return NextResponse.json(
        result.map(({channels, members}) => ({
            channel: {
                id: channels.id,
                name: channels.name,
                ownerId: channels.ownerId,
            },
            member: {
                permissions: members.permissions
            }
        }))
    );
});

export const POST = handler<"/api/channels:post">(async (req) => {
    const user = await requireUser();
    const data = await validate(req, postChannel);

    const id = createId();
    await db.insert(channelTable).values({
        id,
        name: data.name,
        ownerId: user.id,
    });
    await db.insert(memberTable).values({
        channelId: id,
        userId: user.id,
        permissions: Permissions.Admin
    });

    return NextResponse.json(id);
});

export const PATCH = handler<'/api/channels:patch'>(async req => {
    const {userId} = requireAuth()
    const data = await validate(req, patchChannel)

    const membership = await db.select().from(memberTable).where(and(eq(memberTable.channelId, data.channelId), eq(memberTable.userId, userId))).limit(1).then(res => res[0]);

    if (!membership || !hasPermission(membership.permissions, Permissions.Admin)) return NextResponse.json({
        message: "Only admins can edit group info",
        status: 401
    });

    const updated = await db.update(channelTable).set({name: data.name}).where(eq(channelTable.id, data.channelId)).returning()

    if (updated.length === 0) return NextResponse.json({message: "Channel not found"}, {status: 404})

    return NextResponse.json(updated[0])
})

export const DELETE = handler<"/api/channels:delete">(async (req) => {
    const {userId} = requireAuth();
    const data = await validate(req, deleteChannel);

    const channel = await db
        .select()
        .from(channelTable)
        .where(eq(channelTable.id, data.channelId));

    if (channel.length === 0)
        return NextResponse.json(
            {message: "Channel doesn't exist"},
            {status: 404}
        );

    if (channel[0].ownerId !== userId) {
        return NextResponse.json(
            {
                message: "Only the owner can delete chat group",
            },
            {status: 401}
        );
    }

    await db.delete(memberTable).where(eq(memberTable.channelId, data.channelId));
    await db.delete(channelTable).where(eq(channelTable.id, data.channelId));
    await db
        .delete(messageTable)
        .where(eq(messageTable.channelId, data.channelId));

    return NextResponse.json({
        message: "successful",
    });
});
