// pages/_app.js
import '@/styles/global.css'; // Import global styles
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>EventEase</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;