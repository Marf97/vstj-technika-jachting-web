import { useEffect, useState, useRef, useCallback } from "react";
import {
  fetchImagesFromProxy,
  fetchGalleryYears,
  pickThumbnailUrl,
  getImageContentUrl,
} from "../lib/graph";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

type Photo = {
  id: string;
  name: string;
  src: string;
  item: any;
  year?: string;
};

export default function Gallery() {
  const [photos, setPhotos] = useState<(Photo | string)[]>([]);
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

  // Year-based browsing state
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [yearMenuAnchor, setYearMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [yearsLoading, setYearsLoading] = useState(false);

  const PROXY_URL =
    "https://jachting.technika-praha.cz/php/endpoints/gallery.php";
  const INITIAL_LOAD = 20;
  const LOAD_MORE = 10;

  const loadImages = useCallback(
    async (limit: number, offset: number, year?: string) => {
      const result = await fetchImagesFromProxy(
        PROXY_URL,
        limit,
        offset,
        year || selectedYear || undefined
      );
      return result;
    },
    [PROXY_URL, selectedYear]
  );

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
            item: it,
          };
        });

        setPhotos((prev) => {
          const currentPhotos = [...prev];
          // Handle adding more photos with year grouping in default mode
          if (selectedYear === null) {
            const photosByYear = new Map<string, Photo[]>();

            // Group new photos by year
            photosResolved.forEach((photo) => {
              const year = photo.year || "Neznámý rok";
              if (!photosByYear.has(year)) {
                photosByYear.set(year, []);
              }
              photosByYear.get(year)!.push(photo);
            });

            // Merge with existing photos
            photosByYear.forEach((newPhotos, year) => {
              const existingYearIndex = currentPhotos.findIndex(
                (p) => typeof p === "string" && p === year
              );
              if (existingYearIndex >= 0) {
                // Add to existing year section
                let insertIndex = existingYearIndex + 1;
                while (
                  insertIndex < currentPhotos.length &&
                  typeof currentPhotos[insertIndex] === "object" &&
                  (currentPhotos[insertIndex] as Photo).year === year
                ) {
                  insertIndex++;
                }
                currentPhotos.splice(insertIndex, 0, ...newPhotos);
              } else {
                // Add new year section
                currentPhotos.push(year);
                currentPhotos.push(...newPhotos);
              }
            });

            return currentPhotos;
          } else {
            return [...prev, ...photosResolved];
          }
        });
        offsetRef.current += LOAD_MORE;
        setHasMore(result.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (e: any) {
      console.error("Failed to load more images:", e);
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
      const imageUrl = `${getImageContentUrl(
        PROXY_URL,
        item.id
      )}&t=${Date.now()}`; // Add timestamp to prevent caching
      setFullImageUrl(imageUrl);
    } catch (e) {
      console.error("Failed to load full image:", e);
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

  const handleYearMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setYearMenuAnchor(event.currentTarget);
  };

  const handleYearMenuClose = () => {
    setYearMenuAnchor(null);
  };

  const handleYearSelect = (year: string | null) => {
    setYearMenuAnchor(null);

    // Only reset and reload if the year selection actually changed
    if (selectedYear !== year) {
      setSelectedYear(year);
      // Reset gallery state when switching years
      setPhotos([]);
      setLoading(true);
      setHasMore(true);
      setTotalImages(0);
      offsetRef.current = 0;
      setError(null);
    }
    // If same year is selected, do nothing - just close the menu
  };

  const loadAvailableYears = useCallback(async () => {
    if (availableYears.length > 0) return; // Already loaded

    try {
      setYearsLoading(true);
      const years = await fetchGalleryYears(PROXY_URL);
      setAvailableYears(years);
    } catch (e: any) {
      console.error("Failed to load available years:", e);
      // Continue without years - gallery will work in default mode
    } finally {
      setYearsLoading(false);
    }
  }, [PROXY_URL, availableYears.length]);

  useEffect(() => {
    loadAvailableYears();
  }, [loadAvailableYears]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Fetch initial images from PHP proxy
        const result = await loadImages(INITIAL_LOAD, 0);

        // Process images - pick thumbnails and extract year info
        const photosResolved: Photo[] = result.images.map((it: any) => {
          const thumb = pickThumbnailUrl(it);
          return {
            id: it.id,
            name: it.name,
            src: thumb || getImageContentUrl(PROXY_URL, it.id), // fallback to full image if no thumbnail
            item: it,
            year: it._year || undefined, // Extract year from backend metadata
          };
        });

        // Group photos by year for display (only in default mode)
        if (selectedYear === null && photosResolved.length > 0) {
          const photosByYear = new Map<string, Photo[]>();
          photosResolved.forEach((photo) => {
            const year = photo.year || "Neznámý rok";
            if (!photosByYear.has(year)) {
              photosByYear.set(year, []);
            }
            photosByYear.get(year)!.push(photo);
          });

          // Convert to grouped structure for rendering
          const groupedPhotos: (string | Photo)[] = [];
          photosByYear.forEach((photos, year) => {
            groupedPhotos.push(year); // Year header
            groupedPhotos.push(...photos); // Photos for this year
          });

          setPhotos(groupedPhotos);
        } else {
          setPhotos(photosResolved);
        }
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
  }, [loadImages, PROXY_URL, selectedYear]);

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

  return (
    <div>
      {/* Static header - always visible */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h2" color="primary.main">
          Galerie
        </Typography>

        {/* Year selector button */}
        <Button
          variant="outlined"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={handleYearMenuOpen}
          disabled={yearsLoading}
          sx={{
            minWidth: 120,
            "&:hover": { bgcolor: "primary.main", color: "white" },
          }}
        >
          {selectedYear ? `${selectedYear}` : "Nejnovější fotky"}
        </Button>

        {/* Loading indicator for years */}
        {yearsLoading && (
          <Typography sx={{ ml: 1, color: "text.secondary" }}>
            Načítám roky...
          </Typography>
        )}

        {/* Year selection menu */}
        <Menu
          anchorEl={yearMenuAnchor}
          open={Boolean(yearMenuAnchor)}
          onClose={handleYearMenuClose}
        >
          <MenuItem onClick={() => handleYearSelect(null)}>
            <Typography fontWeight={selectedYear === null ? "bold" : "normal"}>
              Nejnovější fotky
            </Typography>
          </MenuItem>
          {availableYears.map((year) => (
            <MenuItem key={year} onClick={() => handleYearSelect(year)}>
              <Typography
                fontWeight={selectedYear === year ? "bold" : "normal"}
              >
                {year}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Gallery content - shows loading/error states */}
      {loading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 6,
            border: "2px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            minHeight: "120px",
            bgcolor: "background.paper",
          }}
        >
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography
            variant="h6"
            color="primary.main"
            sx={{ textAlign: "center" }}
          >
            Načítám fotky…
          </Typography>
        </Box>
      )}
      {error && (
        <Typography sx={{ p: 4, color: "error.main" }}>
          Chyba: {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
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
                    xs: "repeat(2, 1fr) !important",
                    sm: "repeat(3, 1fr) !important",
                    md: "repeat(4, 1fr) !important",
                    lg: "repeat(4, 1fr) !important",
                    xl: "repeat(4, 1fr) !important",
                  },
                }}
              >
                {photos.map((p, index) => {
                  if (typeof p === "string") {
                    // Year header
                    return (
                      <Box
                        key={`year-${p}-${index}`}
                        sx={{ gridColumn: "1 / -1", mt: 2, mb: 1 }}
                      >
                        <Typography
                          variant="h4"
                          color="primary.main"
                          sx={{
                            fontWeight: "bold",
                            borderBottom: 2,
                            borderColor: "primary.main",
                            pb: 1,
                          }}
                        >
                          {p}
                        </Typography>
                      </Box>
                    );
                  } else {
                    // Photo item
                    return (
                      <ImageListItem key={p.id} sx={{ aspectRatio: "4/3" }}>
                        <img
                          src={p.src}
                          alt={p.name}
                          loading="lazy"
                          style={{
                            cursor: "pointer",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onClick={() => handlePhotoClick(p, p.item)}
                        />
                      </ImageListItem>
                    );
                  }
                })}
              </ImageList>

              {/* Loading indicator for infinite scroll */}
              {loadingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={40} />
                </Box>
              )}

              {/* Observer target for triggering load more */}
              <div ref={observerRef} style={{ height: "20px" }} />

              {/* No more images message */}
              {!hasMore && photos.length > 0 && (
                <Typography
                  sx={{ textAlign: "center", p: 2, color: "text.secondary" }}
                >
                  Žádné další obrázky k načtení.
                </Typography>
              )}

              <Dialog
                open={!!selectedPhoto}
                onClose={handleCloseDialog}
                fullScreen
                sx={{
                  "& .MuiDialog-paper": {
                    backgroundColor: "black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                }}
              >
                <IconButton
                  onClick={handleCloseDialog}
                  sx={{
                    position: "absolute",
                    right: 16,
                    top: 16,
                    bgcolor: "#1F2646",
                    color: "white",
                    "&:hover": { bgcolor: "#6396C1" },
                    zIndex: 1,
                  }}
                >
                  <CloseIcon />
                </IconButton>
                {selectedPhoto && (
                  <>
                    {fullImageLoading && (
                      <Typography sx={{ color: "white" }}>
                        Načítám obrázek…
                      </Typography>
                    )}
                    {(fullImageUrl || selectedPhoto.src) &&
                      !fullImageLoading && (
                        <img
                          src={fullImageUrl || selectedPhoto.src}
                          alt={selectedPhoto.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      )}
                  </>
                )}
              </Dialog>
            </>
          )}
        </>
      )}
    </div>
  );
}
