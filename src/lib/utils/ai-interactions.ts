import { Platform } from "../constants";
import { sendMessage } from "@/utils/messaging";

export async function usePromptInAI(prompt: string, platform: Platform): Promise<boolean> {
  if (!platform) return false;

  try {
    const response = await sendMessage('usePrompt', {
      modelId: platform.id,
      prompt
    });
    return response?.success ?? false;
  } catch (error) {
    console.error('Error using prompt in AI:', error);
    return false;
  }
}
