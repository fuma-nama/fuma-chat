import { z } from "zod";

export const postMessage = z.strictObject({
  channelId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
});

export const getMessages = z.strictObject({
  channelId: z.string(),
});

export const deleteMessage = z.strictObject({
  id: z.string(),
  channelId: z.string(),
});

export const postChannel = z.strictObject({
  name: z.string().trim().min(1).max(255),
});

export const deleteChannel = z.strictObject({
  channelId: z.string(),
});

export const getMembers = z.strictObject({
  channelId: z.string(),
});

export const getInvite = z.strictObject({
  channelId: z.string(),
});

export const postChannelJoin = z.strictObject({
  code: z.string(),
});
