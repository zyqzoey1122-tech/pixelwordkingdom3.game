
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// ==========================================
// 1. 类型定义 (Types)
// ==========================================
interface Word {
  id: string; english: string; chinese: string; pos: string;
  example: string; exampleChinese?: string; phonetic?: string;
}
interface User {
  userId: string; unlockedLevels: string[]; stars: Record<string, number>;
  mistakes: Array<{ wordId: string; type: string; timestamp: number }>; lastStudyTime: number;
}
interface Hero { id: string; name: string; type: string; color: string; description: string; }
enum GameStageType { RECOGNITION = 'RECOGNITION', CONSOLIDATION = 'CONSOLIDATION', APPLICATION = 'APPLICATION' }

// ==========================================
// 2. 核心数据 (Constants)
// ==========================================
const HEROES: Hero[] = [
  { id: 'h1', name: 'Princess Sky', type: 'Wind', color: 'bg-emerald-500', description: 'Curious and light on her feet.' },
  { id: 'h2', name: 'Prince Valiant', type: 'Fire', color: 'bg-red-500', description: 'Brave guardian of the scrolls.' },
  { id: 'h3', name: 'Little Red', type: 'Night', color: 'bg-indigo-700', description: 'Wandering through word forests.' },
  { id: 'h4', name: 'Princess Ivy', type: 'Earth', color: 'bg-blue-600', description: 'Strong roots and steady wisdom.' },
];

const RAW_WORDS: Record<number, Word[]> = {
  1: [
    { id: 'u1-1', english: 'ancient', chinese: '古代的', pos: 'adj', example: 'This is an ancient building.' },
    { id: 'u1-2', english: 'landscape', chinese: '风景', pos: 'n', example: 'The landscape is beautiful.' },
    { id: 'u1-3', english: 'fantastic', chinese: '极好的', pos: 'adj', example: 'We had a fantastic time.' },
    { id: 'u1-4', english: 'comfortable', chinese: '舒适的', pos: 'adj', example: 'This sofa is comfortable.' },
    { id: 'u1-5', english: 'experience', chinese: '经验', pos: 'n', example: 'It was a great experience.' },
    { id: 'u1-6', english: 'activity', chinese: '活动', pos: 'n', example: 'This is a fun activity.' },
    { id: 'u1-7', english: 'popular', chinese: '流行的', pos: 'adj', example: 'Football is popular.' },
    { id: 'u1-8', english: 'actually', chinese: '实际上', pos: 'adv', example: 'Actually I know him.' },
  ],
  // ... 其他单元数据可在此继续添加
};

const WORLDS = [
  { id: 1, name: "Ancient Valley (Unit 1)", color: "bg-emerald-500" },
  { id: 2, name: "Cozy Sanctuary (Unit 2)", color: "bg-amber-500" },
];

