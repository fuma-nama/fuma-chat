import { channelTable, memberTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { requireUser, validate } from "@/lib/server/route-handler";
import { GET, POST } from "@/lib/server/types";
import { postChannel } from "@/lib/server/zod";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const auth = await requireUser();
  if (!auth.success) return auth.response;

  const result = await db
    .select({ channel: channelTable })
    .from(memberTable)
    .where(eq(memberTable.userId, auth.user.id))
    .innerJoin(channelTable, eq(channelTable.id, memberTable.channelId));

  return NextResponse.json<GET["/api/channels"]["data"]>(
    result.map(({ channel }) => ({
      id: channel.id,
      name: channel.name,
    }))
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.success) return auth.response;
  const result = await validate(req, postChannel);
  if (!result.success) return result.response;

  const id = createId();
  await db.insert(channelTable).values({
    id,
    name: result.data.name,
    ownerId: auth.user.id,
  });
  await db.insert(memberTable).values({
    channelId: id,
    userId: auth.user.id,
  });

  return NextResponse.json<POST["/api/channels"]["data"]>(id);
}
