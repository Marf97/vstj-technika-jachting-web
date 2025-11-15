import { useEffect, useState } from "react";
import { fetchImagesFromProxy, pickThumbnailUrl, getImageContentUrl } from "../lib/graph";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

type Photo = { id: string; name: string; src: string; item: any };

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [fullImageLoading, setFullImageLoading] = useState(false);

  const PROXY_URL = '/api/php_proxy.php'; // Vite proxy will handle this

  const handlePhotoClick = async (photo: Photo, item: any) => {
    setSelectedPhoto(photo);
    setFullImageLoading(true);
    setFullImageUrl(null); // clear previous image
    try {
      // For full images, fetch directly from proxy (extend PHP proxy to handle individual image requests)
      const imageUrl = getImageContentUrl(PROXY_URL, item.id);
      setFullImageUrl(imageUrl);
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Fetch images from PHP proxy
        const imageItems = await fetchImagesFromProxy(PROXY_URL);

        // Process images - pick thumbnails
        const photosResolved: Photo[] = imageItems.map((it: any) => {
          const thumb = pickThumbnailUrl(it);
          return {
            id: it.id,
            name: it.name,
            src: thumb || getImageContentUrl(PROXY_URL, it.id), // fallback to full image if no thumbnail
            item: it
          };
        });

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
          <ImageList
            variant="standard"
            cols={4}
            gap={8}
            sx={{
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr) !important',
                sm: 'repeat(3, 1fr) !important',
                md: 'repeat(4, 1fr) !important',
                lg: 'repeat(4, 1fr) !important',
                xl: 'repeat(4, 1fr) !important'
              }
            }}
          >
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
