'use client'

import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Button, Stack } from '@mui/material'

type Row = {
  id: string
  title: string
  startsAt: string | Date
  endsAt: string | Date
  location: string | null
  isPublic: boolean
}

export default function EventsTable({ rows }: { rows: Row[] }) {
  const columns: GridColDef<Row>[] = [
    { field: 'title', headerName: 'Název', flex: 1, minWidth: 220 },
    {
      field: 'startsAt',
      headerName: 'Začátek',
      width: 180,
      valueGetter: (_, r) => new Date(r.startsAt).toLocaleString('cs-CZ'),
    },
    {
      field: 'endsAt',
      headerName: 'Konec',
      width: 180,
      valueGetter: (_, r) => new Date(r.endsAt).toLocaleString('cs-CZ'),
    },
    { field: 'location', headerName: 'Místo', flex: 1, minWidth: 160 },
    {
      field: 'isPublic',
      headerName: 'Veřejná',
      width: 110,
      valueGetter: (_, r) => (r.isPublic ? 'Ano' : 'Ne'),
    },
    {
      field: 'actions',
      headerName: 'Akce',
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Row>) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" href={`/api/ics/${params.row.id}`} target="_blank">
            .ics
          </Button>
          <Button size="small" href={`/calendar`} >
            Kalendář
          </Button>
        </Stack>
      ),
    },
  ]

  return (
    <div style={{ height: 560, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} getRowId={(r) => r.id} />
    </div>
  )
}
