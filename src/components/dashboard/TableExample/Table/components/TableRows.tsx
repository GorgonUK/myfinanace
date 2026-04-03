import React from 'react';
import { bulkAction, Cta, Row } from '../types';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { classNames } from '@/common';
import { Eye } from 'react-bootstrap-icons';
import { CheckboxInput } from '@/components/common/form';

type Props<T extends string> = {
  selectedRows: Row<T>[];
  setSelectedRows: React.Dispatch<React.SetStateAction<Row<T>[]>>;
  rows: Row<T>[];
  columns: {
    [key in T]: string;
  };
  bulkActions?: bulkAction[];
  cta?: Cta;
};

function TableRows<T extends string>({
  rows,
  columns,
  selectedRows,
  setSelectedRows,
  bulkActions,
  cta,
}: Props<T>) {
  const columnsArray: T[] = Object.keys(columns) as T[];

  return rows.map((row, index) => (
    <tr
      {...(row.onClick && { onClick: row.onClick })}
      key={index}
      className={classNames(
        row.className,
        selectedRows.includes(row) && 'table-row-selected',
        row.onClick && 'rowOnClick'
      )}
    >
      {/* if any bulk actions are provided, display a checkbox */}
      {bulkActions && (
        <td className='relative hidden lg:table-cell px-7 sm:w-12 sm:px-6'>
          {selectedRows.includes(row) && (
            <div className='absolute inset-y-0 left-0 w-0.5 bg-careerbook-blue-900' />
          )}
          <CheckboxInput
            id={`checkbox-${index}`}
            className='bulk-actions-checkbox absolute left-[1.4rem] top-1/2 -mt-2 h-4 w-4 rounded'
            value={index}
            checked={selectedRows.includes(row)}
            handleChange={(checked) =>
              setSelectedRows(
                checked
                  ? [...selectedRows, row]
                  : selectedRows.filter((selectedRow) => row !== selectedRow)
              )
            }
          />
        </td>
      )}

      {/* the first column, will display all columns stacked on mobile */}
      <td
        className={classNames(
          'table-row-primary-column relative whitespace-nowrap py-4 text-sm font-medium text-start',
          bulkActions ? 'px-3' : 'px-6'
        )}
      >
        <div className='flex relative w-full lg:w-min truncate'>
          {row.columns[columnsArray[0] as keyof typeof row.columns]}
          {row.onClick && (
            <Eye
              fill='#7c7c7c'
              className='rowOnClick-icon absolute w-4 h-full top-0 -right-6'
            />
          )}
        </div>
        <dl className='font-normal lg:hidden'>
          {columnsArray.slice(1).map((column) => (
            <React.Fragment key={column}>
              <dt className='sr-only'>{column}</dt>
              <dd className='mt-1 truncate text-gray-500 w-full'>
                {row.columns[column as keyof typeof row.columns]}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </td>

      {/* the rest of the columns, hidden on mobile */}
      {columnsArray.slice(1).map((column) => (
        <td
          key={column}
          className='hidden py-4 px-3 text-sm text-gray-500 lg:table-cell text-start'
        >
          {row.columns[column as keyof typeof row.columns]}
        </td>
      ))}

      {/* if a unique row cta is provided, display it */}
      {row.cta && (
        <td className='py-4 pl-3 pr-4 lg:pr-7 text-right text-sm font-medium'>
          {row.cta.cta}
        </td>
      )}

      {/* the default call to action button */}
      {cta && (
        <td className='py-4 pl-3 pr-4 lg:pr-7 text-right text-sm font-medium'>
          <div className='flex justify-end'>
            <button
              onClick={() => cta.onClick(row.id)}
              className='row-cta flex items-center gap-1 md:gap-3'
            >
              {cta.label}
              {cta.icon ? (
                cta.icon
              ) : (
                <ChevronRightIcon fill='#4B4B4B' className='w-4' />
              )}
            </button>
          </div>
        </td>
      )}
    </tr>
  ));
}

export default TableRows;
