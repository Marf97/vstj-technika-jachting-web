import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Breadcrumbs,
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { DateRange as DateRangeIcon } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  fetchArticlesFromProxy,
  fetchArticleFromProxy,
  fetchNewsYears,
  getArticleImageUrl,
} from "../lib/graph";

// Custom image component for ReactMarkdown
const MarkdownImage = ({
  src,
  alt,
  selectedArticle,
  PROXY_URL,
}: {
  src?: string;
  alt?: string;
  selectedArticle: ArticleDetail;
  PROXY_URL: string;
}) => {
  // Find the image by filename in the article's images array
  const findImageByFilename = (filename: string) => {
    const justName = filename.split("/").pop()?.toLowerCase();
    return selectedArticle.images?.find(
      (img) => img.name.toLowerCase() === justName
    );
  };

  // If src is a filename (not a URL), try to resolve it to a proxy URL
  let imageUrl = src;
  if (src && !src.startsWith("http") && !src.startsWith("/")) {
    const image = findImageByFilename(src);
    if (image) {
      imageUrl = getArticleImageUrl(PROXY_URL, image.id);
    }
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      style={{
        maxWidth: "100%",
        height: "auto",
        borderRadius: 1,
        margin: "8px 0",
      }}
    />
  );
};

type Article = {
  id: string;
  title: string;
  year: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  thumbnail?: string;
  excerpt?: string;
};

type ArticleDetail = {
  id: string;
  title: string;
  year: string;
  content: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  images: any[];
};

// Cache structure for storing articles by year
interface ArticleCache {
  [key: string]: {
    articles: Article[];
    timestamp: number;
  };
}

// Cache structure for article details
interface ArticleDetailCache {
  [key: string]: {
    article: ArticleDetail;
    timestamp: number;
  };
}

// Cache expiration duration: 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

// Helper function to check if cache is expired
const isCacheExpired = (timestamp: number): boolean => {
  return Date.now() - timestamp > CACHE_DURATION;
};

// Helper function to check if cache is near expiration (80% of lifetime)
const isNearExpiration = (timestamp: number): boolean => {
  const age = Date.now() - timestamp;
  return age > CACHE_DURATION * 0.8;
};

// Memoized Article Card component to prevent unnecessary re-renders
const ArticleCard = React.memo(
  ({
    article,
    onClick,
    formatDate,
  }: {
    article: Article;
    onClick: (article: Article) => void;
    formatDate: (dateString: string) => string;
  }) => {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
        }}
        onClick={() => onClick(article)}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {/* Horní řada: IMG + [TITLE / DATE] */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
              alignItems: "flex-start",
            }}
          >
            {article.thumbnail && (
              <Box
                component="img"
                src={article.thumbnail}
                alt={`${article.title} thumbnail`}
                sx={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
            )}

            {/* Sloupec s title + date */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
                flexGrow: 1,
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{ color: "primary.main", fontWeight: 500 }}
              >
                {article.title}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <DateRangeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(article.createdDateTime)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Spodní řada: EXCERPT přes celou šířku */}
          {article.excerpt && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 300,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {article.excerpt}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }
);

