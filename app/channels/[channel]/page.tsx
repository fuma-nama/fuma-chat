import { db } from "@/lib/server/db";
import { channelTable } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import View from "./page.client";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { channel: string };
}) {
  const channelInfo = await db
    .select()
    .from(channelTable)
    .where(eq(channelTable.id, params.channel));

  if (channelInfo.length === 0) notFound();

  return <View channelInfo={channelInfo[0]} params={params} />;
}
