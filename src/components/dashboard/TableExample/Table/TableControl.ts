import { css } from 'styled-components'

export const TableControlStyles = css`
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.cardBackground};
  border: 1px solid ${(props) => props.theme.cardBorder};
  border-radius: 2rem;
  padding: 0.65rem 1rem;
`
