
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// ==========================================
// 1. 类型定义
// ==========================================
interface Word { id: string; english: string; chinese: string; pos: string; example: string; exampleChinese?: string; }
interface Hero { id: string; name: string; type: string; color: string; description: string; }
interface User { userId: string; unlockedLevels: string[]; stars: Record<string, number>; mistakes: any[]; lastStudyTime: number; }
enum GameStageType { RECOGNITION = 'RECOGNITION', CONSOLIDATION = 'CONSOLIDATION', APPLICATION = 'APPLICATION' }

// ==========================================
// 2. 常量与单词数据 (全 8 单元)
// ==========================================
const HEROES: Hero[] = [
  { id: 'h1', name: 'Princess Sky', type: 'Wind', color: 'bg-emerald-500', description: 'Curious and light on her feet.' },
  { id: 'h2', name: 'Prince Valiant', type: 'Fire', color: 'bg-red-500', description: 'Brave guardian of the scrolls.' },
  { id: 'h3', name: 'Little Red', type: 'Night', color: 'bg-indigo-700', description: 'Wandering through word forests.' },
  { id: 'h4', name: 'Princess Ivy', type: 'Earth', color: 'bg-blue-600', description: 'Strong roots and steady wisdom.' },
];

const WORLDS = [
  { id: 1, name: "Ancient Valley (Unit 1)", color: "bg-emerald-500" },
  { id: 2, name: "Cozy Sanctuary (Unit 2)", color: "bg-amber-500" },
  { id: 3, name: "Social Plaza (Unit 3)", color: "bg-blue-500" },
  { id: 4, name: "Adventure Peak (Unit 4)", color: "bg-purple-500" },
  { id: 5, name: "Health Canyon (Unit 5)", color: "bg-indigo-500" },
  { id: 6, name: "Future City (Unit 6)", color: "bg-cyan-500" },
  { id: 7, name: "Gourmet Island (Unit 7)", color: "bg-rose-500" },
  { id: 8, name: "Wisdom Temple (Unit 8)", color: "bg-orange-500" }
];

// 缩减版展示数据，实际可按此结构扩充
const RAW_WORDS_DATA: Record<number, Word[]> = {
  1: [
    { id: 'u1-1', english: 'ancient', chinese: '古代的', pos: 'adj', example: 'This is an ancient building.', exampleChinese: '这是一座古老的建筑。' },
    { id: 'u1-2', english: 'landscape', chinese: '风景', pos: 'n', example: 'The landscape is beautiful.', exampleChinese: '这里的景色非常美丽。' },
    { id: 'u1-3', english: 'fantastic', chinese: '极好的', pos: 'adj', example: 'We had a fantastic time.' },
    { id: 'u1-4', english: 'comfortable', chinese: '舒适的', pos: 'adj', example: 'This sofa is comfortable.' },
    { id: 'u1-5', english: 'experience', chinese: '经验', pos: 'n', example: 'It was a great experience.' },
    { id: 'u1-6', english: 'activity', chinese: '活动', pos: 'n', example: 'This is a fun activity.' },
    { id: 'u1-7', english: 'popular', chinese: '流行的', pos: 'adj', example: 'Football is popular.' },
    { id: 'u1-8', english: 'history', chinese: '历史', pos: 'n', example: 'China has long history.' }
  ],
  2: [
    { id: 'u2-1', english: 'furniture', chinese: '家具', pos: 'n', example: 'We bought new furniture.' },
    { id: 'u2-2', english: 'apartment', chinese: '公寓', pos: 'n', example: 'I live in an apartment.' },
    { id: 'u2-3', english: 'decorate', chinese: '装饰', pos: 'v', example: 'Decorate the tree.' },
    { id: 'u2-4', english: 'neighbor', chinese: '邻居', pos: 'n', example: 'He is my neighbor.' }
  ]
};

