import {handler, requireAuth, validate} from "@/lib/server/route-handler";
import {postChannelLeave} from "@/lib/server/zod";
import {db} from "@/lib/server/db";
import {channelTable, memberTable} from "@/lib/database/schema";
import {and, eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import {pusher} from "@/lib/server/pusher";

export const POST = handler<'/api/channels/leave:post'>(async req => {
    const auth = requireAuth()
    const body = await validate(req, postChannelLeave)

    const group = await db.select().from(channelTable).where(eq(channelTable.id, body.channelId)).limit(1).then(res => res[0])

    if (group && group.ownerId === auth.userId)
        return NextResponse.json({message: "Group owner cannot leave the group"}, {status: 404})

    const result = await db.delete(memberTable).where(and(eq(memberTable.channelId, body.channelId), eq(memberTable.userId, auth.userId)))

    if (result.rowCount === 0)
        return NextResponse.json({message: "You are not a member of the group"}, {status: 404})

    return NextResponse.json("Successful")
})