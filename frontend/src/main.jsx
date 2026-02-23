import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Global reset
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; }
  select option { background: #1a1a1a; color: #fff; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);