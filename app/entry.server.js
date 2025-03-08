import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App'; // Your main App component
import { ServerStyleSheet } from 'styled-components';
import { Helmet } from 'react-helmet';

export async function render({ url }) {
    const sheet = new ServerStyleSheet();
    let appHtml;
    let helmet;

    try {
        appHtml = ReactDOMServer.renderToString(
            sheet.collectStyles(
                <StaticRouter location={url}>
                    <App />
                </StaticRouter>
            )
        );
        helmet = Helmet.renderStatic();
    } catch (error) {
        console.error('SSR Error:', error);
        appHtml = '<div>Server Error</div>'; // Handle errors gracefully
    }

    const styles = sheet.getStyleTags();
    const head = ReactDOMServer.renderToString(helmet.title.toComponent()) + ReactDOMServer.renderToString(helmet.meta.toComponent()) + ReactDOMServer.renderToString(helmet.link.toComponent());

    return {
        html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          ${head}
          ${styles}
        </head>
        <body>
          <div id="root">${appHtml}</div>
          <script type="module" src="/build/client/assets/entry.client-*.js"></script>
        </body>
      </html>
    `,
    };
}

export default render;