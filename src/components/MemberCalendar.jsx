import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import csLocale from "@fullcalendar/core/locales/cs";
import { fetchMemberCalendar, updateMemberCalendarEventState } from "../lib/graph";

const CALENDAR_ENDPOINT = import.meta.env.VITE_MEMBER_CALENDAR_URL;

const STATE_LABELS = {
  Requested: "Čeká na schválení",
  Confirmed: "Schváleno",
  Canceled: "Zamítnuto",
  Rejected: "Zamítnuto",
};

function getStateLabel(state) {
  return STATE_LABELS[state] || state || "Neuvedeno";
}

export default function MemberCalendar({
  canApproveReservations = false,
  canCancelReservations = false,
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [updatingState, setUpdatingState] = useState(null);
  const [calendarTitle, setCalendarTitle] = useState("");
  const requestIdRef = useRef(0);
  const lastFetchInfoRef = useRef(null);

  const loadEvents = useCallback(async (fetchInfo) => {
    const requestId = ++requestIdRef.current;
    lastFetchInfoRef.current = fetchInfo;
    const title = fetchInfo.view.title;
    setCalendarTitle(title.charAt(0).toUpperCase() + title.slice(1));

    setLoading(true);

    try {
      const nextEvents = await fetchMemberCalendar(
        CALENDAR_ENDPOINT,
        fetchInfo.startStr,
        fetchInfo.endStr
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setEvents(Array.isArray(nextEvents) ? nextEvents : []);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(err.message || "Nepodařilo se načíst členský kalendář.");
      setEvents([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      state: clickInfo.event.extendedProps?.state || "Requested",
      description: clickInfo.event.extendedProps?.description || null,
      location: clickInfo.event.extendedProps?.location || null,
    });
    setUpdateError(null);
  }, []);

  const handleDialogClose = useCallback(() => {
    setSelectedEvent(null);
    setUpdateError(null);
  }, []);

  const handleStateUpdate = useCallback(
    async (nextState) => {
      if (!selectedEvent?.id) {
        return;
      }

      setUpdatingState(nextState);
      setUpdateError(null);

      try {
        await updateMemberCalendarEventState(
          CALENDAR_ENDPOINT,
          selectedEvent.id,
          nextState
        );

        if (lastFetchInfoRef.current) {
          await loadEvents(lastFetchInfoRef.current);
        }

        setSelectedEvent(null);
      } catch (err) {
        setUpdateError(
          err.message || "Nepodařilo se aktualizovat stav rezervace."
        );
      } finally {
        setUpdatingState(null);
      }
    },
    [loadEvents, selectedEvent]
  );

  const formatDateTime = useCallback((value) => {
    if (!value) {
      return "Neuvedeno";
    }

    return new Date(value).toLocaleString("cs-CZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ color: "primary.main", fontWeight: 500 }}>
        Členský kalendář
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Kalendář momentálně zobrazuje rezervace lodí v měsíčním zobrazení. Kliknutím na rezervaci zobrazíte její detail.
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1.5,
          minHeight: 28,
          mb: 1,
          color: "primary.main",
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: "1.4rem", md: "1.75rem" }, fontWeight: 500 }}
        >
          {calendarTitle}
        </Typography>
        {loading && <CircularProgress size={18} thickness={5} />}
      </Box>

      <Box
        sx={{
          position: "relative",
          "& .fc": {
            fontFamily: "inherit",
          },
          "& .fc .fc-header-toolbar": {
            marginBottom: 2,
          },
          "& .fc .fc-toolbar-title": {
            display: "none",
          },
          "& .fc .fc-button": {
            backgroundColor: "primary.main",
            borderColor: "primary.main",
            textTransform: "none",
            boxShadow: "none",
          },
          "& .fc .fc-button:hover": {
            backgroundColor: "secondary.main",
            borderColor: "secondary.main",
          },
          "& .fc .fc-button-primary:not(:disabled).fc-button-active": {
            backgroundColor: "navy.main",
            borderColor: "navy.main",
          },
          "& .fc .fc-daygrid-event": {
            borderRadius: 1,
            border: "none",
            paddingInline: "2px",
          },
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={csLocale}
          firstDay={1}
          height="auto"
          datesSet={loadEvents}
          events={events}
          displayEventTime={false}
          fixedWeekCount={false}
          dayMaxEvents={3}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          }}
        />
      </Box>

      {!loading && !error && events.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          V aktuálně zobrazeném období nejsou žádné rezervace.
        </Alert>
      )}

      <Dialog
        open={Boolean(selectedEvent)}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        disableScrollLock
      >
        <DialogTitle>Detail rezervace</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              {updateError && <Alert severity="error">{updateError}</Alert>}

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Loď
                </Typography>
                <Typography variant="h6">{selectedEvent.title}</Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Stav
                </Typography>
                <Typography>{getStateLabel(selectedEvent.state)}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Začátek výpůjčky
                </Typography>
                <Typography>{formatDateTime(selectedEvent.start)}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Konec výpůjčky
                </Typography>
                <Typography>{formatDateTime(selectedEvent.end)}</Typography>
              </Box>

              {selectedEvent.location && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Místo
                  </Typography>
                  <Typography>{selectedEvent.location}</Typography>
                </Box>
              )}

              {selectedEvent.description && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Poznámka
                  </Typography>
                  <Typography>{selectedEvent.description}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        {selectedEvent &&
          (canApproveReservations || canCancelReservations) &&
          ["Requested", "Confirmed", "Canceled", "Rejected"].includes(
            selectedEvent.state
          ) && (
            <DialogActions sx={{ px: 3, pb: 2 }}>
              {canCancelReservations &&
                ["Requested", "Confirmed"].includes(selectedEvent.state) && (
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={Boolean(updatingState)}
                    onClick={() => handleStateUpdate("Canceled")}
                  >
                    {updatingState === "Canceled" ? "Ukládám..." : "Zamítnout"}
                  </Button>
                )}
              {canApproveReservations && selectedEvent.state === "Requested" && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={Boolean(updatingState)}
                  onClick={() => handleStateUpdate("Confirmed")}
                >
                  {updatingState === "Confirmed" ? "Ukládám..." : "Schválit"}
                </Button>
              )}
              {canApproveReservations &&
                ["Canceled", "Rejected"].includes(selectedEvent.state) && (
                  <Button
                    variant="contained"
                    color="success"
                    disabled={Boolean(updatingState)}
                    onClick={() => handleStateUpdate("Confirmed")}
                  >
                    {updatingState === "Confirmed"
                      ? "Ukládám..."
                      : "Obnovit jako schválené"}
                  </Button>
                )}
            </DialogActions>
          )}
      </Dialog>
    </Paper>
  );
}
