import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { render } from './build/server/server.js'; //Import the server side rendered react app.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'build/client')));

app.get('*', async (req, res) => {
    try {
        const { html } = await render({
            url: req.originalUrl,
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});