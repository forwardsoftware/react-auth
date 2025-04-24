import 'react-app-polyfill/ie11';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './src/App';

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(<App />);
}