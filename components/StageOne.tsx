
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Word, Hero } from '../types';
import { RAW_WORDS } from '../constants';
import { PixelCard } from './PixelCard';
import { BattleView } from './BattleView';

interface StageOneProps {
  words: Word[];
  worldId: number;
  hero: Hero;
  onComplete: () => void;
  onMistake: (word: Word) => void;
  onFail: () => void;
  onProgress: (idx: number) => void;
}

export const StageOne: React.FC<StageOneProps> = ({ words, worldId, hero, onComplete, onMistake, onFail, onProgress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [heroAction, setHeroAction] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [monsterAction, setMonsterAction] = useState<'idle' | 'attack' | 'hit'>('idle');
  
  const gameMode = useMemo(() => Math.random() > 0.4 ? 'text' : 'audio', []);
  const currentWord = words[currentIndex];

  useEffect(() => { onProgress(currentIndex); }, [currentIndex]);

  const playAudio = useCallback(() => {
    if (!currentWord) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.english);
    utterance.lang = 'en-US'; 
    utterance.rate = 0.85; // Slightly faster but still clear for learning
    window.speechSynthesis.speak(utterance);
  }, [currentWord]);

  const generateOptions = useCallback(() => {
    if (!currentWord) return;
    const worldPool = RAW_WORDS[worldId] || [];
    const possibleDistractors = Array.from(new Set(worldPool.map(w => w.chinese))).filter(c => c !== currentWord.chinese);
    const distractors = [...possibleDistractors].sort(() => 0.5 - Math.random()).slice(0, 3);
    setOptions([...distractors, currentWord.chinese].sort(() => 0.5 - Math.random()));
  }, [currentWord, worldId]);

  useEffect(() => {
    generateOptions(); setTimeLeft(10); setFeedback(null); setShowHint(false);
    if (gameMode === 'audio') setTimeout(playAudio, 300);
  }, [currentIndex, generateOptions, gameMode, playAudio]);

  useEffect(() => {
    if (timeLeft <= 0) { onFail(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onFail]);

  const handleAnswer = (choice: string) => {
    if (feedback === 'correct') return;
    if (choice === currentWord.chinese) {
      // PLAY AUDIO ON CORRECT ANSWER
      playAudio();
      
      setFeedback('correct'); setHeroAction('attack'); setMonsterAction('hit');
      setTimeout(() => {
        setHeroAction('idle'); setMonsterAction('idle');
        if (currentIndex + 1 < words.length) setCurrentIndex(prev => prev + 1);
        else onComplete();
      }, 800);
    } else {
      setFeedback('wrong'); setShowHint(true); setMonsterAction('attack'); setHeroAction('hit');
      onMistake(currentWord);
      setTimeout(() => {
        setFeedback(null); setHeroAction('idle'); setMonsterAction('idle');
      }, 800);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <BattleView hero={hero} monsterType={1} heroAction={heroAction} monsterAction={monsterAction} />
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-xl bg-blue-600 text-white px-8 py-2 rounded-full inline-block font-black border-4 border-black uppercase shadow-lg">
          TIME: {timeLeft}s
        </div>

        <div className="min-h-[100px] flex items-center justify-center">
          {gameMode === 'text' ? (
            <div className="text-7xl font-black text-black uppercase tracking-widest drop-shadow-[0_4px_0_rgba(0,0,0,0.1)]">{currentWord.english}</div>
          ) : (
            <button onClick={playAudio} className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center border-8 border-black hover:scale-110 active:scale-95 transition-transform shadow-xl">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10c0-1.105-.447-2.103-1.172-2.828a1 1 0 010-1.415z"/></svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
          {options.map((opt, i) => (
            <PixelCard key={i} onClick={() => handleAnswer(opt)} className={`text-2xl font-black text-black text-center py-6 min-h-[100px] flex items-center justify-center transition-all duration-150 ${feedback === 'correct' && opt === currentWord.chinese ? 'bg-green-400' : feedback === 'wrong' && opt !== currentWord.chinese ? 'opacity-40 grayscale' : ''}`}>
              {opt}
            </PixelCard>
          ))}
        </div>

        <div className={`p-4 bg-yellow-100 border-4 border-black text-xl text-black transition-all duration-300 font-black flex flex-col items-center shadow-[4px_4px_0px_rgba(0,0,0,0.1)] ${showHint ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <span className="text-red-600 uppercase text-xs mb-1">Recall Hint</span>
          <div>"{currentWord.english}" means <span className="underline">{currentWord.chinese}</span>.</div>
        </div>
      </div>
    </div>
  );
};
