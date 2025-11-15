import { useEffect, useState, useRef, useCallback } from "react";
import { fetchImagesFromProxy, pickThumbnailUrl, getImageContentUrl } from "../lib/graph";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

type Photo = { id: string; name: string; src: string; item: any };

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [fullImageLoading, setFullImageLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalImages, setTotalImages] = useState(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  const PROXY_URL = '/api/php_proxy.php'; // Vite proxy will handle this
  const INITIAL_LOAD = 20;
  const LOAD_MORE = 10;

  const loadImages = useCallback(async (limit: number, offset: number) => {
    const result = await fetchImagesFromProxy(PROXY_URL, limit, offset);
    return result;
  }, [PROXY_URL]);

  const loadMoreImages = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const result = await loadImages(LOAD_MORE, offsetRef.current);

      if (result.images.length > 0) {
        const photosResolved: Photo[] = result.images.map((it: any) => {
          const thumb = pickThumbnailUrl(it);
          return {
            id: it.id,
            name: it.name,
            src: thumb || getImageContentUrl(PROXY_URL, it.id), // fallback to full image if no thumbnail
            item: it
          };
        });

        setPhotos(prev => [...prev, ...photosResolved]);
        offsetRef.current += LOAD_MORE;
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (e: any) {
      console.error('Failed to load more images:', e);
      setError(e.message ?? String(e));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loadImages, PROXY_URL]);

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

        // Fetch initial images from PHP proxy
        const result = await loadImages(INITIAL_LOAD, 0);

        // Process images - pick thumbnails
        const photosResolved: Photo[] = result.images.map((it: any) => {
          const thumb = pickThumbnailUrl(it);
          return {
            id: it.id,
            name: it.name,
            src: thumb || getImageContentUrl(PROXY_URL, it.id), // fallback to full image if no thumbnail
            item: it
          };
        });

        setPhotos(photosResolved);
        setTotalImages(result.total);
        setHasMore(result.hasMore);
        offsetRef.current = INITIAL_LOAD;
        setError(null);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadImages, PROXY_URL]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreImages();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading, loadingMore, loadMoreImages]);

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

          {/* Loading indicator for infinite scroll */}
          {loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={40} />
            </Box>
          )}

          {/* Observer target for triggering load more */}
          <div ref={observerRef} style={{ height: '20px' }} />

          {/* No more images message */}
          {!hasMore && photos.length > 0 && (
            <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              Žádné další obrázky k načtení.
            </Typography>
          )}

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
