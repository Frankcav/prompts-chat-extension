import { defineExtensionMessaging } from '@webext-core/messaging';

// Protocol for popup/sidepanel → background communication
interface ProtocolMap {
  usePrompt(data: { modelId: string; prompt: string }): { success: boolean };
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();

// Types for background → content script communication (uses browser.tabs.sendMessage)
export interface InsertPromptMessage {
  action: 'insertPrompt';
  data: { prompt: string; inputSelector: string };
}

export interface InsertPromptResponse {
  success: boolean;
  error?: unknown;
}
