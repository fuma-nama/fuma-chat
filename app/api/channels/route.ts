import {channelTable, memberTable, messageTable} from "@/lib/database/schema";
import {db} from "@/lib/server/db";
import {
    handler,
    requireAuth,
    requireUser,
    validate,
} from "@/lib/server/route-handler";
import {deleteChannel, postChannel} from "@/lib/server/zod";
import {createId} from "@paralleldrive/cuid2";
import {eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import {Permissions} from "@/lib/server/permissions";

export const GET = handler<"/api/channels:get">(async () => {
    const {userId} = requireAuth();

    const result = await db
        .select({channel: channelTable})
        .from(memberTable)
        .where(eq(memberTable.userId, userId))
        .innerJoin(channelTable, eq(channelTable.id, memberTable.channelId));

    return NextResponse.json(
        result.map(({channel}) => ({
            id: channel.id,
            name: channel.name,
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
