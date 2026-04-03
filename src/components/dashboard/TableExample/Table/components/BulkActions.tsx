import { bulkAction, Row } from '../types'

type Props = {
  bulkActions: bulkAction[]
  selectedRows: any[]
}

function BulkActions({ bulkActions, selectedRows }: Props) {
  const selectRowsIds = selectedRows.map(row => row.id)
  
  return (
    <div className="table-bulk-actions absolute left-14 top-2 flex items-center space-x-3 sm:left-12">
      {bulkActions.map(({ label, onClick }) => (
        <button
          type="button"
          onClick={() => onClick(selectRowsIds)}
          className="inline-flex items-center rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default BulkActions