// ==========================================
// 3. 存储服务 (Storage)
// ==========================================
const STORAGE_KEY = 'WORD_KINGDOM_DATA';
const storageService = {
  async getUser(userId: string): Promise<User | null> {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[userId] || null;
  },
  async saveUser(user: User): Promise<void> {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[user.userId] = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

// ==========================================
// 4. 基础组件 (UI Components)
// ==========================================
// Fixed: Added explicit type definition for props to make onClick optional and resolve the TS error when used in lines like 107
const PixelCard = ({ children, className = '', onClick }: { children: any; className?: string; onClick?: any }) => (
  <div onClick={onClick} className={`bg-white border-4 border-black p-4 relative ${onClick ? 'cursor-pointer hover:bg-gray-100 active:translate-y-1' : ''} ${className}`} style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
    {children}
  </div>
);

const PixelSprite = ({ type, color, action = 'idle', variant }) => (
  <div className={`w-24 h-24 ${color} border-4 border-black rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-all ${action === 'hit' ? 'animate-bounce grayscale' : 'animate-pulse'}`}>
    {type === 'hero' ? '🧙' : '👾'}
  </div>
);

// ==========================================
// 5. 战斗视图 (Battle)
// ==========================================
const BattleView = ({ hero, heroAction, monsterAction }) => (
  <div className="w-full h-40 bg-blue-50 border-4 border-indigo-900 rounded-3xl flex items-center justify-between px-10 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
    <PixelSprite type="hero" color={hero.color} action={heroAction} variant={hero.id} />
    <div className="text-4xl animate-ping opacity-20">💥</div>
    <PixelSprite type="monster" color="bg-red-500" action={monsterAction} variant="m1" />
  </div>
);

// ==========================================
// 6. 核心游戏应用 (Main App)
// ==========================================
const App = () => {
  const [gameState, setGameState] = useState('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [userIdInput, setUserIdInput] = useState('');
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentWords, setCurrentWords] = useState<Word[]>([]);
  const [feedback, setFeedback] = useState(null);

  // 初始化通知
  useEffect(() => {
    window.dispatchEvent(new Event('game-ready'));
  }, []);

  const handleLogin = async () => {
    if (!userIdInput.trim()) return;
    let existingUser = await storageService.getUser(userIdInput);
    if (!existingUser) {
      existingUser = { userId: userIdInput, unlockedLevels: ['w1-s1'], stars: {}, mistakes: [], lastStudyTime: Date.now() };
      await storageService.saveUser(existingUser);
    }
    setUser(existingUser);
    setGameState('HERO_SELECT');
  };

  const startLevel = (worldId: number) => {
    const pool = RAW_WORDS[worldId] || RAW_WORDS[1];
    setCurrentWords([...pool].sort(() => Math.random() - 0.5));
    setCurrentWordIdx(0);
    setGameState('GAME');
  };

  const handleAnswer = (choice: string) => {
    const correct = currentWords[currentWordIdx].chinese;
    if (choice === correct) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback(null);
        if (currentWordIdx + 1 < currentWords.length) setCurrentWordIdx(prev => prev + 1);
        else setGameState('WIN');
      }, 600);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  };

  if (gameState === 'LOGIN') return (
    <div className="h-screen bg-indigo-900 flex items-center justify-center p-6">
      <PixelCard className="w-full max-w-md text-center">
        <h1 className="text-3xl font-black text-indigo-900 mb-8">WORD KINGDOM</h1>
        <input className="w-full border-4 border-indigo-100 p-4 text-xl rounded-xl mb-4 outline-none focus:border-indigo-500" value={userIdInput} onChange={e => setUserIdInput(e.target.value)} placeholder="输入勇者ID..." />
        <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-[0_6px_0_#312e81] active:translate-y-1 active:shadow-none" onClick={handleLogin}>进入王国</button>
      </PixelCard>
    </div>
  );

  if (gameState === 'HERO_SELECT') return (
    <div className="h-screen bg-indigo-950 p-6 flex flex-col items-center justify-center">
      <h2 className="text-white text-3xl font-black mb-10">选择你的英雄</h2>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {HEROES.map(h => (
          <PixelCard key={h.id} onClick={() => { setSelectedHero(h); startLevel(1); }} className="text-center">
            <div className={`w-16 h-16 ${h.color} mx-auto rounded-lg mb-2`} />
            <div className="font-bold">{h.name}</div>
          </PixelCard>
        ))}
      </div>
    </div>
  );

  if (gameState === 'GAME' && selectedHero) return (
    <div className="h-screen bg-white p-6 flex flex-col gap-6">
      <BattleView hero={selectedHero} heroAction={feedback === 'correct' ? 'attack' : 'idle'} monsterAction={feedback === 'wrong' ? 'attack' : 'idle'} />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl font-black mb-10 uppercase tracking-tighter">{currentWords[currentWordIdx]?.english}</div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {currentWords.map(w => w.chinese).sort(() => Math.random() - 0.5).slice(0, 4).map((opt, i) => (
            <button key={i} className="border-4 border-black py-4 font-bold text-xl hover:bg-indigo-50 transition-colors" onClick={() => handleAnswer(opt)}>{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );

  if (gameState === 'WIN') return (
    <div className="h-screen bg-emerald-500 flex flex-col items-center justify-center text-white">
      <div className="text-8xl mb-4">🏆</div>
      <h2 className="text-5xl font-black mb-8">MISSION CLEAR!</h2>
      <button className="bg-white text-emerald-600 px-10 py-4 rounded-full font-black text-xl" onClick={() => setGameState('HERO_SELECT')}>继续冒险</button>
    </div>
  );

  return null;
};

// 挂载应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
