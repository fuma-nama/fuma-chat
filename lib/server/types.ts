import {z} from "zod";
import {
    deleteChannel,
    getMembers,
    getMessages,
    postChannel,
    getInvite,
    postMessage,
    postChannelJoin,
    deleteMessage,
} from "./zod";

export interface Realtime {
    channel: {
        "message-send": Message;
        "message-delete": { id: string, channelId: string };
    };
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
}

export interface GET {
    "/api/messages": {
        input: z.input<typeof getMessages>;
        data: Message[];
    };
    "/api/channels": {
        input: undefined;
        data: Channel[];
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
        data: string;
    };
    "/api/channels/join": {
        input: z.infer<typeof postChannelJoin>;
        /**
         * Channel Id
         */
        data: string;
    };
}

export interface DELETE {
    "/api/channels": {
        input: z.infer<typeof deleteChannel>;
        data: { message: string };
    };
    "/api/messages": {
        input: z.infer<typeof deleteMessage>;
        data: { message: string };
    };
}

export type API = {
    [K in keyof GET as K extends string ? `${K}:get` : never]: GET[K];
} & {
    [K in keyof POST as K extends string ? `${K}:post` : never]: POST[K];
} & {
    [K in keyof DELETE as K extends string ? `${K}:delete` : never]: DELETE[K];
};
