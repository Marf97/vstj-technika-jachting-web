// Graph API utilities - now using PHP proxy instead of direct calls

// Fetch images from PHP proxy
export async function fetchImagesFromProxy(proxyUrl: string) {
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxy error ${response.status}: ${error}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Proxy returned error: ${data.error}`);
  }
  return data.images as any[];
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
