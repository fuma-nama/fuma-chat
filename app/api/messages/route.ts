import { messageTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { pusher } from "@/lib/server/pusher";
import { GET, POST, Realtime } from "@/lib/server/types";
import { createId } from "@paralleldrive/cuid2";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { validate } from "@/lib/server/route-handler";
import { getMessages, postMessage } from "@/lib/server/zod";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const result = await validate(req, getMessages, "params");
  if (!result.success) return result.response;

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
  const user = await currentUser();
  if (!user) return NextResponse.json("not logged in", { status: 401 });
  const result = await validate(req, postMessage);
  if (!result.success) return result.response;

  const id = createId();

  await db.insert(messageTable).values({
    id,
    userId: user.id,
    channelId: result.data.channelId,
    content: result.data.message,
  });

  await pusher.trigger(result.data.channelId, "my-event", {
    id,
    user: {
      id: user.id,
      imageUrl: user.imageUrl,
      name: `${user.firstName} ${user.lastName}`,
    },
    message: result.data.message,
    channelId: result.data.channelId,
    timestamp: Date.now(),
  } satisfies Realtime["channel"]["my-event"]);

  return NextResponse.json<POST["/api/messages"]["data"]>(id);
}
