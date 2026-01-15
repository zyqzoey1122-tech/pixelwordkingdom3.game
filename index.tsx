
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

/** ========================================================================
 *  1. TYPES & INTERFACES (类型定义)
 *  ======================================================================== */
interface Word {
  id: string; english: string; chinese: string; pos: string;
  example: string; exampleChinese?: string;
}
interface User {
  userId: string; unlockedLevels: string[]; stars: Record<string, number>;
  mistakes: Array<{ wordId: string; type: string; timestamp: number }>;
  lastStudyTime: number;
}
enum GameStageType { RECOGNITION = 'RECOGNITION', CONSOLIDATION = 'CONSOLIDATION', APPLICATION = 'APPLICATION' }
interface Hero { id: string; name: string; type: string; color: string; gender: 'M'|'F'|'N'; description: string; }
interface Level { id: string; worldId: number; stageNum: number; words: Word[]; }

/** ========================================================================
 *  2. CONSTANTS (数据字典)
 *  ======================================================================== */
const WORLDS = [
  { id: 1, name: "Ancient Valley (Unit 1)", theme: "emerald" },
  { id: 2, name: "Cozy Sanctuary (Unit 2)", theme: "amber" },
  { id: 3, name: "Social Plaza (Unit 3)", theme: "blue" },
  { id: 4, name: "Adventure Peak (Unit 4)", theme: "purple" },
  { id: 5, name: "Health Canyon (Unit 5)", theme: "indigo" },
  { id: 6, name: "Future City (Unit 6)", theme: "cyan" },
  { id: 7, name: "Gourmet Island (Unit 7)", theme: "rose" },
  { id: 8, name: "Wisdom Temple (Unit 8)", theme: "orange" }
];

const RAW_WORDS: Record<number, Word[]> = {
  1: [
    { id: 'u1-1', english: 'ancient', chinese: '古代的', pos: 'adj', example: 'This is an ancient building.', exampleChinese: '这是一座古老的建筑。' },
    { id: 'u1-2', english: 'camp', chinese: '营地', pos: 'n', example: 'We stay at the camp.', exampleChinese: '我们呆在营地里。' },
    { id: 'u1-3', english: 'landscape', chinese: '风景', pos: 'n', example: 'The landscape is beautiful.', exampleChinese: '这里的景色非常美丽。' },
    { id: 'u1-4', english: 'strange', chinese: '奇怪的', pos: 'adj', example: 'That is a strange bird.', exampleChinese: '那是一只奇怪的鸟。' },
    { id: 'u1-5', english: 'vacation', chinese: '假期', pos: 'n', example: 'I like my summer vacation.', exampleChinese: '我喜欢我的暑假。' },
    { id: 'u1-6', english: 'fantastic', chinese: '极好的', pos: 'adj', example: 'We had a fantastic time.', exampleChinese: '我们度过了一段极好的时光。' },
    { id: 'u1-7', english: 'town', chinese: '城镇', pos: 'n', example: 'My town is very small.', exampleChinese: '我的城镇非常小。' },
    { id: 'u1-8', english: 'comfortable', chinese: '舒适的', pos: 'adj', example: 'This sofa is comfortable.', exampleChinese: '这张沙发很舒适。' }
  ],
  2: [
    { id: 'u2-1', english: 'pack', chinese: '打包', pos: 'v', example: 'Pack your bags.', exampleChinese: '打包你的行李。' },
    { id: 'u2-2', english: 'bathroom', chinese: '浴室', pos: 'n', example: 'The bathroom is clean.', exampleChinese: '浴室很干净。' }
  ]
};

const WORLD_COLORS: Record<number, string> = {
  1: 'bg-emerald-500', 2: 'bg-amber-500', 3: 'bg-blue-500', 4: 'bg-purple-500', 
  5: 'bg-indigo-500', 6: 'bg-cyan-500', 7: 'bg-rose-500', 8: 'bg-orange-500'
};

