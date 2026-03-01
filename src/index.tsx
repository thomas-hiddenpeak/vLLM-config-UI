import { createRoot } from 'react-dom/client';
import { App } from './App';
import './i18n';

// 渲染应用
const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
