export interface Schema {
  channel: {
    "my-event": Message;
  };
}

export interface Message {
  id: string;
  user: string;
  message: string;
}
