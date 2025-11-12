import { useEffect, useState } from "react";
import { msalInstance, GRAPH_SCOPES } from "../lib/auth";
import { getSiteId, listFolderItems, pickThumbnailUrl, contentUrlForItem, fetchBlob } from "../lib/graph";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

type Photo = { id: string; name: string; src: string };

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const SITE_HOST = import.meta.env.VITE_SITE_HOST as string;
  const SITE_PATH = import.meta.env.VITE_SITE_PATH as string;
  const FOLDER_PATH = import.meta.env.VITE_FOLDER_PATH as string;

  async function ensureLogin() {
    if (!msalInstance.getAllAccounts().length) {
      await msalInstance.loginPopup({ scopes: GRAPH_SCOPES });
    }
  }

  async function getToken() {
    const acc = msalInstance.getAllAccounts()[0];
    if (!acc) {
      throw new Error('No account found');
    }
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

  if (loading) return <Typography sx={{ p: 4 }}>Načítám fotky…</Typography>;
  if (error) return <Typography sx={{ p: 4, color: 'error.main' }}>Chyba: {error}</Typography>;

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="h4" gutterBottom>
        Galerie
      </Typography>
      {!photos.length ? (
        <Typography>Ve složce zatím nejsou žádné obrázky.</Typography>
      ) : (
        <>
          <ImageList variant="masonry" cols={4} gap={8}>
            {photos.map((p) => (
              <ImageListItem key={p.id}>
                <img
                  src={p.src}
                  alt={p.name}
                  loading="lazy"
                  style={{ cursor: 'pointer', maxHeight: '200px', objectFit: 'cover' }}
                  onClick={() => setSelectedPhoto(p)}
                />
              </ImageListItem>
            ))}
          </ImageList>

          <Dialog
            open={!!selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            maxWidth="lg"
            fullWidth
          >
            <DialogContent sx={{ position: 'relative', p: 0 }}>
              <IconButton
                onClick={() => setSelectedPhoto(null)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                }}
              >
                <CloseIcon />
              </IconButton>
              {selectedPhoto && (
                <img
                  src={selectedPhoto.src}
                  alt={selectedPhoto.name}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
