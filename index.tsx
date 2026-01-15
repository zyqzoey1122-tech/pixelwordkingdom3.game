
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * 单词王国 - 勇者背单词 (入口文件)
 */

const mountAndStart = () => {
  try {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      // 成功挂载后发送信号
      window.dispatchEvent(new Event('game-ready'));
    }
  } catch (error) {
    console.error("Game mount failed:", error);
    // 即使失败也尝试关闭遮罩，以便显示错误控制台
    window.dispatchEvent(new Event('game-ready'));
  }
};

// 确保在 DOM 加载后运行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAndStart);
} else {
  mountAndStart();
}
