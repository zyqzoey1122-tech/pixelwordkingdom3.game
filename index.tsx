
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

/** 
 * 注意：这个文件现在是唯一的逻辑源。
 * 如果你看到 "Cannot use import statement..."，
 * 请检查 index.html 中的 <script> 是否有 data-type="module"。
 */

// ==========================================
// 1. 数据配置 (海量单词库)
// ==========================================
const RAW_WORDS = {
  1: [
    { id: 'u1-1', english: 'ancient', chinese: '古代的', pos: 'adj', example: 'This is an ancient building.' },
    { id: 'u1-2', english: 'landscape', chinese: '风景', pos: 'n', example: 'The landscape is beautiful.' },
    { id: 'u1-3', english: 'fantastic', chinese: '极好的', pos: 'adj', example: 'We had a fantastic time.' },
    { id: 'u1-4', english: 'comfortable', chinese: '舒适的', pos: 'adj', example: 'This sofa is comfortable.' },
    { id: 'u1-5', english: 'experience', chinese: '经验', pos: 'n', example: 'It was a great experience.' },
    { id: 'u1-6', english: 'activity', chinese: '活动', pos: 'n', example: 'This is a fun activity.' },
    { id: 'u1-7', english: 'popular', chinese: '流行的', pos: 'adj', example: 'Football is popular.' },
    { id: 'u1-8', english: 'actually', chinese: '实际上', pos: 'adv', example: 'Actually I know him.' },
    { id: 'u1-9', english: 'history', chinese: '历史', pos: 'n', example: 'China has long history.' },
    { id: 'u1-10', english: 'culture', chinese: '文化', pos: 'n', example: 'We love our culture.' }
  ],
  2: [
    { id: 'u2-1', english: 'furniture', chinese: '家具', pos: 'n', example: 'We bought new furniture.' },
    { id: 'u2-2', english: 'apartment', chinese: '公寓', pos: 'n', example: 'I live in an apartment.' },
    { id: 'u2-3', english: 'decorate', chinese: '装饰', pos: 'v', example: 'Decorate the tree.' }
  ]
};

const WORLDS = [
  { id: 1, name: "Ancient Valley (Unit 1)", color: "bg-emerald-500", theme: "emerald" },
  { id: 2, name: "Cozy Sanctuary (Unit 2)", color: "bg-amber-500", theme: "amber" },
  { id: 3, name: "Social Plaza (Unit 3)", color: "bg-blue-500", theme: "blue" },
  { id: 4, name: "Adventure Peak (Unit 4)", color: "bg-purple-500", theme: "purple" }
];

const HEROES = [
  { id: 'h1', name: 'Princess Sky', type: 'Wind', color: 'bg-emerald-500', description: 'Curious and light on her feet.' },
  { id: 'h2', name: 'Prince Valiant', type: 'Fire', color: 'bg-red-500', description: 'Brave guardian of the scrolls.' },
  { id: 'h3', name: 'Little Red', type: 'Night', color: 'bg-indigo-700', description: 'Wandering through word forests.' },
  { id: 'h4', name: 'Princess Ivy', type: 'Earth', color: 'bg-blue-600', description: 'Strong roots and steady wisdom.' },
];

// ==========================================
// 2. UI 组件 (基础样式)
// ==========================================
// Fix: Added explicit prop types to PixelCard to resolve required 'onClick' error in TSX.
const PixelCard = ({ children, className = '', onClick = undefined }: { children: any; className?: string; onClick?: any }) => (
  <div onClick={onClick} className={`bg-white border-4 border-black p-4 relative ${onClick ? 'cursor-pointer hover:bg-gray-100 active:translate-y-1' : ''} ${className}`} style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
    {children}
  </div>
);

const PixelSprite = ({ type, color, action = 'idle' }) => {
  const isAttack = action === 'attack';
  const isHit = action === 'hit';
  return (
    <div className={`w-24 h-24 flex items-center justify-center text-5xl transition-all duration-300 ${isAttack ? 'translate-x-10 scale-110' : ''} ${isHit ? 'animate-bounce grayscale' : 'animate-pulse'}`}>
       {type === 'hero' ? '🧙' : '👾'}
    </div>
  );
};

const BattleView = ({ hero, heroAction, monsterAction }) => (
  <div className="w-full h-48 bg-sky-100 border-4 border-indigo-900 rounded-[2rem] flex items-center justify-between px-10 relative overflow-hidden shadow-inner">
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-green-400 opacity-30" />
    <PixelSprite type="hero" color={hero.color} action={heroAction} />
    <div className="text-4xl animate-ping opacity-20">💥</div>
    <PixelSprite type="monster" color="bg-red-500" action={monsterAction} />
  </div>
);

