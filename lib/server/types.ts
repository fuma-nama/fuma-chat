import {z} from "zod";
import {
    deleteChannel,
    getMembers,
    getMessages,
    postChannel,
    getInvite,
    postMessage,
    postChannelJoin,
    deleteMessage, deleteMember, postInvite, patchChannel, postChannelLeave, patchMessage,
} from "./zod";

export interface Realtime {
    channel: {
        "message-send": Message & {
            /**
             * Only exists in realtime events
             */
            nonce?: string
        };
        "message-delete": { id: string, channelId: string };
        "message-update": { id: string, channelId: string, content: string }
        "channel-delete": { channelId: string }
    };
    user: {
        "channel-join": ChannelWithMember
        "channel-leave": { channelId: string }
    }
}

export interface User {
    id: string;
    imageUrl: string;
    name: string;
}

export interface Member {
    user: User;
    permissions: number;
}

export interface Message {
    id: string;
    channelId: string;
    user: User;
    message: string;
    timestamp: number;
}

export interface Channel {
    id: string;
    name: string;
    ownerId: string
}

export interface ChannelWithMember {
    channel: Channel
    member: {
        permissions: number
    }
}

export interface GET {
    "/api/messages": {
        input: z.input<typeof getMessages>;
        data: Message[];
    };
    "/api/channels": {
        input: undefined;
        data: ChannelWithMember[];
    };
    "/api/members": {
        input: z.input<typeof getMembers>;
        data: Member[];
    };
    "/api/invites": {
        input: z.input<typeof getInvite>;
        data: string;
    };
}

export interface POST {
    "/api/messages": {
        input: z.infer<typeof postMessage>;
        data: string;
    };
    "/api/channels": {
        input: z.infer<typeof postChannel>;
        data: ChannelWithMember;
    };
    "/api/channels/join": {
        input: z.infer<typeof postChannelJoin>;

        data: ChannelWithMember;
    };
    "/api/invites": {
        input: z.infer<typeof postInvite>
        /**
         * New invite code
         */
        data: string
    }
    "/api/channels/leave": {
        input: z.input<typeof postChannelLeave>

        data: string
    }
}

export interface PATCH {
    "/api/channels": {
        input: z.infer<typeof patchChannel>
        data: Channel
    }
    "/api/messages": {
        input: z.input<typeof patchMessage>
        data: { message: string }
    }
}

export interface DELETE {
    "/api/channels": {
        input: z.input<typeof deleteChannel>;
        data: { message: string };
    };
    "/api/messages": {
        input: z.input<typeof deleteMessage>;
        data: { message: string };
    };
    "/api/members": {
        input: z.input<typeof deleteMember>
        data: { message: string }
    }
}

export type API = {
    [K in keyof GET as K extends string ? `${K}:get` : never]: GET[K];
} & {
    [K in keyof POST as K extends string ? `${K}:post` : never]: POST[K];
} & {
    [K in keyof PATCH as K extends string ? `${K}:patch` : never]: PATCH[K];
} & {
    [K in keyof DELETE as K extends string ? `${K}:delete` : never]: DELETE[K];
};
