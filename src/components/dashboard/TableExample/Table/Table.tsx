import { useLayoutEffect, useRef, useState } from 'react';
import { TableContainer } from './styles';
import { bulkAction, Cta, Row } from './types';
import TableRows from './components/TableRows';
import BulkActions from './components/BulkActions';
import TableHead from './components/TableHead';
import { classNames } from '@/common';

type Props<T extends string> = {
  className?: string;
  rows: Row<T>[];
  columns: {
    [key in T]: string;
  };
  bulkActions?: bulkAction[];
  cta?: Cta;
  hideHead?: boolean;
  saveTableData?: {
    handleSave: () => Promise<void>;
    isDirty: boolean;
  };
  headAction?: React.ReactNode;
};

function Table<T extends string>({
  className,
  rows,
  columns,
  bulkActions,
  cta,
  hideHead,
  saveTableData,
  headAction,
}: Props<T>) {
  const checkbox = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Row<T>[]>([]);

  useLayoutEffect(() => {
    const isIndeterminate =
      selectedRows.length > 0 && selectedRows.length < rows.length;
    setChecked(selectedRows.length === rows.length);
    setIndeterminate(isIndeterminate);
    if (checkbox.current) checkbox.current.indeterminate = isIndeterminate;
  }, [selectedRows]);

  function toggleAll() {
    setSelectedRows(checked || indeterminate ? [] : rows);
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  return (
    <TableContainer
      className={classNames(
        'flow-root',
        bulkActions && 'table-bulk-actions',
        className
      )}
    >
      <div className='-my-2 -mx-[1.2rem]'>
        <div></div>
        <div className='relative inline-block min-w-full py-2 align-middle'>
          {bulkActions && selectedRows.length > 0 && (
            <BulkActions {...{ bulkActions, selectedRows }} />
          )}

          <table className='min-w-full w-full lg:w-auto table-fixed'>
            <thead className={hideHead ? 'hidden' : ''}>
              <TableHead
                {...{
                  checkbox,
                  checked,
                  toggleAll,
                  columns,
                  rows,
                  ...(bulkActions && { bulkActions }),
                  ...(saveTableData && { saveTableData }),
                  ...(headAction && { headAction }),
                }}
              />
            </thead>
            <tbody>
              <TableRows
                {...{
                  rows,
                  columns,
                  selectedRows,
                  setSelectedRows,
                  bulkActions,
                  cta,
                }}
              />
            </tbody>
          </table>
        </div>
      </div>
    </TableContainer>
  );
}

export default Table;
