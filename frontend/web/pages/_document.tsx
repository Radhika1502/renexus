import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldBeDark = theme === 'dark' || (theme === null && prefersDark);
                  
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // Fallback to light mode if there's any error
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 