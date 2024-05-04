import {NextRequest, NextResponse} from "next/server";
import {pusher} from "@/lib/server/pusher";
import {requireAuth} from "@/lib/server/route-handler";

export async function POST(req: NextRequest) {
    const socketId = new URLSearchParams(await req.text()).get('socket_id')
    const auth = requireAuth()

    if (!socketId) return NextResponse.json({message: "Invalid"}, {status: 400})

    const authResponse = pusher.authenticateUser(socketId, {
        id: auth.userId,
    });

    return NextResponse.json(authResponse)
}