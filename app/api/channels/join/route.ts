import { inviteTable, memberTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { handler, requireAuth, validate } from "@/lib/server/route-handler";
import { API } from "@/lib/server/types";
import { postChannelJoin } from "@/lib/server/zod";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const POST = handler<API["/api/channels/join:post"]["data"]>(
  async (req) => {
    const user = requireAuth();
    const body = await validate(req, postChannelJoin);
    const invites = await db
      .select()
      .from(inviteTable)
      .where(eq(inviteTable.code, body.code))
      .limit(1);

    if (invites.length === 0)
      return NextResponse.json(
        { message: "Invalid invite code" },
        { status: 404 }
      );
    const channelId = invites[0].channelId;

    await db
      .insert(memberTable)
      .values({
        channelId,
        userId: user.userId,
      })
      .onConflictDoNothing();

    return NextResponse.json(channelId);
  }
);
