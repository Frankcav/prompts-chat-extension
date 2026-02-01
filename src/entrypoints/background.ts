import { buildPlatformUrl, getPlatformById } from '@/lib/constants';
import { onMessage, InsertPromptMessage, InsertPromptResponse } from '@/utils/messaging';
import type { Browser } from 'wxt/browser';

export default defineBackground(() => {
  function isOnModelDomain(currentUrl: string, baseUrl: string): boolean {
    try {
      const currentUrlObj = new URL(currentUrl);
      const baseUrlObj = new URL(baseUrl);
      return currentUrlObj.hostname === baseUrlObj.hostname;
    } catch {
      return false;
    }
  }

  async function getActiveTab() {
    const tabs = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    if (tabs.length > 0) {
      return tabs[0];
    }

    const allTabs = await browser.tabs.query({
      lastFocusedWindow: true
    });

    return allTabs[0];
  }

  async function insertPrompt({ prompt, inputSelector, tabId }: { prompt: string; inputSelector: string; tabId?: number }): Promise<InsertPromptResponse> {
    const targetTabId = tabId ?? (await getActiveTab())?.id;
    if (!targetTabId) return { success: false };

    try {
      const message: InsertPromptMessage = {
        action: 'insertPrompt',
        data: { prompt, inputSelector }
      };
      return await browser.tabs.sendMessage(targetTabId, message);
    } catch {
      return { success: false };
    }
  }

  async function insertPromptWithRetry({
    prompt,
    inputSelector,
    tabId,
    maxRetries = 5,
    initialDelay = 300
  }: {
    prompt: string;
    inputSelector: string;
    tabId: number;
    maxRetries?: number;
    initialDelay?: number;
  }): Promise<{ success: boolean }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await insertPrompt({ prompt, inputSelector, tabId });
      if (response?.success) {
        return response;
      }
      // Exponential backoff: 300ms, 600ms, 1200ms, 2400ms, 4800ms
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return { success: false };
  }

  function waitForTabToLoad(requestedTabId: number): Promise<Browser.tabs.Tab> {
    return new Promise(resolve => {
      const listener = (tabId: number, info: Browser.tabs.OnUpdatedInfo, tab: Browser.tabs.Tab) => {
        if (info.status === 'complete' && tabId === requestedTabId) {
          browser.tabs.onUpdated.removeListener(listener);
          resolve(tab);
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });
  }

  async function handleUsePrompt(data: { modelId: string; prompt: string }): Promise<boolean> {
    const { modelId, prompt } = data;
    const platform = getPlatformById(modelId);
    if (!platform) return false;

    try {
      const activeTab = await getActiveTab();

      const isOnDomain = activeTab?.url && isOnModelDomain(activeTab.url, platform.baseUrl);

      if (isOnDomain && platform.inputSelector) {
        const response = await insertPrompt({ prompt, inputSelector: platform.inputSelector });
        if (response?.success) return true;
      }

      if (platform.supportsQuerystring || platform.isDeeplink) {
        const url = buildPlatformUrl(platform.id, platform.baseUrl, prompt);
        const tab = await browser.tabs.create({ url });
        return !!tab?.id;
      }

      if (platform.inputSelector) {
        const tabCreated = await browser.tabs.create({ url: platform.baseUrl });
        if (!tabCreated?.id) return false;

        await waitForTabToLoad(tabCreated.id);

        const response = await insertPromptWithRetry({
          prompt,
          inputSelector: platform.inputSelector,
          tabId: tabCreated.id
        });
        return response?.success ?? false;
      }

      const tab = await browser.tabs.create({ url: platform.baseUrl });
      return !!tab?.id;
    } catch (error) {
      console.error('Error in handleUsePrompt:', error);
      return false;
    }
  }

  onMessage('usePrompt', async (message) => {
    const success = await handleUsePrompt(message.data);
    return { success };
  });
});
