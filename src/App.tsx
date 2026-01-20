
import React, { useState, useEffect, useRef } from 'react';
import { User, Word, GameStageType, Level, Hero, LeaderboardEntry } from './types';
import { storageService } from './services/storageService';
import { RAW_WORDS, WORLDS } from './constants';
import { MapView } from './components/MapView';
import { StageOne } from './components/StageOne';
import { StageTwo } from './components/StageTwo';
import { StageThree } from './components/StageThree';
import { PixelCard } from './components/PixelCard';
import { PixelSprite } from './components/PixelSprite';

const HEROES: Hero[] = [
  { id: 'h1', name: 'Princess Sky', type: 'Wind', color: 'bg-emerald-500', gender: 'F', description: 'Curious and light on her feet.' },
  { id: 'h2', name: 'Prince Valiant', type: 'Fire', color: 'bg-red-500', gender: 'M', description: 'Brave guardian of the scrolls.' },
  { id: 'h3', name: 'Little Red', type: 'Night', color: 'bg-indigo-700', gender: 'F', description: 'Wandering through word forests.' },
  { id: 'h4', name: 'Princess Ivy', type: 'Earth', color: 'bg-blue-600', gender: 'F', description: 'Strong roots and steady wisdom.' },
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const bgmUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"; 
    const audio = new Audio(bgmUrl);
    audio.loop = true;
    audio.volume = 0.005; 
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
      setIsMuted(!isMuted);
    }
  };

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

  const manualSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await storageService.saveUser({ ...user, lastStudyTime: Date.now() });
    setTimeout(() => setIsSaving(false), 1500);
  };

  const openLeaderboard = async () => {
    const data = await storageService.getLeaderboard();
    setLeaderboard(data);
    setGameState('LEADERBOARD');
  };

  const logMistake = async (word: Word) => {
    if (!user) return;
    const newMistake = {
      wordId: word.id,
      type: gameSubStage,
      timestamp: Date.now()
    };
    const updatedUser: User = {
      ...user,
      mistakes: [...user.mistakes, newMistake]
    };
    setUser(updatedUser);
    await storageService.saveUser(updatedUser);
  };

  const startLevel = (worldId: number, stageNum: number) => {
    const pool = RAW_WORDS[worldId] || [];
    const startIndex = (stageNum - 1) * 8;
    const stagePool = pool.slice(startIndex, startIndex + 8);
    
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

  const handleGlobalExit = () => {
    if (gameState === 'GAME') {
      setGameState('MAP');
    } else {
      setUser(null);
      setGameState('LOGIN');
    }
  };

  if (gameState === 'LOGIN') {
    return (
      <div className="h-screen bg-sky flex flex-col items-center justify-center gap-12 p-8 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-40 h-16 bg-white rounded-full opacity-60 floating" />
        <div className="absolute top-40 right-20 w-32 h-12 bg-white rounded-full opacity-40 floating" style={{ animationDelay: '1s' }} />
        
        <h1 className="text-6xl text-indigo-900 text-center font-black tracking-tighter uppercase drop-shadow-xl animate-[wiggle_4s_infinite]">Kingdom of Words</h1>
        <div className="bg-white p-10 pixel-border flex flex-col gap-6 w-full max-w-md shadow-2xl">
          <label className="text-sm text-indigo-900 font-bold uppercase tracking-wider">State your Identity, Hero:</label>
          <input type="text" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)}
            className="border-4 border-indigo-100 p-4 text-indigo-900 text-2xl outline-none font-bold rounded-xl focus:border-indigo-500 transition-colors" placeholder="Enter your ID..." />
          <button onClick={handleLogin} className="pixel-button py-6 mt-4 uppercase text-2xl">Start Adventure</button>
          <button onClick={openLeaderboard} className="text-indigo-400 font-black uppercase text-sm hover:text-indigo-600 transition-colors mt-2">View Hall of Fame</button>
        </div>
      </div>
    );
  }

  if (gameState === 'LEADERBOARD') {
    return (
      <div className="h-screen bg-indigo-950 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white p-10 border-8 border-black rounded-[40px] shadow-2xl">
          <h2 className="text-4xl font-black text-indigo-900 mb-8 uppercase text-center">Hall of Fame</h2>
          <div className="flex flex-col gap-4 mb-10 max-h-96 overflow-y-auto pr-4 scrollbar-hide">
             {leaderboard.length === 0 ? (
               <div className="text-center text-slate-400 font-bold py-10">No heroes recorded yet.</div>
             ) : (
               leaderboard.map((entry, idx) => (
                 <div key={entry.userId} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${entry.userId === user?.userId ? 'bg-yellow-50 border-yellow-400' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex items-center gap-4">
                      <span className="w-10 h-10 flex items-center justify-center bg-indigo-900 text-white rounded-full font-black">#{idx + 1}</span>
                      <span className="font-black text-xl text-slate-800">{entry.userId}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-indigo-600">{entry.totalStars}</span>
                      <span className="text-yellow-400 text-xl">★</span>
                   </div>
                 </div>
               ))
             )}
          </div>
          <button onClick={() => setGameState(user ? 'MAP' : 'LOGIN')} className="pixel-button w-full py-5 text-xl uppercase">Back to Quest</button>
        </div>
      </div>
    );
  }

  if (gameState === 'HERO_SELECT') {
    return (
      <div className="h-screen bg-indigo-950 text-white p-8 flex flex-col items-center justify-center overflow-y-auto">
        <h2 className="text-5xl font-black mb-16 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-300">Choose your Hero</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
          {HEROES.map(h => (
            <PixelCard key={h.id} onClick={() => { setSelectedHero(h); setGameState('STORY'); }}
              className={`p-10 flex flex-col items-center text-center gap-6 transition-all hover:scale-105 active:scale-95 group rounded-[40px] ${selectedHero?.id === h.id ? 'ring-8 ring-indigo-400' : ''}`}>
              <div className="h-48 flex items-center justify-center">
                <PixelSprite type="hero" color={h.color} variant={h.id} size="lg" />
              </div>
              <div className="text-indigo-900 font-black uppercase text-2xl mt-4">{h.name}</div>
              <div className="text-sm text-slate-500 font-bold leading-tight uppercase tracking-wide">{h.description}</div>
              <div className="bg-indigo-900 text-white px-4 py-1 rounded-full text-xs font-black uppercase">{h.type} Power</div>
            </PixelCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-white">
      <div className="absolute top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b-4 border-indigo-900 z-40 flex items-center px-8 justify-between">
         <div className="flex items-center gap-4">
            {selectedHero && (
               <div className="relative">
                  <div className={`w-12 h-12 ${selectedHero.color} border-4 border-indigo-900 rounded-2xl shadow-sm`} />
                  <div className="absolute -top-2 -right-2 text-lg">✨</div>
               </div>
            )}
            <div className="text-indigo-900 font-black uppercase text-lg hidden md:block">
               {user?.userId}
            </div>
         </div>

         {gameState === 'GAME' && (
           <div className="flex-1 max-w-2xl mx-12 flex flex-col items-center">
              <div className="w-full h-10 bg-indigo-50 border-4 border-indigo-900 rounded-full overflow-hidden relative shadow-inner">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700 ease-out" style={{ width: `${(currentQuestionIdx / 24) * 100}%` }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className="text-xs font-black text-indigo-900 uppercase tracking-[0.3em] drop-shadow-sm">
                      QUEST PROGRESS: {Math.floor((currentQuestionIdx/24)*100)}%
                   </span>
                </div>
              </div>
           </div>
         )}

         <div className="flex items-center gap-4">
            {gameState === 'MAP' && (
              <button onClick={manualSave} className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 font-black uppercase text-xs transition-all ${isSaving ? 'bg-green-100 border-green-500 text-green-600' : 'bg-white border-indigo-500 text-indigo-600 hover:bg-indigo-50'}`}>
                {isSaving ? 'Progress Saved! ✨' : 'Save Progress'}
              </button>
            )}
            <button onClick={openLeaderboard} className="p-3 bg-indigo-50 rounded-2xl border-2 border-indigo-200 hover:bg-indigo-100 transition-colors">
               🏆
            </button>
            <button onClick={toggleMute} className="bg-indigo-50 p-3 rounded-2xl border-2 border-indigo-200 hover:bg-indigo-100 transition-colors">
               {isMuted ? (
                 <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
               ) : (
                 <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
               )}
            </button>
            <button onClick={handleGlobalExit} className={`text-xs px-5 py-2 rounded-full border-2 font-black uppercase transition-colors ${gameState === 'GAME' ? 'text-orange-600 bg-orange-50 border-orange-500 hover:bg-orange-100' : 'text-red-600 bg-red-50 border-red-500 hover:bg-red-100'}`}>
              {gameState === 'GAME' ? 'Quit Mission' : 'Logout Hero'}
            </button>
         </div>
      </div>

      <div className="mt-20 flex-1 flex flex-col overflow-hidden relative">
        {gameState === 'STORY' && (
          <div className="h-full bg-indigo-950 text-white p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
            <div className="max-w-2xl bg-white/5 p-12 rounded-[60px] border-4 border-white/10 backdrop-blur-lg">
              <h3 className="text-4xl font-black mb-10 text-indigo-300 uppercase tracking-widest">The Prophecy of Words</h3>
              <p className="text-2xl leading-relaxed mb-16 font-medium text-slate-300">
                The Kingdom of Wisdom is fading into a mist of silence.<br/><br/>
                Only the <span className="text-yellow-400 font-black">{selectedHero?.name}</span> can master the ancient lexicons to unlock the sacred gates.<br/><br/>
                Collect stars to illuminate the path forward.
              </p>
              <button onClick={() => setGameState('MAP')} className="pixel-button bg-indigo-500 border-indigo-700 px-16 py-6 font-black uppercase text-2xl">I accept the Quest</button>
            </div>
          </div>
        )}

        {gameState === 'MAP' && user && <MapView user={user} onSelectLevel={startLevel} />}

        {gameState === 'GAME' && currentLevel && selectedHero && (
          <div className="h-full bg-white p-4 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 relative">
              {gameSubStage === GameStageType.RECOGNITION && (
                <StageOne words={levelWords.recognition} worldId={currentLevel.worldId} hero={selectedHero}
                  onComplete={() => { setGameSubStage(GameStageType.CONSOLIDATION); }}
                  onMistake={logMistake} onFail={() => setGameState('FAIL')}
                  onProgress={(idx) => setCurrentQuestionIdx(idx)}
                />
              )}
              {gameSubStage === GameStageType.CONSOLIDATION && (
                <StageTwo words={levelWords.consolidation} hero={selectedHero}
                  onComplete={() => { setGameSubStage(GameStageType.APPLICATION); }}
                  onMistake={logMistake} onFail={() => setGameState('FAIL')}
                  onProgress={(idx) => setCurrentQuestionIdx(8 + idx)}
                />
              )}
              {gameSubStage === GameStageType.APPLICATION && (
                <StageThree words={levelWords.application} hero={selectedHero}
                  onComplete={onLevelComplete} onFail={() => setGameState('FAIL')}
                  onProgress={(idx) => setCurrentQuestionIdx(16 + idx)}
                />
              )}
            </div>
          </div>
        )}

        {gameState === 'WIN' && selectedHero && (
          <div className="h-full bg-indigo-900 flex flex-col items-center justify-center p-8 text-center text-white overflow-y-auto">
            <h2 className="text-7xl mb-12 animate-bounce font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-200">Victory!</h2>
            
            <div className="relative mb-20">
               <div className="absolute inset-0 bg-yellow-400 blur-[120px] opacity-40 rounded-full animate-pulse" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="mb-[-10px] animate-[wiggle_2s_infinite] text-6xl">✨</div>
                  <PixelSprite type="hero" color={selectedHero.color} variant={selectedHero.id} size="lg" />
                  <div className="absolute -bottom-12 bg-white text-indigo-900 px-10 py-3 rounded-full border-4 border-indigo-900 font-black text-xl uppercase tracking-widest shadow-2xl">
                    Noble {selectedHero.name}
                  </div>
               </div>
            </div>

            <div className="bg-white/10 p-10 rounded-[40px] border-2 border-white/20 backdrop-blur-md mb-12 w-full max-w-md">
              <div className="text-2xl font-black mb-6 uppercase tracking-widest opacity-80">Light Restored</div>
              <div className="text-8xl flex justify-center mb-6 gap-4">
                {[1, 2, 3].map(i => <span key={i} className={`drop-shadow-lg transition-transform hover:scale-125 ${i <= lastLevelStars ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>)}
              </div>
              <div className="text-xl font-black uppercase tracking-[0.3em] text-indigo-300">
                Rank: {lastLevelStars === 3 ? 'LEGEND' : lastLevelStars === 2 ? 'HERO' : 'NOVICE'}
              </div>
            </div>
            
            <div className="flex gap-8 pb-10">
               <button onClick={() => setGameState('MAP')} className="pixel-button bg-white text-indigo-900 px-16 py-6 font-black text-2xl uppercase shadow-xl hover:scale-105 transition-all">World Map</button>
               <button onClick={() => { if (currentLevel) { if (currentLevel.stageNum < 4) startLevel(currentLevel.worldId, currentLevel.stageNum + 1); else if (currentLevel.worldId < WORLDS.length) startLevel(currentLevel.worldId + 1, 1); else setGameState('MAP'); } else { setGameState('MAP'); } }} 
                className="pixel-button bg-yellow-400 text-indigo-900 px-16 py-6 text-2xl font-black uppercase shadow-xl hover:scale-105 transition-all">Next Realm</button>
            </div>
          </div>
        )}

        {gameState === 'FAIL' && (
          <div className="h-full bg-indigo-950 flex flex-col items-center justify-center p-12 text-center text-white font-bold uppercase overflow-y-auto">
            <div className="text-9xl mb-8 animate-pulse drop-shadow-[0_0_50px_rgba(255,0,0,0.4)]">🥀</div>
            <h2 className="text-6xl mb-10 font-black text-red-400 tracking-tighter">Mist has Taken you</h2>
            <p className="text-2xl mb-16 max-w-xl leading-relaxed opacity-70 font-medium">
              The ancient words proved too elusive... <br/>
              The Hero must meditate on the scrolls <br/>
              before attempting this gate once more.
            </p>
            <div className="flex gap-10 pb-10">
              <button onClick={() => setGameState('MAP')} className="pixel-button bg-slate-800 text-white border-slate-900 px-12 py-5 text-2xl font-black uppercase">Retreat</button>
              <button onClick={() => { if (currentLevel) startLevel(currentLevel.worldId, currentLevel.stageNum); }} className="pixel-button bg-indigo-500 text-white px-12 py-5 text-2xl font-black uppercase">Re-Summon</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
