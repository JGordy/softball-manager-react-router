import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App'; // Your main App component

export async function render({ url }) {
    let appHtml;

    try {
        appHtml = ReactDOMServer.renderToString(
            <StaticRouter location={url}>
                <App />
            </StaticRouter>
        );
    } catch (error) {
        console.error('SSR Error:', error);
        appHtml = '<div>Server Error</div>'; // Handle errors gracefully
    }

    return {
        html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your App Title</title>
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