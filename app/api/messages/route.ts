import {memberTable, messageTable} from "@/lib/database/schema";
import {db} from "@/lib/server/db";
import {sendChannel} from "@/lib/server/pusher";
import {createId} from "@paralleldrive/cuid2";
import {NextResponse} from "next/server";
import {
    handler,
    requireAuth,
    requireUser,
    validate,
} from "@/lib/server/route-handler";
import {deleteMessage, getMessages, patchMessage, postMessage} from "@/lib/server/zod";
import {and, desc, eq, lt, SQLWrapper} from "drizzle-orm";
import {clerkClient} from "@clerk/nextjs/server";
import {hasPermission, Permissions} from "@/lib/server/permissions";

export const GET = handler<"/api/messages:get">(async (req) => {
    const {userId} = requireAuth();
    const data = await validate(req, getMessages);

    const member = await db
        .select()
        .from(memberTable)
        .where(eq(memberTable.userId, userId))
        .limit(1);

    if (member.length === 0)
        return NextResponse.json(
            {message: "You must be the member of channel"},
            {status: 401}
        );

    const messages = await db
        .select()
        .from(messageTable)
        .where(() => {
            const conditions: SQLWrapper[] = []
            conditions.push(eq(messageTable.channelId, data.channelId))

            if (data.before !== undefined) {
                conditions.push(lt(messageTable.timestamp, new Date(data.before)))
            }

            return and(...conditions)
        }).limit(data.count ?? 20).orderBy(desc(messageTable.timestamp));

    const list = await clerkClient.users.getUserList({
        userId: messages.map((m) => m.userId),
    });

    const userMap = new Map(list.data.map((u) => [u.id, u]));

    return NextResponse.json(
        messages.flatMap((message) => {
            const user = userMap.get(message.userId);
            if (!user) return [];

            return {
                id: message.id,
                channelId: data.channelId,
                user: {
                    id: message.userId,
                    imageUrl: user.imageUrl,
                    name: `${user.firstName} ${user.lastName}`,
                },
                message: message.content,
                timestamp: message.timestamp.getTime(),
            };
        }).reverse()
    );
});

export const POST = handler<"/api/messages:post">(async (req) => {
    const user = await requireUser();
    const body = await validate(req, postMessage);

    const id = createId();

    await Promise.all([
        db.insert(messageTable).values({
            id,
            userId: user.id,
            channelId: body.channelId,
            content: body.message,
        }),
        sendChannel(body.channelId, 'message-send', {
            id,
            user: {
                id: user.id,
                imageUrl: user.imageUrl,
                name: `${user.firstName} ${user.lastName}`,
            },
            message: body.message,
            channelId: body.channelId,
            timestamp: Date.now(),
            nonce: body.nonce
        })
    ])

    return NextResponse.json(id);
});

export const DELETE = handler<"/api/messages:delete">(async (req) => {
    const auth = requireAuth();
    const body = await validate(req, deleteMessage);

    const membership = await db.select().from(memberTable).where(eq(memberTable.userId, auth.userId)).limit(1).then(res => res[0])

    if (!membership)
        return NextResponse.json(
            {message: "You must be the member of channel"},
            {status: 401}
        );

    const message = await db
        .select({userId: messageTable.userId})
        .from(messageTable)
        .where(
            and(
                eq(messageTable.id, body.id),
                eq(messageTable.channelId, body.channelId)
            )
        )
        .limit(1)
        .then((res) => res[0]);

    if (!message)
        return NextResponse.json(
            {message: "Message doesn't exist"},
            {status: 404}
        );
    if (message.userId !== auth.userId && !hasPermission(membership.permissions, Permissions.DeleteMessage) && !hasPermission(membership.permissions, Permissions.Admin))
        return NextResponse.json(
            {message: "You don't have the permission"},
            {status: 401}
        );

    await Promise.all([
        db.delete(messageTable).where(eq(messageTable.id, body.id)),
        sendChannel(body.channelId, "message-delete", {
            id: body.id,
            channelId: body.channelId,
        })
    ])

    return NextResponse.json({message: "Successful"});
});

export const PATCH = handler<'/api/messages:patch'>(async req => {
    const auth = requireAuth()
    const body = await validate(req, patchMessage)

    const result = await db.update(messageTable).set({
        content: body.content
    }).where(and(eq(messageTable.channelId, body.channelId), eq(messageTable.id, body.messageId), eq(messageTable.userId, auth.userId)))

    if (result.rowCount === 0) return NextResponse.json({message: "No permission"}, {status: 401})

    await sendChannel(body.channelId, 'message-update', {
        id: body.messageId,
        channelId: body.channelId,
        content: body.content
    })
    return NextResponse.json({message: "Successful"})
})