
import React, { useState, useEffect, useRef } from 'react';
import { User, Word, GameStageType, Level, Hero, LeaderboardEntry } from './types.ts';
import { storageService } from './services/storageService.ts';
import { RAW_WORDS, WORLDS } from './constants.tsx';
import { MapView } from './components/MapView.tsx';
import { StageOne } from './components/StageOne.tsx';
import { StageTwo } from './components/StageTwo.tsx';
import { StageThree } from './components/StageThree.tsx';
import { PixelCard } from './components/PixelCard.tsx';
import { PixelSprite } from './components/PixelSprite.tsx';

const HEROES: Hero[] = [
  { id: 'h1', name: 'Princess Sky', type: 'Wind', color: 'bg-emerald-500', gender: 'F', description: '灵动如风，探索未知的词汇秘境。' },
  { id: 'h2', name: 'Prince Valiant', type: 'Fire', color: 'bg-red-500', gender: 'M', description: '勇敢的守护者，用魔法卷轴击碎障碍。' },
  { id: 'h3', name: 'Little Red', type: 'Night', color: 'bg-indigo-700', gender: 'F', description: '漫步在单词森林的暗影使者。' },
  { id: 'h4', name: 'Princess Ivy', type: 'Earth', color: 'bg-blue-600', gender: 'F', description: '稳重如土，深扎根基的智慧化身。' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [levelWords, setLevelWords] = useState<{recognition: Word[], consolidation: Word[], application: Word[]}>({recognition: [], consolidation: [], application: []});
  const [lastLevelStars, setLastLevelStars] = useState(0);
  const [gameState, setGameState] = useState<'LOGIN' | 'HERO_SELECT' | 'MAP' | 'GAME' | 'STORY' | 'WIN' | 'FAIL' | 'LEADERBOARD'>('LOGIN');
  const [gameSubStage, setGameSubStage] = useState<GameStageType>(GameStageType.RECOGNITION);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userIdInput, setUserIdInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const bgmUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"; 
    const audio = new Audio(bgmUrl);
    audio.loop = true;
    audio.volume = 0.05; 
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const handleLogin = async () => {
    if (!userIdInput.trim()) return;
    if (audioRef.current && !isMuted) audioRef.current.play().catch(() => {});

    let existingUser = await storageService.getUser(userIdInput.trim());
    if (!existingUser) {
      existingUser = {
        userId: userIdInput.trim(),
        unlockedLevels: ['w1-s1'],
        stars: {},
        mistakes: [],
        lastStudyTime: Date.now()
      };
      await storageService.saveUser(existingUser);
    }
    setUser(existingUser);
    setGameState('HERO_SELECT');
  };

  const startLevel = (worldId: number, stageNum: number) => {
    const pool = RAW_WORDS[worldId] || [];
    const startIndex = (stageNum - 1) * 8;
    const stagePool = pool.slice(startIndex, startIndex + 8);
    
    if (stagePool.length === 0) {
      alert("关卡建设中！");
      return;
    }

    setLevelWords({ 
      recognition: [...stagePool].sort(() => 0.5 - Math.random()), 
      consolidation: [...stagePool].sort(() => 0.5 - Math.random()), 
      application: [...stagePool].sort(() => 0.5 - Math.random()) 
    });
    
    setCurrentLevel({ id: `w${worldId}-s${stageNum}`, worldId, stageNum, words: stagePool });
    setGameSubStage(GameStageType.RECOGNITION);
    setCurrentQuestionIdx(0);
    setGameState('GAME');
  };

  const onLevelComplete = async (stars: number) => {
    if (!user || !currentLevel) return;
    setLastLevelStars(stars);
    const newStars = { ...user.stars };
    newStars[currentLevel.id] = Math.max(stars, user.stars[currentLevel.id] || 0);

    const nextLevelNum = currentLevel.stageNum + 1;
    const nextLevelId = `w${currentLevel.worldId}-s${nextLevelNum}`;
    const newUnlocked = [...user.unlockedLevels];
    
    if (!newUnlocked.includes(nextLevelId) && nextLevelNum <= 4) {
      newUnlocked.push(nextLevelId);
    } else if (nextLevelNum > 4 && currentLevel.worldId < WORLDS.length) {
      const firstStageNextWorld = `w${currentLevel.worldId + 1}-s1`;
      if (!newUnlocked.includes(firstStageNextWorld)) newUnlocked.push(firstStageNextWorld);
    }

    const updatedUser: User = { ...user, stars: newStars, unlockedLevels: newUnlocked, lastStudyTime: Date.now() };
    setUser(updatedUser);
    await storageService.saveUser(updatedUser);
    setGameState('WIN');
  };

  // ... 渲染逻辑保持不变 ...
  if (gameState === 'LOGIN') {
    return (
      <div className="h-screen bg-sky flex flex-col items-center justify-center gap-12 p-8 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-40 h-16 bg-white rounded-full opacity-60 floating" />
        <div className="absolute top-40 right-20 w-32 h-12 bg-white rounded-full opacity-40 floating" style={{ animationDelay: '1s' }} />
        <h1 className="text-6xl text-indigo-900 text-center font-black tracking-tighter uppercase drop-shadow-xl animate-[wiggle_4s_infinite]">Kingdom of Words</h1>
        <div className="bg-white p-10 pixel-border flex flex-col gap-6 w-full max-w-md shadow-2xl">
          <label className="text-sm text-indigo-900 font-bold uppercase tracking-wider text-center">勇者，请留下你的身份印记：</label>
          <input type="text" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)}
            className="border-4 border-indigo-100 p-4 text-indigo-900 text-2xl outline-none font-bold rounded-xl focus:border-indigo-500 transition-colors" placeholder="输入 ID..." />
          <button onClick={handleLogin} className="pixel-button py-6 mt-4 uppercase text-2xl">开启冒险</button>
        </div>
      </div>
    );
  }

  if (gameState === 'HERO_SELECT') {
    return (
      <div className="h-screen bg-indigo-950 text-white p-8 flex flex-col items-center justify-center overflow-y-auto">
        <h2 className="text-5xl font-black mb-16 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-300">召唤你的守护勇者</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
          {HEROES.map(h => (
            <PixelCard key={h.id} onClick={() => { setSelectedHero(h); setGameState('STORY'); }}
              className={`p-10 flex flex-col items-center text-center gap-6 transition-all hover:scale-105 active:scale-95 group rounded-[40px] ${selectedHero?.id === h.id ? 'ring-8 ring-indigo-400' : ''}`}>
              <div className="h-48 flex items-center justify-center">
                <PixelSprite type="hero" color={h.color} variant={h.id} size="lg" />
              </div>
              <div className="text-indigo-900 font-black uppercase text-2xl mt-4">{h.name}</div>
              <div className="text-sm text-slate-500 font-bold leading-tight uppercase tracking-wide">{h.description}</div>
              <div className="bg-indigo-900 text-white px-4 py-1 rounded-full text-xs font-black uppercase mt-2">{h.type} Power</div>
            </PixelCard>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'STORY') {
    return (
      <div className="h-screen bg-indigo-950 text-white p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="max-w-2xl bg-white/5 p-12 rounded-[60px] border-4 border-white/10 backdrop-blur-lg floating">
          <h3 className="text-4xl font-black mb-10 text-indigo-300 uppercase tracking-widest">古老的词汇预言</h3>
          <p className="text-2xl leading-relaxed mb-16 font-medium text-slate-300">
            智慧王国的文字正在消逝...<br/><br/>
            唯有掌握“认读”、“拼写”与“运用”三位一体魔法的勇者，才能重新点亮智慧之塔。<br/><br/>
            <span className="text-yellow-400 font-black">{selectedHero?.name}</span>，你准备好继承卷轴了吗？
          </p>
          <button onClick={() => setGameState('MAP')} className="pixel-button bg-indigo-500 border-indigo-700 px-16 py-6 font-black uppercase text-2xl">我接受挑战</button>
        </div>
      </div>
    );
  }

  if (gameState === 'MAP' && user) {
    return (
      <div className="h-screen bg-white">
        <div className="h-20 bg-white/80 backdrop-blur-md border-b-4 border-indigo-900 flex items-center px-8 justify-between">
           <div className="text-indigo-900 font-black uppercase text-lg">{user.userId} 的冒险进度</div>
           <button onClick={() => setGameState('LOGIN')} className="text-red-600 bg-red-50 border-2 border-red-500 px-4 py-1 rounded-full font-black text-xs uppercase">登出</button>
        </div>
        <MapView user={user} onSelectLevel={startLevel} />
      </div>
    );
  }

  if (gameState === 'GAME' && currentLevel && selectedHero) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-white">
        <div className="h-20 border-b-4 border-indigo-900 flex items-center px-8 justify-between">
           <button onClick={() => setGameState('MAP')} className="text-orange-600 bg-orange-50 border-2 border-orange-500 px-5 py-2 rounded-full font-black text-xs uppercase">撤退</button>
           <div className="flex flex-col items-center flex-1 mx-8">
              <div className="w-full h-8 bg-indigo-50 border-4 border-indigo-900 rounded-full overflow-hidden relative">
                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${(currentQuestionIdx / 24) * 100}%` }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className="text-[10px] font-black text-indigo-900 uppercase">进度: {Math.floor((currentQuestionIdx/24)*100)}%</span>
                </div>
              </div>
           </div>
           <div className="font-black text-indigo-900 uppercase">{gameSubStage} 阶段</div>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {gameSubStage === GameStageType.RECOGNITION && <StageOne words={levelWords.recognition} worldId={currentLevel.worldId} hero={selectedHero} onComplete={() => setGameSubStage(GameStageType.CONSOLIDATION)} onMistake={() => {}} onFail={() => setGameState('FAIL')} onProgress={setCurrentQuestionIdx} />}
          {gameSubStage === GameStageType.CONSOLIDATION && <StageTwo words={levelWords.consolidation} hero={selectedHero} onComplete={() => setGameSubStage(GameStageType.APPLICATION)} onMistake={() => {}} onFail={() => setGameState('FAIL')} onProgress={(idx) => setCurrentQuestionIdx(8 + idx)} />}
          {gameSubStage === GameStageType.APPLICATION && <StageThree words={levelWords.application} hero={selectedHero} onComplete={onLevelComplete} onFail={() => setGameState('FAIL')} onProgress={(idx) => setCurrentQuestionIdx(16 + idx)} />}
        </div>
      </div>
    );
  }

  if (gameState === 'WIN' && selectedHero) {
    return (
      <div className="h-screen bg-indigo-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <h2 className="text-7xl mb-12 animate-bounce font-black uppercase text-yellow-400">大捷!</h2>
        <PixelSprite type="hero" color={selectedHero.color} variant={selectedHero.id} size="lg" />
        <div className="text-8xl flex justify-center my-12 gap-4">
          {[1, 2, 3].map(i => <span key={i} className={`${i <= lastLevelStars ? 'text-yellow-400' : 'text-gray-500'}`}>★</span>)}
        </div>
        <button onClick={() => setGameState('MAP')} className="pixel-button bg-yellow-400 text-indigo-900 px-16 py-6 font-black text-2xl uppercase">回到地图</button>
      </div>
    );
  }

  if (gameState === 'FAIL') {
    return (
      <div className="h-screen bg-indigo-950 flex flex-col items-center justify-center p-12 text-center text-white font-bold uppercase">
        <div className="text-9xl mb-8">🥀</div>
        <h2 className="text-6xl mb-10 font-black text-red-400">挑战失败</h2>
        <p className="text-2xl mb-16 opacity-70">词汇迷雾吞噬了你的神智，请休息后再来挑战。</p>
        <button onClick={() => setGameState('MAP')} className="pixel-button bg-slate-800 text-white border-slate-900 px-12 py-5 text-2xl font-black uppercase">回到王国</button>
      </div>
    );
  }

  return null;
};

export default App;
