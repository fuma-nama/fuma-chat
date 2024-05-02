import {inviteTable, memberTable} from "@/lib/database/schema";
import {db} from "@/lib/server/db";
import {handler, requireAuth, validate} from "@/lib/server/route-handler";
import {getInvite, postInvite} from "@/lib/server/zod";
import {createId} from "@paralleldrive/cuid2";
import {and, eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import {hasPermission, Permissions} from "@/lib/server/permissions";

export const GET = handler<"/api/invites:get">(async (req) => {
    const auth = requireAuth()
    const body = await validate(req, getInvite);

    const membership = await db.select().from(memberTable).where(and(eq(memberTable.userId, auth.userId), eq(memberTable.channelId, body.channelId))).limit(1).then(res => res[0])

    if (!membership) return NextResponse.json("Only members can get invite code", {status: 401})

    const invites = await db
        .select()
        .from(inviteTable)
        .where(eq(inviteTable.channelId, body.channelId))

    if (invites.length > 0) {
        return NextResponse.json(invites[0].code);
    }

    const code = createId();
    await db.insert(inviteTable).values({
        code,
        channelId: body.channelId,
    });

    return NextResponse.json(code);
});

export const POST = handler<"/api/invites:post">(async (req) => {
    const auth = requireAuth()
    const body = await validate(req, postInvite);

    const membership = await db.select().from(memberTable).where(and(eq(memberTable.userId, auth.userId), eq(memberTable.channelId, body.channelId))).limit(1).then(res => res[0])

    if (!hasPermission(membership.permissions, Permissions.Admin)) return NextResponse.json("Only group admins can update invite code", {status: 401})

    const newId = createId()
    await db.delete(inviteTable).where(eq(inviteTable.channelId, body.channelId))
    await db.insert(inviteTable).values({
        channelId: body.channelId,
        code: newId
    })

    return NextResponse.json(newId);
});
