import { inviteTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { handler, validate } from "@/lib/server/route-handler";
import { API } from "@/lib/server/types";
import { getInvite } from "@/lib/server/zod";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = handler<API["/api/invites:get"]["data"]>(async (req) => {
  const body = await validate(req, getInvite, "params");

  const invites = await db
    .select()
    .from(inviteTable)
    .where(eq(inviteTable.channelId, body.channelId))
    .limit(1);

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
