import { z } from "zod";
import { getMessages, postChannel, postMessage } from "./zod";

export interface Realtime {
  channel: {
    "my-event": Message;
  };
}

export interface Message {
  id: string;
  channelId: string;
  user: string;
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
