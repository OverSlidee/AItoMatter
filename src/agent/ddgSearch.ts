/**
 * A zero-dependency DuckDuckGo HTML scraping search tool.
 * Bypasses API fees and keys by reading the free public search snippets.
 */
export async function searchDuckDuckGo(query: string): Promise<string> {
  console.log(`[WEB SEARCH] Querying DuckDuckGo: "${query}"`);
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const html = await response.text();
    
    // DuckDuckGo HTML formats snippets inside: <a class="result__snippet" ...>Snippet content</a>
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const snippets: string[] = [];
    let match;

    while ((match = snippetRegex.exec(html)) !== null) {
      let text = match[1]
        .replace(/<[^>]+>/g, "") // strip any inner HTML tags
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (text) {
        snippets.push(text);
      }
      if (snippets.length >= 5) {
        break;
      }
    }

    if (snippets.length === 0) {
      console.log("[WEB SEARCH] No snippets found. Web search page format might have changed or query blocked.");
      return "No results found. (Could not parse search engine HTML)";
    }

    console.log(`[WEB SEARCH] Found ${snippets.length} relevant context snippets.`);
    return snippets.join("\n\n---\n\n");
  } catch (error: any) {
    console.error(`[WEB SEARCH] Failed to search for "${query}":`, error);
    return `Failed to fetch web search results for "${query}": ${error.message}`;
  }
}
