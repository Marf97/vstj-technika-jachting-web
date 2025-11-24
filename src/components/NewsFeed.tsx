import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { fetchArticlesFromProxy } from "../lib/graph";

type Article = {
  id: string;
  title: string;
  year: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  thumbnail?: string;
  excerpt?: string;
};

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const PROXY_URL = "https://jachting.technika-praha.cz/php/endpoints/news.php";

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const fetchedArticles = await fetchArticlesFromProxy(PROXY_URL);
      // Sort by createdDateTime descending (newest first)
      const sortedArticles = fetchedArticles.sort(
        (a, b) =>
          new Date(b.createdDateTime).getTime() -
          new Date(a.createdDateTime).getTime()
      );
      // Take only the top 3
      setArticles(sortedArticles.slice(0, 3));
      setError(null);
    } catch (e: any) {
      console.error("Failed to load articles:", e);
      setError(e.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article: Article) => {
    navigate(`/novinky?article=${article.title}&year=${article.year}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("cs-CZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Box sx={{ mb: 6 }}>
      {/* Static header - always visible */}
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        sx={{ color: "primary.main", fontWeight: 500 }}
      >
        Nejnovější články
      </Typography>

      {/* Loading State */}
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
            Načítám články…
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Typography sx={{ p: 4, color: "error.main" }}>
          Chyba: {error}
        </Typography>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {articles.length === 0 ? (
            <Typography>Žádné články nebyly nalezeny.</Typography>
          ) : (
            <Grid container spacing={3}>
              {articles.map((article) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
                  <Card
                    sx={{
                      height: 300,
                      width: 250,
                      position: "relative",
                      cursor: "pointer",
                      borderRadius: 8,
                      transition: "transform 0.2s",
                      "&:hover": { transform: "translateY(-4px)" },
                    }}
                    onClick={() => handleArticleClick(article)}
                  >
                    <CardActionArea sx={{ height: "100%" }}>
                      {/* Thumbnail as background with grey tint */}
                      {article.thumbnail && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${article.thumbnail})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(0, 0, 0, 0.4)", // Grey tint
                            },
                          }}
                        />
                      )}
                      <CardContent
                        sx={{
                          position: "relative",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          color: "white",
                          p: 2,
                        }}
                      >
                        <Typography
                          variant="h3"
                          component="h3"
                          sx={{
                            fontWeight: 500,
                            textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                            mb: 1,
                          }}
                        >
                          {article.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                            alignSelf: "flex-end",
                          }}
                        >
                          {formatDate(article.createdDateTime)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
