import ConversationScreenSample, { ConversationStage } from "./ConversationScreenSample";

export { ConversationScreenSample, ConversationStage };

export const conversationScreenSampleInfo = {
  id: "sample.conversation-screen.pc-mobile",
  name: "ConversationScreenSample",
  displayName: "会話画面 PC/Mobile",
  category: "Conversation",
  component: ConversationScreenSample,
  source: "src/SampleComponent/ConversationScreen/ConversationScreenSample.jsx",
  style: "src/SampleComponent/ConversationScreen/ConversationScreenSample.css",
  status: "sample",
  tags: ["solidjs", "jsx", "conversation-screen", "pc", "pixel-6a", "responsive"],
  props: {},
};

export default ConversationScreenSample;
