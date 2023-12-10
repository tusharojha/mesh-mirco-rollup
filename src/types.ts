export interface Message {
  'role': string;
  'content': string; // JSON string.
}

export type Conversations = {
  messages: Message[];
}

export type StoryMint = {
  title: string;
  description: string; // summary.
  image: string; // base64 encoded image from AI.
  prompt: string;
  story: Conversations;
}
