import { messageTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { pusher } from "@/lib/server/pusher";
import { Message, Schema } from "@/lib/server/types";
import { createId } from "@paralleldrive/cuid2";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";

export async function GET() {
  await currentUser();
  const messages = await db.select().from(messageTable);

  return NextResponse.json<Message[]>(
    messages.map((message) => ({
      id: message.id,
      user: message.userId,
      message: message.content,
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const { content } = await req.json();
  if (!user) return NextResponse.json("not logged in", { status: 401 });
  const id = createId();

  await db.insert(messageTable).values({
    id,
    userId: user.id,
    content,
  });

  await pusher.trigger("my-channel", "my-event", {
    id,
    user: user.id,
    message: content,
  } as Schema["channel"]["my-event"]);

  return NextResponse.json(id);
}
