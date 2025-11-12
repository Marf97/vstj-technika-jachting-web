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
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

type Photo = { id: string; name: string; src: string; item: any };

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [fullImageLoading, setFullImageLoading] = useState(false);

  const SITE_HOST = import.meta.env.VITE_SITE_HOST as string;
  const SITE_PATH = import.meta.env.VITE_SITE_PATH as string;
  const FOLDER_PATH = import.meta.env.VITE_FOLDER_PATH as string;

  const handlePhotoClick = async (photo: Photo, item: any) => {
    setSelectedPhoto(photo);
    setFullImageLoading(true);
    setFullImageUrl(null); // clear previous image
    try {
      const siteId = await getSiteId(SITE_HOST, SITE_PATH, getToken);
      const blob = await fetchBlob(contentUrlForItem(siteId, item.id), getToken);
      const objectUrl = URL.createObjectURL(blob);
      setFullImageUrl(objectUrl);
    } catch (e) {
      console.error('Failed to load full image:', e);
      setFullImageUrl(photo.src); // fallback to thumbnail
    } finally {
      setFullImageLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedPhoto(null);
    setFullImageUrl(null);
    setFullImageLoading(false);
  };

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
              return { id: it.id, name: it.name, src: thumb, item: it };
            } else {
              // Fallback: stáhnout celý obrázek
              const blob = await fetchBlob(contentUrlForItem(siteId, it.id), getToken);
              const objectUrl = URL.createObjectURL(blob);
              return { id: it.id, name: it.name, src: objectUrl, item: it };
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
    <div>
      <Typography variant="h2" color="primary.main" gutterBottom>
        Galerie
      </Typography>
      {!photos.length ? (
        <Typography>Ve složce zatím nejsou žádné obrázky.</Typography>
      ) : (
        <>
          <ImageList variant="standard" cols={4} gap={8} sx={{
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            }
          }}>
            {photos.map((p) => (
              <ImageListItem key={p.id} sx={{ aspectRatio: '4/3' }}>
                <img
                  src={p.src}
                  alt={p.name}
                  loading="lazy"
                  style={{
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onClick={() => handlePhotoClick(p, p.item)}
                />
              </ImageListItem>
            ))}
          </ImageList>

          <Dialog
            open={!!selectedPhoto}
            onClose={handleCloseDialog}
            fullScreen
            sx={{
              '& .MuiDialog-paper': {
                backgroundColor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
            }}
          >
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                position: 'absolute',
                right: 16,
                top: 16,
                bgcolor: '#1F2646',
                color: 'white',
                '&:hover': { bgcolor: '#6396C1' },
                zIndex: 1
              }}
            >
              <CloseIcon />
            </IconButton>
            {selectedPhoto && (
              <>
                {fullImageLoading && (
                  <Typography sx={{ color: 'white' }}>Načítám obrázek…</Typography>
                )}
                {(fullImageUrl || selectedPhoto.src) && !fullImageLoading && (
                  <img
                    src={fullImageUrl || selectedPhoto.src}
                    alt={selectedPhoto.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                )}
              </>
            )}
          </Dialog>
        </>
      )}
    </div>
  );
}
