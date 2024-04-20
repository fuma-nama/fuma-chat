import { z } from "zod";
import { deleteChannel, getMessages, postChannel, postMessage } from "./zod";

export interface Realtime {
  channel: {
    "my-event": Message;
  };
}

export interface Message {
  id: string;
  channelId: string;
  user: {
    id: string;
    imageUrl: string;
    name: string;
  };
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
