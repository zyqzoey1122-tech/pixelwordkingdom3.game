
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Word, Hero } from '../types';
import { BattleView } from './BattleView';

interface StageThreeProps {
  words: Word[];
  hero: Hero;
  onComplete: (stars: number) => void;
  onFail: () => void;
  onProgress: (idx: number) => void;
}

/**
 * Stage 3: English Sentence Construction (Application).
 * The student sees a Chinese sentence and must arrange English word tiles into the correct order.
 */
export const StageThree: React.FC<StageThreeProps> = ({ words, hero, onComplete, onFail, onProgress }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tilePool, setTilePool] = useState<string[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [mistakesThisSentence, setMistakesThisSentence] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [heroAction, setHeroAction] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [monsterAction, setMonsterAction] = useState<'idle' | 'attack' | 'hit'>('idle');

  const currentWord = words[currentIdx];
  const chinesePrompt = currentWord.exampleChinese || currentWord.chinese;

  // Cleanup sentence for arrangement: Remove punctuation, split into words
  const correctEnglishSequence = useMemo(() => {
    return currentWord.example.replace(/[.!?]/g, '').trim().split(/\s+/);
  }, [currentWord]);

  useEffect(() => { onProgress(currentIdx); }, [currentIdx]);

  useEffect(() => {
    // Generate pool of English words plus some distractors
    const pool = [...correctEnglishSequence];
    // Generic distractors for sentence building
    const distractors = ["is", "the", "a", "not", "very", "too", "it", "they", "we", "he", "she"].filter(d => !pool.includes(d)).sort(() => 0.5 - Math.random()).slice(0, 3);
    
    setTilePool([...pool, ...distractors].sort(() => 0.5 - Math.random()));
    setSelectedTiles([]);
    setMistakesThisSentence(0);
  }, [currentIdx, correctEnglishSequence]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { onFail(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [onFail]);

  const toggleTile = (word: string, fromPool: boolean) => {
    if (fromPool) {
      setSelectedTiles([...selectedTiles, word]);
      setTilePool(prev => {
        const idx = prev.indexOf(word);
        const next = [...prev]; next.splice(idx, 1);
        return next;
      });
    } else {
      setTilePool(prev => [...prev, word]);
      setSelectedTiles(prev => {
        const idx = prev.indexOf(word);
        const next = [...prev]; next.splice(idx, 1);
        return next;
      });
    }
  };

  const playAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.example);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [currentWord]);

  const handleNext = useCallback(() => {
    // Play audio on success
    playAudio();
    
    setHeroAction('attack'); setMonsterAction('hit');
    setTimeout(() => {
      setHeroAction('idle'); setMonsterAction('idle');
      if (currentIdx + 1 < words.length) {
        setCurrentIdx(prev => prev + 1);
      } else {
        onComplete(totalMistakes === 0 ? 3 : totalMistakes < 4 ? 2 : 1);
      }
    }, 800);
  }, [currentIdx, words.length, totalMistakes, onComplete, playAudio]);

  const verify = () => {
    // Join chosen words and compare (case insensitive usually safer for order checking)
    const combined = selectedTiles.join(' ').toLowerCase();
    const correct = correctEnglishSequence.join(' ').toLowerCase();

    if (combined === correct) {
      handleNext();
    } else {
      const newMistakesCount = mistakesThisSentence + 1;
      setTotalMistakes(m => m + 1);
      setMistakesThisSentence(newMistakesCount);
      
      setMonsterAction('attack'); setHeroAction('hit');
      
      if (newMistakesCount >= 3) {
        // Trigger failure immediately if 3rd mistake
        setTimeout(() => {
          onFail();
        }, 600);
        return;
      }

      // Briefly shake and then reset if chances remain
      setTimeout(() => { 
        setMonsterAction('idle'); setHeroAction('idle');
        setSelectedTiles([]);
        const pool = [...correctEnglishSequence];
        const distractors = ["is", "the", "a", "not", "very", "too", "it", "they", "we", "he", "she"].filter(d => !pool.includes(d)).sort(() => 0.5 - Math.random()).slice(0, 3);
        setTilePool([...pool, ...distractors].sort(() => 0.5 - Math.random()));
      }, 600);
    }
  };

  return (
    <div className="flex flex-col h-full gap-2 max-w-5xl mx-auto overflow-hidden">
      <BattleView hero={hero} monsterType={3} heroAction={heroAction} monsterAction={monsterAction} />

      <div className="flex flex-col items-center flex-1 justify-center px-4 overflow-y-auto">
         <div className="text-sm bg-blue-600 text-white px-8 py-1 rounded-full mb-3 border-2 border-black uppercase font-black shadow-md flex-shrink-0">TIME: {timeLeft}s</div>
         
         <div className="w-full bg-white p-6 border-4 border-black rounded-[2rem] flex flex-col items-center shadow-lg flex-shrink-0">
            <div className="flex items-center gap-4 mb-6">
               <button onClick={playAudio} className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm hover:bg-indigo-600 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"/></svg>
               </button>
               <div className="text-2xl font-black text-slate-800 tracking-tight text-center">
                  {chinesePrompt}
               </div>
            </div>

            {/* Target Area */}
            <div className="w-full min-h-[70px] border-4 border-dashed border-slate-100 rounded-xl p-3 flex flex-wrap gap-2 mb-6 items-center content-start">
               {selectedTiles.map((word, i) => (
                  <button key={i} onClick={() => toggleTile(word, false)} 
                    className="bg-white border-2 border-indigo-200 px-4 py-2 rounded-xl text-xl font-black text-indigo-900 shadow-sm hover:scale-105 active:translate-y-1 transition-all">
                    {word}
                  </button>
               ))}
               {selectedTiles.length === 0 && <div className="text-slate-200 text-lg font-bold py-3 w-full text-center uppercase tracking-widest">Build the English Sentence...</div>}
            </div>

            {/* Source Tiles */}
            <div className="flex flex-wrap gap-2.5 justify-center mb-2">
               {tilePool.map((word, i) => (
                  <button key={i} onClick={() => toggleTile(word, true)} 
                    className="bg-gray-50 border-2 border-slate-200 px-4 py-2 rounded-xl text-xl font-black text-slate-700 shadow-sm hover:bg-indigo-50 hover:border-indigo-100 active:translate-y-1 transition-all">
                    {word}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="mt-auto py-4 flex items-center justify-between px-6 flex-shrink-0">
         <div className="flex gap-2">
            {[1, 2, 3].map(i => (
               <div key={i} className={`w-3 h-10 rounded-full transition-all border-2 border-black ${i <= 3 - mistakesThisSentence ? 'bg-red-500 shadow-sm' : 'bg-slate-200 opacity-20'}`} />
            ))}
         </div>
         <button onClick={verify} disabled={selectedTiles.length === 0}
            className={`px-16 py-4 rounded-2xl text-xl font-black uppercase tracking-widest transition-all ${selectedTiles.length > 0 ? 'bg-indigo-600 text-white shadow-[0_4px_0_#1a237e] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none' : 'bg-slate-100 text-slate-300 cursor-not-allowed border-2 border-slate-200'}`}>
            Check Answer
         </button>
      </div>
    </div>
  );
};
