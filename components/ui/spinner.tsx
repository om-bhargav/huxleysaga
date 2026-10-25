import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <span />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .loader {
    --size: 32px;
    --inset: calc(var(--size) * 0.15);
    --hole: calc(var(--size) / 2 - var(--inset));

    position: relative;
    width: var(--size);
    height: var(--size);
    border: 1px solid #ffffff;
    background: radial-gradient(circle, transparent calc(var(--hole) - 0.5px), #ffffff var(--hole));
    isolation: isolate;
    overflow: hidden;
    border-radius: 50%;
    box-shadow: -1.5px -1.5px 1.5px rgba(255, 255, 255, 0.1),
      3px 3px 3px rgba(0, 0, 0, 0.4);
  }

  .loader:before {
    content: "";
    position: absolute;
    inset: var(--inset);
    z-index: 10;
    background: transparent;
    border-radius: 50%;
    box-shadow: inset -1px -1px 1.5px rgba(255, 255, 255, 0.2),
      inset 1px 1px 1.5px rgba(0, 0, 0, 0.5);
  }

  .loader span {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(#000000 0deg 90deg, transparent 90deg);
    -webkit-mask: radial-gradient(circle, transparent calc(var(--hole) - 0.5px), #000 var(--hole));
    mask: radial-gradient(circle, transparent calc(var(--hole) - 0.5px), #000 var(--hole));
    z-index: -1;
    animation: animate 1s linear infinite;
  }

  @keyframes animate {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }`;

export default Loader;