import { classNames } from '@/common';
import { bulkAction, Row } from '../types';
import SaveTableData from './SaveTableData/SaveTableData';
import { CheckboxInput } from '@/components/common/form';

type Props<T extends string> = {
  checkbox: React.RefObject<HTMLInputElement>;
  checked: boolean;
  toggleAll: () => void;
  columns: {
    [key in T]: string;
  };
  rows: Row<T>[];
  bulkActions?: bulkAction[];
  saveTableData?: {
    handleSave: () => Promise<void>;
    isDirty: boolean;
  };
  headAction?: React.ReactNode;
};

function TableHead<T extends string>({
  checkbox,
  checked,
  toggleAll,
  columns,
  rows,
  bulkActions,
  saveTableData,
  headAction
}: Props<T>) {
  return (
    <tr>
      {bulkActions && (
        <th
          scope='col'
          className='relative hidden lg:table-cell px-7 sm:w-12 sm:px-6'
        >
          <CheckboxInput
            id={`bulk-actions-head-checkbox`}
            className='absolute left-[1.4rem] top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600'
            checked={checked}
            handleChange={toggleAll}
          />
        </th>
      )}

      {Object.values(columns).map((column, index) => (
        <th
          key={index}
          scope='col'
          className={classNames(
            'py-3 text-left text-sm font-semibold table-cell align-bottom',
            index === 0
              ? bulkActions
                ? 'px-3'
                : 'px-6'
              : 'px-3 hidden lg:table-cell'
          )}
        >
          {column as React.ReactNode}
        </th>
      ))}

      {saveTableData && (
        <th scope='col' className='relative py-3 pl-3 pr-4 sm:pr-6'>
          <SaveTableData
            handleSave={saveTableData.handleSave}
            isDirty={saveTableData.isDirty}
          />
        </th>
      )}

      {headAction && (
        <th scope='col' className='relative py-3 pl-3 pr-4 sm:pr-6'>
          <div className="absolute bottom-4 right-4 sm:right-6 flex justify-end">
            {headAction}
          </div>
        </th>
      )}

      {rows.some((row) => row?.cta?.head) && (
        <th
          scope='col'
          className='relative text-sm font-semibold py-3 float-right pr-4 sm:pr-6'
        >
          {rows[0]?.cta?.head}
        </th>
      )}
    </tr>
  );
}

export default TableHead;