// ==========================================
// 3. 核心应用 (App)
// ==========================================
const App = () => {
  const [gameState, setGameState] = useState('LOGIN');
  const [userIdInput, setUserIdInput] = useState('');
  const [selectedHero, setSelectedHero] = useState(null);
  const [currentWords, setCurrentWords] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [options, setOptions] = useState([]);

  // 告诉 index.html 我们准备好了
  useEffect(() => {
    window.dispatchEvent(new Event('game-ready'));
  }, []);

  const handleLogin = () => {
    if (!userIdInput.trim()) return;
    setGameState('HERO_SELECT');
  };

  const startLevel = (worldId) => {
    const pool = RAW_WORDS[worldId] || RAW_WORDS[1];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setCurrentWords(shuffled);
    setCurrentIdx(0);
    prepareOptions(shuffled[0]);
    setGameState('GAME');
  };

  const prepareOptions = (word) => {
    if (!word) return;
    const distractors = ["电脑", "西瓜", "宇宙", "飞船", "森林", "音乐"].filter(d => d !== word.chinese).sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([...distractors, word.chinese].sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (choice) => {
    const correct = currentWords[currentIdx].chinese;
    if (choice === correct) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback(null);
        if (currentIdx + 1 < currentWords.length) {
          setCurrentIdx(idx => idx + 1);
          prepareOptions(currentWords[currentIdx + 1]);
        } else {
          setGameState('WIN');
        }
      }, 600);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  };

  if (gameState === 'LOGIN') return (
    <div className="h-screen bg-indigo-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-black text-white mb-12 tracking-tighter">WORD KINGDOM</h1>
      <PixelCard className="w-full max-w-md">
        <input className="w-full border-4 border-indigo-100 p-4 text-2xl font-bold outline-none mb-4" placeholder="勇者ID..." value={userIdInput} onChange={e => setUserIdInput(e.target.value)} />
        <button className="w-full bg-indigo-600 text-white py-5 text-xl font-black uppercase shadow-[0_6px_0_#312e81]" onClick={handleLogin}>开启冒险</button>
      </PixelCard>
    </div>
  );

  if (gameState === 'HERO_SELECT') return (
    <div className="h-screen bg-indigo-950 p-8 flex flex-col items-center">
      <h2 className="text-4xl font-black text-white mb-12">选择你的勇者</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-6xl">
        {HEROES.map(h => (
          <PixelCard key={h.id} onClick={() => { setSelectedHero(h); setGameState('MAP'); }} className="text-center group">
            <div className={`w-20 h-20 ${h.color} mx-auto rounded-2xl mb-4 group-hover:scale-110 transition-transform`} />
            <div className="font-black text-xl text-indigo-900 mb-2">{h.name}</div>
          </PixelCard>
        ))}
      </div>
    </div>
  );

  if (gameState === 'MAP') return (
    <div className="h-screen bg-emerald-50 p-8 flex flex-col items-center">
      <h2 className="text-3xl font-black text-indigo-900 mb-12">探索地图</h2>
      <div className="flex flex-col gap-10 w-full max-w-4xl">
        {WORLDS.map(w => (
          <PixelCard key={w.id} className="flex flex-col gap-4">
            <div className="font-black text-xl">{w.name}</div>
            <div className="grid grid-cols-4 gap-4">
              {/* Fix: Changed startQuest to startLevel as startQuest was not defined. */}
              <div onClick={() => startLevel(w.id)} className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-400">
                <span onClick={() => startLevel(w.id)} className="text-2xl">🏰 Stage 1</span>
              </div>
            </div>
          </PixelCard>
        ))}
      </div>
    </div>
  );

  if (gameState === 'GAME' && selectedHero) return (
    <div className="h-screen bg-white p-6 flex flex-col gap-8 items-center">
      <BattleView hero={selectedHero} heroAction={feedback === 'correct' ? 'attack' : 'idle'} monsterAction={feedback === 'wrong' ? 'attack' : 'idle'} />
      <div className="text-7xl font-black uppercase tracking-tighter text-indigo-900">{currentWords[currentIdx]?.english}</div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        {options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(opt)} className="bg-white border-4 border-black py-6 text-xl font-bold hover:bg-indigo-50 active:translate-y-1 transition-all">{opt}</button>
        ))}
      </div>
    </div>
  );

  if (gameState === 'WIN') return (
    <div className="h-screen bg-indigo-900 flex flex-col items-center justify-center p-8 text-white">
      <div className="text-8xl mb-4">🏆</div>
      <h2 className="text-5xl font-black mb-12 uppercase">任务达成!</h2>
      <button className="bg-white text-indigo-900 px-12 py-5 rounded-full font-black text-2xl" onClick={() => setGameState('MAP')}>回到地图</button>
    </div>
  );

  return null;
};

// 5. 挂载
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
