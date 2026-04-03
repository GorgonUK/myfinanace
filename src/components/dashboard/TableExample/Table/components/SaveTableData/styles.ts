import styled from 'styled-components'

export const Container = styled.div`
  p {
    position: absolute;
    white-space: nowrap;
    right: 5rem;
    font-size: 0.8rem;
    font-weight: 400;
    color: ${(props) => props.theme.textGray};
    opacity: 0;
    transition: opacity 0.3s;
  }

  button {
    padding: 0.35rem 1.2rem;
    background-color: ${({ theme }) => theme.buttonBackground};
    color: ${({ theme }) => theme.buttonColor};
    border-radius: 2rem;
    opacity: 0.5;
    width: unset;
    font-size: 0.9rem;
    cursor: not-allowed;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  &.active {
    p {
      opacity: 1;
    }

    button {
      opacity: 1;
      cursor: pointer;
      pointer-events: all;
    }
  }
`
