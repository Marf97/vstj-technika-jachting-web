// Graph API utilities - now using PHP proxy instead of direct calls

// Gallery functions
export async function fetchImagesFromProxy(
  proxyUrl: string,
  limit?: number,
  offset?: number,
  year?: string
) {
  let url = proxyUrl.replace("/php_proxy.php", "/php/endpoints/gallery.php");
  const params = new URLSearchParams();
  params.set("action", "gallery");

  if (limit !== undefined) {
    params.set("top", limit.toString());
  }
  if (offset !== undefined) {
    params.set("skip", offset.toString());
  }
  if (year !== undefined) {
    params.set("year", year);
  }

  const paramString = params.toString();
  if (paramString) {
    url += (url.includes("?") ? "&" : "?") + paramString;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxy error ${response.status}: ${error}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Proxy returned error: ${data.error}`);
  }
  return {
    images: data.images as any[],
    total: data.total as number,
    hasMore: data.hasMore as boolean,
    year: data.year as string | null,
  };
}

export async function fetchGalleryYears(proxyUrl: string): Promise<string[]> {
  const url =
    proxyUrl.replace("/php_proxy.php", "/php/endpoints/gallery.php") +
    (proxyUrl.includes("?") ? "&" : "?") +
    "action=list_gallery_years";

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxy error ${response.status}: ${error}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Proxy returned error: ${data.error}`);
  }
  return data.years as string[];
}

// News functions
export async function fetchArticlesFromProxy(
  proxyUrl: string,
  year?: string | null
): Promise<any[]> {
  let url = proxyUrl.replace("/php_proxy.php", "/php/endpoints/news.php");
  const params = new URLSearchParams();
  params.set("action", "list_articles");

  if (year) {
    params.set("year", year);
  }

  const paramString = params.toString();
  if (paramString) {
    url += (url.includes("?") ? "&" : "?") + paramString;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxy error ${response.status}: ${error}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Proxy returned error: ${data.error}`);
  }
  return data.articles as Array<{
    id: string;
    title: string;
    year: string;
    createdDateTime: string;
    lastModifiedDateTime: string;
    thumbnail?: string;
    excerpt?: string;
  }>;
}

export async function fetchArticleFromProxy(
  proxyUrl: string,
  title: string,
  year: string
): Promise<any> {
  let url = proxyUrl.replace("/php_proxy.php", "/php/endpoints/news.php");
  const params = new URLSearchParams();
  params.set("action", "article");
  params.set("title", title);
  params.set("year", year);

  const paramString = params.toString();
  if (paramString) {
    url += (url.includes("?") ? "&" : "?") + paramString;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxy error ${response.status}: ${error}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Proxy returned error: ${data.error}`);
  }
  return data as any;
}

export async function fetchNewsYears(proxyUrl: string): Promise<string[]> {
  const url =
    proxyUrl.replace("/php_proxy.php", "/php/endpoints/news.php") +
    (proxyUrl.includes("?") ? "&" : "?") +
    "action=list_news_years";

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxy error ${response.status}: ${error}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Proxy returned error: ${data.error}`);
  }
  return data.years as string[];
}

// Legacy alias for backward compatibility
export async function fetchAvailableYears(proxyUrl: string) {
  return fetchGalleryYears(proxyUrl);
}

export async function fetchArticleExcerptFromProxy(
  proxyUrl: string,
  articleTitle: string,
  year: string
): Promise<string | null> {
  const url = new URL(proxyUrl);
  url.searchParams.set("action", "get_article_excerpt");
  url.searchParams.set("title", articleTitle);
  url.searchParams.set("year", year);

  const response = await fetch(url.toString());

  if (!response.ok) {
    console.error(
      "Failed to fetch excerpt",
      response.status,
      response.statusText
    );
    return null;
  }

  const data = await response.json();
  return data.excerpt ?? null;
}

// URL pro náhled (thumbnail) – pokud není, fallback na content URL
export function pickThumbnailUrl(item: any): string | undefined {
  const ts = item.thumbnails;
  if (Array.isArray(ts) && ts[0]?.large?.url) return ts[0].large.url;
  if (Array.isArray(ts) && ts[0]?.medium?.url) return ts[0].medium.url;
  if (Array.isArray(ts) && ts[0]?.small?.url) return ts[0].small.url;
  return undefined;
}

// Content URL pro full-size image (pro proxy nebo direct access)
export function getImageContentUrl(
  proxyUrl: string,
  itemId: string,
  size: "large" | "fullhd" = "fullhd"
) {
  // The proxyUrl is already the full endpoint URL (/api/php/endpoints/gallery.php)
  // We just need to add the id and size parameters for individual image fetching
  return `${proxyUrl}?id=${encodeURIComponent(itemId)}&size=${size}`;
}

// Get article image URL
export function getArticleImageUrl(proxyUrl: string, itemId: string) {
  // Use gallery endpoint for image fetching, not news endpoint
  const galleryUrl = proxyUrl.replace("/news.php", "/gallery.php");
  return `${galleryUrl}?id=${encodeURIComponent(itemId)}`;
}
