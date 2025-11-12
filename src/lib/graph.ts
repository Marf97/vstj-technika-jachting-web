// Pár utilit pro Graph volání
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

type TokenProvider = () => Promise<string>;

export async function fetchJson(url: string, getToken: TokenProvider) {
  const token = await getToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Graph ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function fetchBlob(url: string, getToken: TokenProvider) {
  const token = await getToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph ${res.status}`);
  return res.blob();
}

// Získá siteId z hostname + site path
export async function getSiteId(hostname: string, sitePath: string, getToken: TokenProvider) {
  const url = `${GRAPH_BASE}/sites/${hostname}:/${sitePath}`;
  const json = await fetchJson(url, getToken);
  return json.id as string;
}

// Vrátí seznam položek (souborů) ve složce
export async function listFolderItems(siteId: string, folderPath: string, getToken: TokenProvider) {
  // drive/root:/<folderPath>:/children
  const encPath = encodeURIComponent(folderPath);
  const url = `${GRAPH_BASE}/sites/${siteId}/drive/root:/${encPath}:/children?$select=id,name,webUrl,file,folder&$expand=thumbnails`;
  const json = await fetchJson(url, getToken);
  return json.value as any[];
}

// URL pro náhled (thumbnail) – pokud není, umíme stáhnout content
export function pickThumbnailUrl(item: any): string | undefined {
  const ts = item.thumbnails;
  if (Array.isArray(ts) && ts[0]?.large?.url) return ts[0].large.url;
  if (Array.isArray(ts) && ts[0]?.medium?.url) return ts[0].medium.url;
  if (Array.isArray(ts) && ts[0]?.small?.url) return ts[0].small.url;
  return undefined;
}

// Přímý obsah obrázku
export function contentUrlForItem(siteId: string, itemId: string) {
  return `${GRAPH_BASE}/sites/${siteId}/drive/items/${itemId}/content`;
}
