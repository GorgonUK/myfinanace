import styled from '@emotion/styled';

/** Default page grid shell — reuse per route via each folder’s `styles.ts`. */
export const Container = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 2fr;
  grid-auto-flow: dense;

  .col-span-1 {
    grid-column: 1 / 2;
  }
  .col-span-2 {
    grid-column: 2 / 3;
  }
  .col-span-3 {
    grid-column: 1 / 3;
  }

  .col-span-1,
  .col-span-2,
  .col-span-3 {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }

  @media (max-width: 1225px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;

    .col-span-1,
    .col-span-2,
    .col-span-3 {
      grid-column: 1 / -1;
    }
  }
`;
