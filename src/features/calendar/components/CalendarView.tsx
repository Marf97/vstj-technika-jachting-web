'use client'
import { useEffect, useRef, useState, useMemo, CSSProperties } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import csLocale from '@fullcalendar/core/locales/cs'
import type { EventContentArg, CalendarApi } from '@fullcalendar/core'

type FCEvent = { id: string; title: string; start: string; end: string; location?: string; type?: 'club'|'training'|'match' }

export default function CalendarView({ events }: { events: FCEvent[] }) {
  const theme = useTheme()
  const [view, setView] = useState<'dayGridMonth'|'timeGridWeek'|'listWeek'>('dayGridMonth')

  // držíme si CalendarApi a při změně "view" zavoláme changeView
  const apiRef = useRef<CalendarApi | null>(null)
  const calendarRef = useRef<FullCalendar | null>(null)

  useEffect(() => {
    if (calendarRef.current && !apiRef.current) {
      apiRef.current = calendarRef.current.getApi()
    }
  }, [])

  useEffect(() => {
    apiRef.current?.changeView(view)
  }, [view])

  const header = (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <Typography variant="h5">Kalendář akcí</Typography>
      <ToggleButtonGroup
        size="small"
        value={view}
        exclusive
        onChange={(_, v) => v && setView(v)}
      >
        <ToggleButton value="dayGridMonth">Měsíc</ToggleButton>
        <ToggleButton value="timeGridWeek">Týden</ToggleButton>
        <ToggleButton value="listWeek">Agenda</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  )

  const eventContent = (eventContent: EventContentArg) => {
    // vlastní vykreslení položky (název + místo na druhém řádku)
    return (
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontWeight: 600 }}>{eventContent.event.title}</div>
        {eventContent.event.extendedProps.location && (
          <div style={{ opacity: 0.8, fontSize: 12 }}>{eventContent.event.extendedProps.location}</div>
        )}
      </div>
    )
  }

  type CSSWithFCVars = React.CSSProperties & Record<`--fc-${string}`, string | number>
  const fcThemeVars: CSSWithFCVars = useMemo(
    () => ({
      '--fc-border-color': theme.palette.divider,
      '--fc-page-bg-color': theme.palette.background.default,
      '--fc-neutral-bg-color': theme.palette.action.hover,
      '--fc-today-bg-color': theme.palette.action.selected,
      '--fc-now-indicator-color': theme.palette.error.main,
      '--fc-event-bg-color': theme.palette.primary.main,
      '--fc-event-border-color': theme.palette.primary.main,
      '--fc-event-text-color': theme.palette.primary.contrastText,
    }),
    [theme]
  )

  return (
    <Paper sx={{ p: 2 }}>
      {header}
      <div style={fcThemeVars}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locales={[csLocale]}
          locale="cs"
          headerToolbar={false}
          height="auto"
          nowIndicator
          firstDay={1}
          dayMaxEvents
          eventDisplay="block"
          events={events}
          eventContent={eventContent}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          expandRows
        />
      </div>
    </Paper>
  )
}
