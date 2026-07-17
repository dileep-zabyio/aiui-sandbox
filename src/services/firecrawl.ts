/**
 * Firecrawl API Web Search Service.
 * Persists Firecrawl configuration and handles fetching web search context.
 */

const STORAGE_KEY_FIRECRAWL_KEY = 'aiui_firecrawl_api_key';
const STORAGE_KEY_FIRECRAWL_URL = 'aiui_firecrawl_base_url';
const STORAGE_KEY_SEARCH_ENABLED = 'aiui_search_enabled';

export interface FirecrawlConfig {
  apiKey: string;
  baseUrl: string;
  isSearchEnabled: boolean;
}

export interface SearchResultItem {
  title?: string;
  url?: string;
  markdown?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Config persistence
// ---------------------------------------------------------------------------

export function getStoredFirecrawlConfig(): FirecrawlConfig {
  return {
    apiKey: localStorage.getItem(STORAGE_KEY_FIRECRAWL_KEY) ?? 'fc-9ce6209229fa4d94baf4dd3508704790',
    baseUrl: localStorage.getItem(STORAGE_KEY_FIRECRAWL_URL) ?? 'https://fc.zaby.io',
    isSearchEnabled: localStorage.getItem(STORAGE_KEY_SEARCH_ENABLED) === 'true',
  };
}

export function saveFirecrawlConfig(config: Partial<FirecrawlConfig>): void {
  if (config.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_FIRECRAWL_KEY, config.apiKey);
  if (config.baseUrl !== undefined) localStorage.setItem(STORAGE_KEY_FIRECRAWL_URL, config.baseUrl);
  if (config.isSearchEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEY_SEARCH_ENABLED, String(config.isSearchEnabled));
  }
}

// ---------------------------------------------------------------------------
// Search API caller
// ---------------------------------------------------------------------------

export async function searchWeb(query: string, config: FirecrawlConfig): Promise<string> {
  let cleanUrl = config.baseUrl.replace(/\/+$/u, '');
  if (cleanUrl === 'https://fc.zaby.io' || cleanUrl === 'http://fc.zaby.io') {
    cleanUrl = '/firecrawl';
  }
  const endpoint = `${cleanUrl}/v1/search`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody?.error?.message ?? `Search failed with status ${response.status}`);
    }

    const result = await response.json();
    const data = result?.data as SearchResultItem[];

    if (!data || data.length === 0) {
      return `[Web Search Context]
No relevant web search results were found for the query "${query}".`;
    }

    // Format results as markdown context block
    const formattedResults = data
      .slice(0, 3)
      .map((item, idx) => {
        const title = (item as any).metadata?.title ?? item.title ?? 'Web Page';
        const url = item.url ?? '#';
        const content = item.markdown ?? (item as any).metadata?.description ?? item.description ?? 'No content preview available.';
        
        // Truncate individual page content if too long
        const truncatedContent = content.length > 500 ? `${content.slice(0, 500)}...` : content;

        return `${idx + 1}. Title: ${title}
   URL: ${url}
   Snippet: ${truncatedContent}`;
      })
      .join('\n\n');

    return `[Web Search Context]
The following real-time web search results are available from Firecrawl. Use this information to answer the user's request:

${formattedResults}

[User Request]
`;
  } catch (err) {
    console.error('Firecrawl search error:', err);
    throw new Error(`Web Search Error: ${(err as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Connection test helper
// ---------------------------------------------------------------------------

export async function testFirecrawlConnection(apiKey: string, baseUrl: string): Promise<{ ok: boolean; error?: string }> {
  let cleanUrl = baseUrl.replace(/\/+$/u, '');
  if (cleanUrl === 'https://fc.zaby.io' || cleanUrl === 'http://fc.zaby.io') {
    cleanUrl = '/firecrawl';
  }
  const endpoint = `${cleanUrl}/v1/search`;

  try {
    // Quick probe query
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        query: 'test probe',
        limit: 1,
      }),
    });

    if (response.ok) return { ok: true };
    const body = await response.json().catch(() => ({}));
    return { ok: false, error: body?.error?.message ?? `HTTP ${response.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
