import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // Your main App component

const rootElement = document.getElementById('root');

hydrateRoot(
    rootElement,
    <BrowserRouter>
        <App />
    </BrowserRouter>
);