const HEROES: Hero[] = [
  { id: 'h1', name: 'Princess Sky', type: 'Wind', color: 'bg-emerald-500', gender: 'F', description: '灵动如风，探索未知的词汇秘境。' },
  { id: 'h2', name: 'Prince Valiant', type: 'Fire', color: 'bg-red-500', gender: 'M', description: '勇敢的守护者，用魔法卷轴击碎障碍。' },
  { id: 'h3', name: 'Little Red', type: 'Night', color: 'bg-indigo-700', gender: 'F', description: '漫步在单词森林的暗影使者。' },
  { id: 'h4', name: 'Princess Ivy', type: 'Earth', color: 'bg-blue-600', gender: 'F', description: '稳重如土，深扎根基的智慧化身。' },
];

/** ========================================================================
 *  3. STORAGE SERVICE (存储服务)
 *  ======================================================================== */
const storageService = {
  async getUser(userId: string): Promise<User | null> {
    const data = JSON.parse(localStorage.getItem('PIXEL_WORD_APP_DATA') || '{}');
    return data[userId] || null;
  },
  async saveUser(user: User): Promise<void> {
    const data = JSON.parse(localStorage.getItem('PIXEL_WORD_APP_DATA') || '{}');
    data[user.userId] = user;
    localStorage.setItem('PIXEL_WORD_APP_DATA', JSON.stringify(data));
  }
};

/** ========================================================================
 *  4. UI COMPONENTS (基础组件)
 *  ======================================================================== */
