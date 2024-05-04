import {z} from "zod";

export const postMessage = z.strictObject({
    channelId: z.string().min(1),
    message: z.string().trim().min(1).max(2000),
});

export const getMessages = z.strictObject({
    channelId: z.string(),
    count: z.string().transform(s => Number(s)).optional(),
    before: z.string({description: "Fetch message before a specific timestamp"}).transform(s => Number(s)).optional()
})

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

export const postInvite = z.strictObject({
    channelId: z.string(),
})

export const deleteMember = z.strictObject({
    channelId: z.string(),
    memberId: z.string()
})

export const patchChannel = z.strictObject({
    channelId: z.string(),
    name: z.string().min(1).max(255),
})

export const postChannelLeave = z.strictObject({
    channelId: z.string(),
})