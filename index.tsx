
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * 单词王国 - 勇者背单词 (入口文件)
 * 此文件仅负责挂载 App 组件。
 * 具体的单词数据和游戏逻辑分别位于 constants.tsx 和 App.tsx 中。
 */

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 通知 index.html 游戏已就绪，隐藏加载遮罩
window.dispatchEvent(new Event('game-ready'));
