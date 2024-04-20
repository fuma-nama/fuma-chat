import { memberTable, messageTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { pusher } from "@/lib/server/pusher";
import type { GET as G, POST as P, Realtime } from "@/lib/server/types";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import {
  handler,
  requireAuth,
  requireUser,
  validate,
} from "@/lib/server/route-handler";
import { getMessages, postMessage } from "@/lib/server/zod";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

export const GET = handler<G["/api/messages"]["data"]>(async (req) => {
  const { userId } = requireAuth();
  const data = await validate(req, getMessages, "params");

  const member = await db
    .select()
    .from(memberTable)
    .where(eq(memberTable.userId, userId))
    .limit(1);

  if (member.length === 0)
    return NextResponse.json(
      { message: "You must be the member of channel" },
      { status: 401 }
    );

  const messages = await db
    .select()
    .from(messageTable)
    .where(eq(messageTable.channelId, data.channelId));

  const list = await clerkClient.users.getUserList({
    userId: messages.map((m) => m.userId),
  });

  const userMap = new Map(list.map((u) => [u.id, u]));

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
    })
  );
});

export const POST = handler<P["/api/messages"]["data"]>(async (req) => {
  const user = await requireUser();
  const data = await validate(req, postMessage);

  const id = createId();

  await db.insert(messageTable).values({
    id,
    userId: user.id,
    channelId: data.channelId,
    content: data.message,
  });

  await pusher.trigger(data.channelId, "my-event", {
    id,
    user: {
      id: user.id,
      imageUrl: user.imageUrl,
      name: `${user.firstName} ${user.lastName}`,
    },
    message: data.message,
    channelId: data.channelId,
    timestamp: Date.now(),
  } satisfies Realtime["channel"]["my-event"]);

  return NextResponse.json(id);
});
