import { createGlobalStyle } from 'styled-components';
import '../styles/globals.css'
import type { AppProps } from 'next/app'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: transparent;
    min-height: 100vh;
  }
`;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyle />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp
