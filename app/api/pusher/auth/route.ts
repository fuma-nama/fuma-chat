import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {requireAuth} from "@/lib/server/route-handler";
import {db} from "@/lib/server/db";
import {memberTable} from "@/lib/database/schema";
import {and, eq} from "drizzle-orm";
import {pusher} from "@/lib/server/pusher";

const channelPrefix = 'presence-channel-'

export async function POST(req: NextRequest) {
    const auth = requireAuth()
    const data = new URLSearchParams(await req.text())
    const channelName = data.get('channel_name')
    const socketId = data.get('socket_id')

    if (!socketId || !channelName) return NextResponse.json({message: "Invalid"}, {status: 400})

    if (channelName.startsWith(channelPrefix)) {
        const channelId = channelName.slice(channelPrefix.length)

        const member = await db.select().from(memberTable).where(and(eq(memberTable.channelId, channelId), eq(memberTable.userId, auth.userId))).limit(1).then(res => res[0])

        if (member) {
            const auth = pusher.authorizeChannel(socketId, channelName)
            return NextResponse.json(auth)
        }

        return NextResponse.json({message: 'Not a member of the group'}, {status: 401})
    }

    return NextResponse.json({message: 'Invalid channel name'}, {status: 400})
}