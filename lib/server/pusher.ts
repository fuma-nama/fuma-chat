import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_API_KEY!,
  secret: process.env.PUSHER_API_SECRET!,
  cluster: "us3",
  useTLS: true,
});
