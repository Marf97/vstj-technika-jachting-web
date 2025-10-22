'use client'

import { DataGrid, GridColDef } from '@mui/x-data-grid'

type Row = {
  id: string
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string | Date
}
export default function MembersTable({ rows }: { rows: Row[] }) {
  const columns: GridColDef<Row>[] = [
    { field: 'name', headerName: 'Jméno', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'E-mail', flex: 1, minWidth: 200 },
    { field: 'status', headerName: 'Stav', width: 120 },
    {
      field: 'createdAt',
      headerName: 'Vytvořeno',
      width: 180,
      valueGetter: (_, r) => new Date(r.createdAt).toLocaleString('cs-CZ'),
    },
  ]

  return (
    <div style={{ height: 520, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} getRowId={(r) => r.id} />
    </div>
  )
}
