import styled from 'styled-components';

export const TableContainer = styled.div`
  table {
    background-color: ${(props) => props.theme.fineCardBackground};
    border-top: 1px solid ${(props) => props.theme.cardBorder};

    thead {
      th {
        color: ${(props) => props.theme.textGray};
      }
    }

    .table-bulk-actions {
      height: 3.3rem;
      background-color: ${(props) => props.theme.cardBackground};
    }

    td {
      white-space: nowrap;

      &:last-child {
        width: 100%;
      }
    }

    &.table-bulk-actions {
      thead {
        &:not(:last-child):not(:first-child) {
          padding-right: 2.5rem;
        }
      }
      td:not(:last-child):not(:first-child) {
        padding-right: 2.5rem;
      }
    }

    &:not(.table-bulk-actions) {
      thead {
        &:not(:last-child) {
          padding-right: 2.5rem;
        }
      }
      td:not(:last-child) {
        padding-right: 2.5rem;
      }
    }

    th {
      white-space: nowrap;
    }

    tbody {
      background-color: ${(props) => props.theme.cardBackground};

      tr {
        border-top: 1px solid ${(props) => props.theme.cardBorder};
        transition: background-color 0.2s;

        &.table-row-selected {
          background-color: light-dark(#f5f5f5, #414152);

          td.table-row-primary-column {
            color: ${(props) => props.theme.primary};
          }
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          max-width: 100%;
        }

        &.rowOnClick {
          cursor: pointer;
          background-color: ${(props) => props.theme.cardBackground};

          .rowOnClick-icon {
            opacity: 0;
            transition: all ease-in-out 0.2s;
          }

          &:hover {
            background-color: ${(props) => props.theme.background};

            .rowOnClick-icon {
              opacity: 1;
            }
          }
        }

        button.row-cta {
          color: ${(props) => props.theme.primary};
          font-weight: 600;
          cursor: pointer;

          svg {
            fill: ${(props) => props.theme.primary};
          }
        }
      }
    }
  }
`;
