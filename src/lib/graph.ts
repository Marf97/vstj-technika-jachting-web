// Graph API utilities - now using PHP proxy instead of direct calls

// Fetch images from PHP proxy
export async function fetchImagesFromProxy(proxyUrl: string, limit?: number, offset?: number, year?: string) {
  let url = proxyUrl;
  const params = new URLSearchParams();

  if (limit !== undefined) {
    params.set('top', limit.toString());
  }
  if (offset !== undefined) {
    params.set('skip', offset.toString());
  }
  if (year !== undefined) {
    params.set('year', year);
  }

  const paramString = params.toString();
  if (paramString) {
    url += (url.includes('?') ? '&' : '?') + paramString;
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
    year: data.year as string | null
  };
}

// Fetch available years from PHP proxy
export async function fetchAvailableYears(proxyUrl: string) {
  const url = proxyUrl + (proxyUrl.includes('?') ? '&' : '?') + 'list_years=1';

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

// URL pro náhled (thumbnail) – pokud není, fallback na content URL
export function pickThumbnailUrl(item: any): string | undefined {
  const ts = item.thumbnails;
  if (Array.isArray(ts) && ts[0]?.large?.url) return ts[0].large.url;
  if (Array.isArray(ts) && ts[0]?.medium?.url) return ts[0].medium.url;
  if (Array.isArray(ts) && ts[0]?.small?.url) return ts[0].small.url;
  return undefined;
}

// Content URL pro full-size image (pro proxy nebo direct access)
export function getImageContentUrl(proxyUrl: string, itemId: string) {
  // Use the dedicated php_get_image.php endpoint instead of action parameter
  const baseUrl = proxyUrl.replace('/php_proxy.php', '');
  return `${baseUrl}/php_get_image.php?id=${encodeURIComponent(itemId)}`;
}