// ==========================================
// 3. 基础组件
// ==========================================
const PixelCard = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white border-4 border-black p-4 relative ${onClick ? 'cursor-pointer hover:bg-gray-100 active:translate-y-1' : ''} ${className}`} style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
    {children}
  </div>
);

const PixelSprite = ({ type, variant, action = 'idle', size = 'md' }: any) => {
  const isHero = type === 'hero';
  const isHit = action === 'hit';
  const isAttack = action === 'attack';
  
  const icon = isHero ? (variant === 'h1' ? '🧙‍♀️' : variant === 'h2' ? '🛡️' : variant === 'h3' ? '🎒' : '🌿') : '👾';
  const sizeClass = size === 'lg' ? 'text-8xl' : size === 'md' ? 'text-6xl' : 'text-4xl';

  return (
    <div className={`transition-all duration-300 ${sizeClass} ${isHit ? 'animate-bounce grayscale' : 'animate-pulse'} ${isAttack ? (isHero ? 'translate-x-12' : '-translate-x-12') : ''}`}>
      {icon}
    </div>
  );
};

const BattleView = ({ hero, heroAction, monsterAction, monsterType = 1 }: any) => (
  <div className="w-full h-52 bg-sky border-4 border-indigo-900 rounded-[2rem] flex items-end justify-between px-12 pb-6 relative overflow-hidden shadow-inner mb-4">
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-green-500/40 rounded-t-full border-t-2 border-green-700" />
    <PixelSprite type="hero" variant={hero.id} action={heroAction} size="md" />
    <div className="text-4xl animate-ping opacity-20">💥</div>
    <PixelSprite type="monster" action={monsterAction} size="md" />
  </div>
);

// ==========================================
// 4. 关卡阶段组件
// ==========================================

// 第一阶段：认读
const StageOne = ({ words, hero, onComplete, onMistake }: any) => {
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const word = words[idx];

  useEffect(() => {
    if (!word) return;
    const distractors = ["电脑", "音乐", "西瓜", "飞船"].filter(d => d !== word.chinese).sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([...distractors, word.chinese].sort(() => Math.random() - 0.5));
  }, [idx]);

  const handleSelect = (choice: string) => {
    if (choice === word.chinese) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback(null);
        if (idx + 1 < words.length) setIdx(i => i + 1); else onComplete();
      }, 600);
    } else {
      setFeedback('wrong');
      onMistake(word);
      setTimeout(() => setFeedback(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <BattleView hero={hero} heroAction={feedback === 'correct' ? 'attack' : 'idle'} monsterAction={feedback === 'wrong' ? 'attack' : 'idle'} />
      <div className="text-7xl font-black uppercase text-indigo-900 mb-8 tracking-tighter">{word?.english}</div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        {options.map((opt, i) => (
          <PixelCard key={i} onClick={() => handleSelect(opt)} className="text-center py-6 text-2xl font-black">{opt}</PixelCard>
        ))}
      </div>
    </div>
  );
};

// 第二阶段：拼写与词性 (简化版展示逻辑)
const StageTwo = ({ words, hero, onComplete, onMistake }: any) => {
  const [idx, setIdx] = useState(0);
  const word = words[idx];
  const [input, setInput] = useState('');

  const check = () => {
    if (input.toLowerCase() === word.english.toLowerCase()) {
      if (idx + 1 < words.length) { setIdx(i => i + 1); setInput(''); } else onComplete();
    } else {
      onMistake(word);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <BattleView hero={hero} />
      <div className="text-4xl font-black text-slate-800 mb-4">{word?.chinese}</div>
      <div className="flex gap-2 mb-8">
        <input value={input} onChange={e => setInput(e.target.value)} className="border-4 border-black p-4 text-3xl font-black w-64 text-center rounded-xl" placeholder="..." />
        <button onClick={check} className="pixel-button">GO!</button>
      </div>
    </div>
  );
};

// 第三阶段：句子构造
const StageThree = ({ words, hero, onComplete }: any) => {
  const [idx, setIdx] = useState(0);
  const word = words[idx];
  const sentence = word?.example || "I like English.";
  const parts = useMemo(() => sentence.replace(/[.!?]/g, '').split(' ').sort(() => Math.random() - 0.5), [idx]);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (p: string) => {
    if (selected.includes(p)) setSelected(s => s.filter(x => x !== p));
    else setSelected(s => [...s, p]);
  };

  const finish = () => {
    if (selected.join(' ').toLowerCase() === sentence.replace(/[.!?]/g, '').toLowerCase()) {
      if (idx + 1 < words.length) { setIdx(i => i + 1); setSelected([]); } else onComplete(3);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <BattleView hero={hero} />
      <div className="text-2xl font-black mb-8">"{word?.exampleChinese || '请构造句子'}"</div>
      <div className="flex flex-wrap gap-2 mb-8 min-h-[50px] border-b-4 border-dashed border-indigo-200 w-full justify-center">
        {selected.map((p, i) => <button key={i} onClick={() => toggle(p)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">{p}</button>)}
      </div>
      <div className="flex flex-wrap gap-2 mb-12">
        {parts.filter(p => !selected.includes(p)).map((p, i) => <button key={i} onClick={() => toggle(p)} className="bg-slate-100 border-2 border-black px-4 py-2 rounded-lg font-bold">{p}</button>)}
      </div>
      <button onClick={finish} className="pixel-button">Check Sentence</button>
    </div>
  );
};

// ==========================================
// 5. 主程序 App
// ==========================================
const App = () => {
  const [gameState, setGameState] = useState('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [userIdInput, setUserIdInput] = useState('');
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [currentLevel, setCurrentLevel] = useState<any>(null);
  const [gameSubStage, setGameSubStage] = useState<GameStageType>(GameStageType.RECOGNITION);

  useEffect(() => {
    window.dispatchEvent(new Event('game-ready'));
  }, []);

  const handleLogin = () => {
    if (!userIdInput.trim()) return;
    const saved = localStorage.getItem('PIXEL_KINGDOM_' + userIdInput);
    if (saved) {
      setUser(JSON.parse(saved));
    } else {
      const newUser = { userId: userIdInput, unlockedLevels: ['w1-s1'], stars: {}, mistakes: [], lastStudyTime: Date.now() };
      setUser(newUser);
      localStorage.setItem('PIXEL_KINGDOM_' + userIdInput, JSON.stringify(newUser));
    }
    setGameState('HERO_SELECT');
  };

  const startLevel = (worldId: number, stage: number) => {
    const words = RAW_WORDS_DATA[worldId] || RAW_WORDS_DATA[1];
    setCurrentLevel({ worldId, stage, words });
    setGameSubStage(GameStageType.RECOGNITION);
    setGameState('GAME');
  };

  if (gameState === 'LOGIN') return (
    <div className="h-screen bg-sky flex flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-black text-indigo-900 mb-12 animate-wiggle uppercase tracking-tighter">Kingdom of Words</h1>
      <PixelCard className="w-full max-w-md p-10">
        <label className="block mb-4 font-black uppercase text-sm">State your Identity, Hero:</label>
        <input value={userIdInput} onChange={e => setUserIdInput(e.target.value)} className="w-full border-4 border-indigo-100 p-4 text-2xl font-bold mb-6 rounded-xl" placeholder="Your ID..." />
        <button onClick={handleLogin} className="pixel-button w-full py-6 text-2xl">Start Adventure</button>
      </PixelCard>
    </div>
  );

  if (gameState === 'HERO_SELECT') return (
    <div className="h-screen bg-indigo-950 p-8 flex flex-col items-center justify-center">
      <h2 className="text-4xl font-black text-white mb-16 uppercase">Choose your Hero</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {HEROES.map(h => (
          <PixelCard key={h.id} onClick={() => { setSelectedHero(h); setGameState('MAP'); }} className="text-center group p-8">
            <PixelSprite type="hero" variant={h.id} size="lg" />
            <div className="font-black text-indigo-900 text-xl mt-4">{h.name}</div>
          </PixelCard>
        ))}
      </div>
    </div>
  );

  if (gameState === 'MAP') return (
    <div className="h-screen bg-sky p-8 flex flex-col items-center overflow-y-auto scrollbar-hide">
      <div className="flex justify-between w-full max-w-4xl mb-12 items-center">
        <h2 className="text-3xl font-black text-indigo-900 uppercase">The Map</h2>
        <div className="bg-white border-4 border-black px-6 py-2 rounded-full font-black text-indigo-900">
           ★ {Object.values(user?.stars || {}).reduce((a: any, b: any) => a + b, 0)} Collected
        </div>
      </div>
      <div className="flex flex-col gap-10 w-full max-w-4xl pb-20">
        {WORLDS.map(w => (
          <div key={w.id} className="bg-white/40 p-8 rounded-[40px] border-4 border-dashed border-white/60">
            <h3 className="font-black text-xl mb-6 flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${w.color}`} /> {w.name}
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3].map(s => (
                <PixelCard key={s} onClick={() => startLevel(w.id, s)} className="flex flex-col items-center py-6">
                  <span className="text-2xl mb-2">🏰</span>
                  <span className="text-[10px] font-black uppercase">Stage {s}</span>
                </PixelCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (gameState === 'GAME') return (
    <div className="h-screen bg-white p-4 overflow-hidden flex flex-col">
       <div className="h-14 border-b-4 border-indigo-900 flex items-center px-4 justify-between mb-4">
         <button onClick={() => setGameState('MAP')} className="text-red-500 font-black">EXIT</button>
         <div className="font-black text-indigo-900 uppercase">{gameSubStage} PHASE</div>
         <div className="w-10" />
       </div>
       <div className="flex-1 overflow-y-auto">
         {gameSubStage === GameStageType.RECOGNITION && <StageOne words={currentLevel.words} hero={selectedHero} onComplete={() => setGameSubStage(GameStageType.CONSOLIDATION)} onMistake={() => {}} />}
         {gameSubStage === GameStageType.CONSOLIDATION && <StageTwo words={currentLevel.words} hero={selectedHero} onComplete={() => setGameSubStage(GameStageType.APPLICATION)} onMistake={() => {}} />}
         {gameSubStage === GameStageType.APPLICATION && <StageThree words={currentLevel.words} hero={selectedHero} onComplete={(stars: number) => {
           const updated = { ...user!, stars: { ...user!.stars, [`w${currentLevel.worldId}-s${currentLevel.stage}`]: stars } };
           setUser(updated);
           localStorage.setItem('PIXEL_KINGDOM_' + updated.userId, JSON.stringify(updated));
           setGameState('WIN');
         }} />}
       </div>
    </div>
  );

  if (gameState === 'WIN') return (
    <div className="h-screen bg-indigo-900 flex flex-col items-center justify-center p-8 text-white">
      <div className="text-9xl mb-8 animate-bounce">🏆</div>
      <h2 className="text-6xl font-black mb-12">QUEST CLEAR!</h2>
      <button onClick={() => setGameState('MAP')} className="pixel-button bg-yellow-400 text-indigo-900 px-16 py-6 text-2xl">World Map</button>
    </div>
  );

  return null;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