const PixelCard: React.FC<{children: React.ReactNode, className?: string, onClick?: () => void}> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white border-4 border-black p-4 relative ${onClick ? 'cursor-pointer hover:bg-gray-100 active:translate-y-1' : ''} ${className}`} style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
    <div className="absolute top-0 left-0 w-2 h-2 bg-black opacity-10" />
    <div className="absolute bottom-0 right-0 w-2 h-2 bg-black opacity-10" />
    {children}
  </div>
);

const PixelSprite: React.FC<{type: 'hero'|'monster', color: string, action?: string, size?: string, variant?: string}> = ({ type, color, size = 'md', action = 'idle', variant }) => {
  const isHit = action === 'hit';
  const isAttack = action === 'attack';
  return (
    <div className={`relative ${size === 'lg' ? 'w-44 h-48' : 'w-28 h-32'} flex items-end justify-center transition-all duration-300 ${isAttack ? (type === 'hero' ? 'translate-x-12' : '-translate-x-12') : ''} ${isHit ? 'animate-bounce grayscale' : 'animate-pulse'}`}>
       <svg width="100%" height="100%" viewBox="0 0 100 120">
         <circle cx="50" cy="40" r="30" fill={color.includes('bg-') ? '#ffe0b2' : color} stroke="black" strokeWidth="4" />
         <rect x="30" y="70" width="40" height="40" fill={color.replace('bg-', '')} stroke="black" strokeWidth="4" />
         <circle cx="40" cy="40" r="4" fill="black" />
         <circle cx="60" cy="40" r="4" fill="black" />
         <path d="M40,55 Q50,60 60,55" fill="none" stroke="black" strokeWidth="3" />
       </svg>
    </div>
  );
};

const BattleView: React.FC<{hero: Hero, monsterType: number, heroAction: string, monsterAction: string}> = ({ hero, monsterType, heroAction, monsterAction }) => (
  <div className="w-full h-52 rounded-[30px] mb-2 relative overflow-hidden border-4 border-indigo-900 flex items-end justify-between px-12 pb-6 bg-gradient-to-b from-sky-400 to-green-400 shadow-inner">
      <PixelSprite type="hero" color={hero.color} variant={hero.id} action={heroAction} />
      <PixelSprite type="monster" color={monsterType === 1 ? "bg-green-600" : "bg-red-600"} action={monsterAction} />
  </div>
);

/** ========================================================================
 *  5. GAME STAGES (关卡逻辑)
 *  ======================================================================== */
const StageOne: React.FC<{words: Word[], worldId: number, hero: Hero, onComplete: () => void, onProgress: (i:number)=>void}> = ({ words, worldId, hero, onComplete, onProgress }) => {
  const [idx, setIdx] = useState(0);
  const word = words[idx];
  useEffect(() => { onProgress(idx); }, [idx]);
  
  const next = () => {
    if (idx + 1 < words.length) setIdx(idx + 1);
    else onComplete();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <BattleView hero={hero} monsterType={1} heroAction="idle" monsterAction="idle" />
      <div className="flex flex-col items-center gap-6">
        <div className="text-7xl font-black text-black uppercase tracking-widest">{word.english}</div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
          <PixelCard onClick={next} className="text-2xl font-black text-center py-6">{word.chinese}</PixelCard>
          <PixelCard onClick={()=>{}} className="text-2xl font-black text-center py-6">干扰项A</PixelCard>
        </div>
      </div>
    </div>
  );
};

/** ========================================================================
 *  6. MAP VIEW (地图视图)
 *  ======================================================================== */
const MapView: React.FC<{user: User, onSelect: (w:number, s:number)=>void}> = ({ user, onSelect }) => (
  <div className="flex flex-col items-center p-8 overflow-y-auto h-screen bg-sky-100">
    <h1 className="text-3xl font-black text-indigo-900 uppercase mb-8">Adventure Map</h1>
    <div className="grid grid-cols-1 gap-10 w-full max-w-2xl">
      {WORLDS.map(w => (
        <div key={w.id} className="bg-white/60 p-6 rounded-3xl border-4 border-white shadow-sm">
          <div className="font-black mb-4 uppercase text-indigo-800">{w.name}</div>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(s => (
              <button key={s} onClick={() => onSelect(w.id, s)} className="w-12 h-12 bg-white border-2 border-black rounded-xl font-black hover:scale-110 active:scale-95 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** ========================================================================
 *  7. MAIN APP (主应用)
 *  ======================================================================== */
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const [gameState, setGameState] = useState<'LOGIN'|'HERO'|'MAP'|'GAME'|'WIN'>('LOGIN');
  const [userId, setUserId] = useState('');
  const [currentLevelWords, setCurrentLevelWords] = useState<Word[]>([]);

  const handleLogin = async () => {
    if (!userId.trim()) return;
    let u = await storageService.getUser(userId);
    if (!u) u = { userId, unlockedLevels: ['w1-s1'], stars: {}, mistakes: [], lastStudyTime: Date.now() };
    setUser(u); setGameState('HERO');
  };

  const start = (w:number, s:number) => {
    const pool = RAW_WORDS[w] || RAW_WORDS[1];
    setCurrentLevelWords(pool); setGameState('GAME');
  };

  if (gameState === 'LOGIN') return (
    <div className="h-screen bg-indigo-900 flex flex-col items-center justify-center p-8">
      <div className="bg-white p-12 border-8 border-black shadow-[12px_12px_0_rgba(0,0,0,0.5)] flex flex-col gap-6">
        <h1 className="text-4xl font-black text-black text-center uppercase">Word Kingdom</h1>
        <input value={userId} onChange={e=>setUserId(e.target.value)} className="border-4 border-black p-4 text-2xl font-black outline-none" placeholder="USER ID..." />
        <button onClick={handleLogin} className="bg-yellow-400 border-4 border-black p-4 text-2xl font-black uppercase hover:bg-yellow-300">Start Adventure</button>
      </div>
    </div>
  );

  if (gameState === 'HERO') return (
    <div className="h-screen bg-indigo-950 p-8 flex flex-col items-center">
      <h2 className="text-3xl font-black text-white uppercase mb-12">Choose Your Hero</h2>
      <div className="flex gap-8">
        {HEROES.map(h => (
          <PixelCard key={h.id} onClick={()=>{setHero(h); setGameState('MAP');}} className="p-8 flex flex-col items-center gap-4 hover:bg-yellow-100">
            <PixelSprite type="hero" color={h.color} size="lg" />
            <div className="font-black text-xl">{h.name}</div>
          </PixelCard>
        ))}
      </div>
    </div>
  );

  if (gameState === 'MAP' && user) return <MapView user={user} onSelect={start} />;

  if (gameState === 'GAME' && hero) return (
    <div className="h-screen flex flex-col bg-white">
      <div className="h-16 border-b-4 border-black flex items-center px-8 justify-between bg-indigo-50">
        <button onClick={()=>setGameState('MAP')} className="font-black text-red-600">QUIT</button>
        <div className="font-black uppercase">Level In Progress</div>
      </div>
      <div className="flex-1 p-6 overflow-hidden">
        <StageOne words={currentLevelWords} worldId={1} hero={hero} onComplete={()=>setGameState('MAP')} onProgress={()=>{}} />
      </div>
    </div>
  );

  return null;
};

// 挂载
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
  window.dispatchEvent(new Event('game-ready'));
}
