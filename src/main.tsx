import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import Vazirmatn font weights
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/vazirmatn/800.css';
import '@fontsource/vazirmatn/900.css';

import maplibregl from 'maplibre-gl';
import { registerSW } from 'virtual:pwa-register';

// Initialize MapLibre RTL Text Plugin for Persian/Arabic text shaping
if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
  maplibregl.setRTLTextPlugin('/mapbox-gl-rtl-text.js', true).catch((err: unknown) => {
    console.warn('RTL Text Plugin warning:', err);
  });
}

// Auto-register service worker for PWA offline capabilities
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
