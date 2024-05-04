import {channelTable, inviteTable, memberTable} from "@/lib/database/schema";
import {db} from "@/lib/server/db";
import {handler, requireAuth, validate} from "@/lib/server/route-handler";
import {postChannelJoin} from "@/lib/server/zod";
import {eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import {sendUser} from "@/lib/server/pusher";
import {ChannelWithMember} from "@/lib/server/types";

export const POST = handler<"/api/channels/join:post">(async (req) => {
    const user = requireAuth();
    const body = await validate(req, postChannelJoin);
    const invite = await db
        .select()
        .from(inviteTable)
        .where(eq(inviteTable.code, body.code))
        .innerJoin(channelTable, eq(channelTable.id, inviteTable.channelId))
        .limit(1).then(res => res[0]);

    if (!invite)
        return NextResponse.json(
            {message: "Invalid invite code"},
            {status: 404}
        );

    const data: ChannelWithMember = {
        channel: {
            id: invite.channels.id,
            name: invite.channels.name,
            ownerId: invite.channels.ownerId
        }, member: {permissions: 0}
    }

    await Promise.all([
        db
            .insert(memberTable)
            .values({
                channelId: invite.invites.channelId,
                userId: user.userId,
            })
            .onConflictDoNothing(),
        sendUser(user.userId, 'channel-join', data)
    ])

    return NextResponse.json(data);
});
