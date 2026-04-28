import type { ReactNode } from 'react'

interface DataColumn<T> {
  key: keyof T | string
  header: string
  render: (item: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Array<DataColumn<T>>
  rows: T[]
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = 'No records available.',
}: DataTableProps<T>) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="tbl-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={String(column.key)}>{column.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
