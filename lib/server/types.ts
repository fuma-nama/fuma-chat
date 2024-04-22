import { z } from "zod";
import {
  deleteChannel,
  getMembers,
  getMessages,
  postChannel,
  getInvite,
  postMessage,
  postChannelJoin,
} from "./zod";

export interface Realtime {
  channel: {
    "my-event": Message;
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
    params: z.infer<typeof getMessages>;
    data: Message[];
  };
  "/api/channels": {
    params: never;
    data: Channel[];
  };
  "/api/members": {
    params: z.infer<typeof getMembers>;
    data: Member[];
  };
  "/api/invites": {
    params: z.infer<typeof getInvite>;
    data: string;
  };
}

export interface POST {
  "/api/messages": {
    body: z.infer<typeof postMessage>;
    data: string;
  };
  "/api/channels": {
    body: z.infer<typeof postChannel>;
    data: string;
  };
  "/api/channels/join": {
    body: z.infer<typeof postChannelJoin>;
    /**
     * Channel Id
     */
    data: string;
  };
}

export interface DELETE {
  "/api/channels": {
    params: z.infer<typeof deleteChannel>;
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
