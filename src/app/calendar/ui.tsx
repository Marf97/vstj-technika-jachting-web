'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

type Props = { events: Array<{ id: string; title: string; start: string; end: string; url?: string }> }

export default function ClientCalendar({ events }: Props) {
  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={(info) => {
          // výchozí chování: otevře URL (.ics) – můžeš si upravit na detail akce
          if (!info.event.url) return
          info.jsEvent.preventDefault()
          window.open(info.event.url, '_blank')
        }}
        height="auto"
      />
    </div>
  )
}
