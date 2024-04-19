import { channelTable, memberTable, messageTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { pusher } from "@/lib/server/pusher";
import { GET, POST, Realtime } from "@/lib/server/types";
import { createId } from "@paralleldrive/cuid2";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, validate } from "@/lib/server/route-handler";
import { getMessages, postMessage } from "@/lib/server/zod";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) return auth.response;
  const result = await validate(req, getMessages, "params");
  if (!result.success) return result.response;

  const member = await db
    .select()
    .from(memberTable)
    .where(eq(memberTable.userId, auth.user.id))
    .limit(1);

  if (member.length === 0)
    return NextResponse.json(
      { message: "You must be the member of channel" },
      { status: 401 }
    );

  const messages = await db
    .select()
    .from(messageTable)
    .where(eq(messageTable.channelId, result.data.channelId));

  const list = await clerkClient.users.getUserList({
    userId: messages.map((m) => m.userId),
  });

  const userMap = new Map(list.map((u) => [u.id, u]));

  return NextResponse.json<GET["/api/messages"]["data"]>(
    messages.flatMap((message) => {
      const user = userMap.get(message.userId);
      if (!user) return [];

      return {
        id: message.id,
        channelId: result.data.channelId,
        user: {
          id: message.userId,
          imageUrl: user.imageUrl,
          name: `${user.firstName} ${user.lastName}`,
        },
        message: message.content,
        timestamp: message.timestamp.getTime(),
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) return auth.response;
  const result = await validate(req, postMessage);
  if (!result.success) return result.response;

  const id = createId();

  await db.insert(messageTable).values({
    id,
    userId: auth.user.id,
    channelId: result.data.channelId,
    content: result.data.message,
  });

  await pusher.trigger(result.data.channelId, "my-event", {
    id,
    user: {
      id: auth.user.id,
      imageUrl: auth.user.imageUrl,
      name: `${auth.user.firstName} ${auth.user.lastName}`,
    },
    message: result.data.message,
    channelId: result.data.channelId,
    timestamp: Date.now(),
  } satisfies Realtime["channel"]["my-event"]);

  return NextResponse.json<POST["/api/messages"]["data"]>(id);
}
