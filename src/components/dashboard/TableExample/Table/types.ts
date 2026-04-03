import React from 'react'

export type Row<T extends string> = {
  id: string | number
  columns: {
    [key in T]: JSX.Element
  }
  cta?: {
    head?: string;
    cta: JSX.Element;
  }
  className?: string
  onClick?: () => void
}

export type bulkAction = {
  label: string
  onClick: (selectedRows: any[]) => void
}

export type Cta = {
  label: string
  icon?: React.ReactNode
  onClick: (id: string | number) => void
}
