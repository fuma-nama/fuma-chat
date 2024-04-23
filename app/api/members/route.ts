import { memberTable } from "@/lib/database/schema";
import { db } from "@/lib/server/db";
import { handler, requireAuth, validate } from "@/lib/server/route-handler";
import { getMembers } from "@/lib/server/zod";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = handler<"/api/members:get">(async (req) => {
  const { userId } = requireAuth();

  const data = await validate(req, getMembers);
  const members = await db
    .select()
    .from(memberTable)
    .where(eq(memberTable.channelId, data.channelId));

  if (members.every((m) => m.userId !== userId))
    return NextResponse.json(
      { message: "You must join the group to see its members" },
      { status: 401 }
    );

  const users = await clerkClient.users.getUserList({
    userId: members.map((m) => m.userId),
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json(
    members.flatMap((m) => {
      const user = userMap.get(m.userId);
      if (!user) return [];

      return {
        user: {
          id: user.id,
          imageUrl: user.imageUrl,
          name: `${user.firstName} ${user.lastName}`,
        },
        permissions: m.permissions,
      };
    })
  );
});
