import ConversationLogSamples, {
  BubbleLogSample,
  TimelineLogSample,
  bubbleLines,
  timelineLines,
} from "./ConversationLogSamples";

export {
  BubbleLogSample,
  ConversationLogSamples,
  TimelineLogSample,
  bubbleLines,
  timelineLines,
};

export const conversationLogSamplesInfo = {
  id: "sample.conversation-log.two-patterns",
  name: "ConversationLogSamples",
  displayName: "会話ログ 2パターン",
  category: "ConversationLog",
  component: ConversationLogSamples,
  source: "src/SampleComponent/ConversationLog/ConversationLogSamples.jsx",
  style: "src/SampleComponent/ConversationLog/ConversationLogSamples.css",
  status: "sample",
  tags: ["solidjs", "jsx", "conversation-log", "timeline", "speech-bubble"],
  props: {},
};

export default ConversationLogSamples;
