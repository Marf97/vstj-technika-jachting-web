import { useEffect, useMemo, useState } from "react";
import { msalInstance, GRAPH_SCOPES } from "../lib/auth";
import { getSiteId, listFolderItems, pickThumbnailUrl, contentUrlForItem, fetchBlob } from "../lib/graph";

type Photo = { id: string; name: string; src: string };

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const SITE_HOST = import.meta.env.VITE_SITE_HOST as string;
  const SITE_PATH = import.meta.env.VITE_SITE_PATH as string;
  const FOLDER_PATH = import.meta.env.VITE_FOLDER_PATH as string;

  const account = useMemo(() => {
    const a = msalInstance.getAllAccounts();
    return a[0];
  }, []);

  async function ensureLogin() {
    if (!msalInstance.getAllAccounts().length) {
      await msalInstance.loginPopup({ scopes: GRAPH_SCOPES });
    }
  }

  async function getToken() {
    const acc = msalInstance.getAllAccounts()[0];
    const res = await msalInstance.acquireTokenSilent({
      scopes: GRAPH_SCOPES,
      account: acc,
    }).catch(async () => {
      return msalInstance.acquireTokenPopup({ scopes: GRAPH_SCOPES });
    });
    return res.accessToken;
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await msalInstance.initialize();
        await ensureLogin();

        const siteId = await getSiteId(SITE_HOST, SITE_PATH, getToken);
        const items = await listFolderItems(siteId, FOLDER_PATH, getToken);

        // Necháme jen soubory (ne složky) a ideálně obrázky
        const imageItems = items.filter((i: any) => i.file && /^image\//.test(i.file.mimeType || ""));

        // Najdi thumbnail, případně stáhni obsah a vytvoř blob URL
        const photosResolved: Photo[] = await Promise.all(
          imageItems.map(async (it: any) => {
            const thumb = pickThumbnailUrl(it);
            if (thumb) {
              // Graph thumbnail URL už obsahuje SAS-like token, stačí přímo použít
              return { id: it.id, name: it.name, src: thumb };
            } else {
              // Fallback: stáhnout celý obrázek
              const blob = await fetchBlob(contentUrlForItem(siteId, it.id), getToken);
              const objectUrl = URL.createObjectURL(blob);
              return { id: it.id, name: it.name, src: objectUrl };
            }
          })
        );

        setPhotos(photosResolved);
        setError(null);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="p-4">Načítám fotky…</p>;
  if (error) return <p className="p-4 text-red-600">Chyba: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Galerie</h1>
      {!photos.length ? (
        <p>Ve složce zatím nejsou žádné obrázky.</p>
      ) : (
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {photos.map(p => (
            <figure key={p.id} className="rounded-lg overflow-hidden shadow-sm border">
              <img src={p.src} alt={p.name} className="w-full h-40 object-cover" />
              <figcaption className="text-sm p-2 truncate">{p.name}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