ArticleCard.displayName = "ArticleCard";

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Article list cache - stores articles for each year
  const [articleCache, setArticleCache] = useState<ArticleCache>({});

  // Article detail cache - stores full article details
  const [articleDetailCache, setArticleDetailCache] =
    useState<ArticleDetailCache>({});

  const [articles, setArticles] = useState<Article[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PROXY_URL = import.meta.env.VITE_NEWS_PROXY_URL;

  // Get URL parameters
  const urlYear = searchParams.get("year");
  const urlArticle = searchParams.get("article");

  // Memoized date formatter to avoid recreating on every render
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("cs-CZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Memoized article click handler
  const handleArticleClick = useCallback(
    (article: Article) => {
      setSearchParams((prev: URLSearchParams) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("article", article.title);
        newParams.set("year", article.year);
        return newParams;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (urlYear !== selectedYear) {
      setSelectedYear(urlYear);
    }
    loadArticles(urlYear);
  }, [urlYear]);

  useEffect(() => {
    if (urlArticle) {
      loadArticleDetail(urlArticle, urlYear || "");
    } else {
      setSelectedArticle(null);
    }
  }, [urlArticle, urlYear]);

  // Background refresh effect - refreshes cache when near expiration
  useEffect(() => {
    const cacheKey = selectedYear || "all";
    const cached = articleCache[cacheKey];

    if (cached && isNearExpiration(cached.timestamp)) {
      // Refresh in background without UI indication
      fetchArticlesFromProxy(PROXY_URL, selectedYear || undefined)
        .then((fetchedArticles) => {
          setArticleCache((prev) => ({
            ...prev,
            [cacheKey]: {
              articles: fetchedArticles,
              timestamp: Date.now(),
            },
          }));
        })
        .catch((err) => {
          console.error("Background refresh failed:", err);
        });
    }
  }, [selectedYear, articleCache]);

  // Prefetch adjacent years when viewing a specific year
  useEffect(() => {
    if (selectedYear && availableYears.length > 0) {
      const currentIndex = availableYears.indexOf(selectedYear);
      const nextYear = availableYears[currentIndex - 1];
      const prevYear = availableYears[currentIndex + 1];

      // Prefetch in background after a short delay
      [nextYear, prevYear].forEach((year) => {
        if (year && !articleCache[year]) {
          setTimeout(() => {
            fetchArticlesFromProxy(PROXY_URL, year)
              .then((fetchedArticles) => {
                setArticleCache((prev) => ({
                  ...prev,
                  [year]: {
                    articles: fetchedArticles,
                    timestamp: Date.now(),
                  },
                }));
              })
              .catch((err) => {
                console.error(`Prefetch failed for year ${year}:`, err);
              });
          }, 1000);
        }
      });
    }
  }, [selectedYear, availableYears, articleCache]);

  const loadAvailableYears = async () => {
    try {
      setYearsLoading(true);
      const years = await fetchNewsYears(PROXY_URL);
      setAvailableYears(years);
    } catch (e: any) {
      console.error("Failed to load available years:", e);
    } finally {
      setYearsLoading(false);
    }
  };

  const loadArticles = async (year?: string | null) => {
    const cacheKey = year || "all";

    // Check cache first
    const cached = articleCache[cacheKey];
    if (cached && !isCacheExpired(cached.timestamp)) {
      // Use cached data instantly
      setArticles(cached.articles);
      setLoading(false);
      setError(null);
      return;
    }

    // Fetch from server if not cached or expired
    setLoading(true);
    try {
      const fetchedArticles = await fetchArticlesFromProxy(
        PROXY_URL,
        year || undefined
      );

      // Update cache
      setArticleCache((prev) => ({
        ...prev,
        [cacheKey]: {
          articles: fetchedArticles,
          timestamp: Date.now(),
        },
      }));

      setArticles(fetchedArticles);
      setError(null);
    } catch (e: any) {
      console.error("Failed to load articles:", e);
      setError(e.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const loadArticleDetail = async (articleTitle: string, year: string) => {
    const cacheKey = `${year}-${articleTitle}`;

    // Check cache first
    const cached = articleDetailCache[cacheKey];
    if (cached && !isCacheExpired(cached.timestamp)) {
      // Use cached article detail instantly
      setSelectedArticle(cached.article);
      setArticleLoading(false);
      return;
    }

    // Fetch from server if not cached or expired
    try {
      setArticleLoading(true);
      const article = await fetchArticleFromProxy(
        PROXY_URL,
        articleTitle,
        year
      );

      // Update cache
      setArticleDetailCache((prev) => ({
        ...prev,
        [cacheKey]: {
          article,
          timestamp: Date.now(),
        },
      }));

      setSelectedArticle(article);
    } catch (e: any) {
      console.error("Failed to load article:", e);
      setError("Article not found");
    } finally {
      setArticleLoading(false);
    }
  };

  const handleYearSelect = (year: string | null) => {
    const cacheKey = year || "all";
    const cached = articleCache[cacheKey];

    // Show cached data immediately if available
    if (cached && !isCacheExpired(cached.timestamp)) {
      setArticles(cached.articles);
      setError(null);
    }

    // Update URL parameters
    setSearchParams((prev: URLSearchParams) => {
      const newParams = new URLSearchParams(prev);
      if (year) {
        newParams.set("year", year);
      } else {
        newParams.delete("year");
      }
      newParams.delete("article");
      return newParams;
    });
  };

  const handleBackToList = () => {
    setSearchParams((prev: URLSearchParams) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("article");
      return newParams;
    });
  };

  // Memoized sorted articles to avoid re-sorting on every render
  const sortedArticles = useMemo(() => {
    return [...articles].sort(
      (a, b) =>
        new Date(b.createdDateTime).getTime() -
        new Date(a.createdDateTime).getTime()
    );
  }, [articles]);

  // Memoized article list rendering
  const articleList = useMemo(() => {
    return sortedArticles.map((article) => (
      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
        <ArticleCard
          article={article}
          onClick={handleArticleClick}
          formatDate={formatDate}
        />
      </Grid>
    ));
  }, [sortedArticles, handleArticleClick, formatDate]);

  if (selectedArticle && !articleLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink
            component="button"
            variant="body1"
            onClick={() => handleYearSelect(null)}
            sx={{
              color: "primary.main",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Novinky
          </MuiLink>
          {selectedYear && (
            <MuiLink
              component="button"
              variant="body1"
              onClick={() => handleYearSelect(selectedYear)}
              sx={{
                color: "primary.main",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {selectedYear}
            </MuiLink>
          )}
          <Typography color="text.primary">{selectedArticle.title}</Typography>
        </Breadcrumbs>

        {/* Article Detail */}
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: 500 }}
          >
            {selectedArticle.title}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
            <DateRangeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(selectedArticle.createdDateTime)}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Article Content */}
          <Box
            sx={{
              "& h1, & h2, & h3, & h4, & h5, & h6": {
                color: "primary.main",
                fontWeight: 500,
                mt: 3,
                mb: 2,
              },
              "& p": {
                color: "text.primary",
                fontWeight: 300,
                mb: 2,
                lineHeight: 1.6,
              },
              "& img": {
                maxWidth: "100%",
                height: "auto",
                borderRadius: 1,
                my: 2,
              },
              "& blockquote": {
                borderLeft: 4,
                borderColor: "primary.main",
                pl: 2,
                py: 1,
                my: 2,
                bgcolor: "grey.50",
              },
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => (
                  <MarkdownImage
                    src={src}
                    alt={alt}
                    selectedArticle={selectedArticle}
                    PROXY_URL={PROXY_URL}
                  />
                ),
              }}
            >
              {selectedArticle.content
                .replace(/\\r\\n/g, "\n")
                .replace(/\\n/g, "\n")}
            </ReactMarkdown>
          </Box>

          {/* Article Images */}
          {selectedArticle.images && selectedArticle.images.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ color: "primary.main", fontWeight: 500 }}
              >
                Obrázky k článku
              </Typography>
              <Grid container spacing={2}>
                {selectedArticle.images.map((image, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={image.id || index}>
                    <Box
                      component="img"
                      src={getArticleImageUrl(PROXY_URL, image.id)}
                      alt={image.name || `Obrázek ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        borderRadius: 1,
                        cursor: "pointer",
                        "&:hover": { opacity: 0.8 },
                      }}
                      onClick={() =>
                        window.open(
                          getArticleImageUrl(PROXY_URL, image.id),
                          "_blank"
                        )
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
            <Button
              variant="outlined"
              onClick={handleBackToList}
              sx={{ minWidth: 120 }}
            >
              Zpět na seznam
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ color: "primary.main", fontWeight: 500 }}
        >
          Novinky
        </Typography>

        {/* Year selector */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
          <Button
            variant={selectedYear === null ? "contained" : "outlined"}
            onClick={() => handleYearSelect(null)}
            disabled={yearsLoading}
            sx={{ minWidth: 100 }}
          >
            Všechny
          </Button>
          {availableYears.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "contained" : "outlined"}
              onClick={() => handleYearSelect(year)}
              disabled={yearsLoading}
              sx={{ minWidth: 80 }}
            >
              {year}
            </Button>
          ))}
          {yearsLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={48} />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Articles List */}
      {!loading && !error && (
        <>
          {sortedArticles.length === 0 ? (
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: "center", py: 8 }}
            >
              {selectedYear
                ? `Žádné články pro rok ${selectedYear}`
                : "Žádné články nebyly nalezeny"}
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {articleList}
            </Grid>
          )}
        </>
      )}

      {/* Article Detail Loading */}
      {articleLoading && (
        <Dialog open={true} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            Načítám článek...
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={handleBackToList}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", justifyContent: "center", py: 8 }}
          >
            <CircularProgress size={48} />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
}
