import type Pusher from "pusher-js";
import { create } from "zustand";
import { Message } from "../server/types";

export const useStore = create(() => ({
  pusher: undefined as Pusher | undefined,
  messages: new Map<string, Message[]>(),
}));
