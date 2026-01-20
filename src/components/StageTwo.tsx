
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Word, Hero } from '../types';
import { PixelCard } from './PixelCard';
import { BattleView } from './BattleView';

interface StageTwoProps {
  words: Word[];
  hero: Hero;
  onComplete: () => void;
  onMistake: (word: Word) => void;
  onFail: () => void;
  onProgress: (idx: number) => void;
}

export const StageTwo: React.FC<StageTwoProps> = ({ words, hero, onComplete, onMistake, onFail, onProgress }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mistakesThisWord, setMistakesThisWord] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180); 
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [lastFailedChoice, setLastFailedChoice] = useState<string | null>(null);
  const [displayExample, setDisplayExample] = useState<string | null>(null);
  const [highlightLetter, setHighlightLetter] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [heroAction, setHeroAction] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [monsterAction, setMonsterAction] = useState<'idle' | 'attack' | 'hit'>('idle');

  const gameMode = useMemo(() => Math.random() > 0.5 ? 'pos' : 'spelling', [currentIdx]);
  const currentWord = words[currentIdx];

  const playAudio = useCallback(() => {
    if (!currentWord) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.english);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [currentWord]);

  const spellingConfig = useMemo(() => {
    if (gameMode !== 'spelling') return { template: [], blanks: [] };
    const letters = currentWord.english.split('');
    const maxBlanksCount = Math.max(1, Math.floor(letters.length * 0.4)); // STRICT 40% limit
    
    // Create an array of indices that are candidates for blanks (not first or last char)
    const middleIndices = Array.from({ length: letters.length - 2 }, (_, i) => i + 1);
    // Shuffle middle indices
    const shuffledIndices = [...middleIndices].sort(() => Math.random() - 0.5);
    // Pick first maxBlanksCount indices
    const blankIndices = shuffledIndices.slice(0, maxBlanksCount);
    
    const template = letters.map((l, i) => blankIndices.includes(i) ? '_' : l);
    
    return { template, blanks: blankIndices.sort((a, b) => a - b) };
  }, [currentWord, gameMode]);

  useEffect(() => { onProgress(currentIdx); }, [currentIdx]);

  useEffect(() => {
    setUserInput([...spellingConfig.template]); 
    setMistakesThisWord(0); 
    setHighlightLetter(null); 
    setDisplayExample(null); 
    setLastFailedChoice(null);
  }, [currentIdx, spellingConfig]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { onFail(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [onFail]);

  const handleNext = useCallback(() => {
    // Play audio on correct answer for all modes in Stage 2
    playAudio();
    
    setHeroAction('attack'); setMonsterAction('hit');
    setTimeout(() => {
      setHeroAction('idle'); setMonsterAction('idle');
      if (currentIdx + 1 < words.length) setCurrentIdx(prev => prev + 1);
      else onComplete();
    }, 800);
  }, [currentIdx, words.length, onComplete, playAudio]);

  const handlePOSChoice = (pos: string) => {
    if (pos === currentWord.pos) {
      handleNext();
    } else {
      setLastFailedChoice(pos); setMonsterAction('attack'); setHeroAction('hit');
      onMistake(currentWord); setMistakesThisWord(m => m + 1);
      setTimeout(() => { setMonsterAction('idle'); setHeroAction('idle'); }, 600);
      if (mistakesThisWord + 1 >= 2) setShowChoiceModal(true);
    }
  };

  const handleSpellingInput = (letter: string) => {
    const nextBlankIdx = userInput.indexOf('_');
    if (nextBlankIdx === -1) return;
    
    if (letter.toLowerCase() === currentWord.english[nextBlankIdx].toLowerCase()) {
      const nextInput = [...userInput]; 
      nextInput[nextBlankIdx] = currentWord.english[nextBlankIdx]; // Preserve case if any
      setUserInput(nextInput);
      setHighlightLetter(null);
      
      // Check if word is finished
      if (nextInput.indexOf('_') === -1) {
        handleNext();
      }
    } else {
      setMonsterAction('attack'); setHeroAction('hit');
      onMistake(currentWord); setMistakesThisWord(m => m + 1);
      setTimeout(() => { setMonsterAction('idle'); setHeroAction('idle'); }, 600);
      if (mistakesThisWord + 1 >= 2) setShowChoiceModal(true);
    }
  };

  const handleFlashReveal = () => {
    const nextBlankIdx = userInput.indexOf('_');
    if (nextBlankIdx !== -1) {
      const correctLetter = currentWord.english[nextBlankIdx].toLowerCase();
      setHighlightLetter(correctLetter);
      // Let it pulse for clear visual feedback
      setTimeout(() => setHighlightLetter(null), 2500);
    }
    setShowChoiceModal(false);
  };

  const posOptions = [
    { k: 'n', l: 'n.' }, 
    { k: 'v', l: 'v.' }, 
    { k: 'adj', l: 'adj.' }, 
    { k: 'adv', l: 'adv.' }, 
    { k: 'prep', l: 'prep.' }, 
    { k: 'conj', l: 'conj.' }, 
    { k: 'pron', l: 'pron.' }, 
    { k: 'art', l: 'art.' }
  ];

  return (
    <div className="flex flex-col h-full gap-2 relative overflow-hidden">
      <BattleView hero={hero} monsterType={2} heroAction={heroAction} monsterAction={monsterAction} />
      
      <div className="flex flex-col items-center flex-1 justify-center">
        <div className="text-sm bg-blue-600 text-white px-6 py-1 rounded-full mb-2 border-2 border-black uppercase font-black shadow-md tracking-widest">
          TIME: {timeLeft}s
        </div>
        
        <div className="w-full bg-white p-4 border-4 border-black rounded-2xl flex flex-col items-center justify-center shadow-lg max-w-4xl mx-auto">
          {gameMode === 'pos' ? (
            <>
              <div className="text-5xl font-black mb-6 uppercase tracking-widest text-blue-600 drop-shadow-sm">{currentWord.english}</div>
              <div className="grid grid-cols-4 gap-4 w-full">
                {posOptions.map(opt => (
                  <button key={opt.k} onClick={() => handlePOSChoice(opt.k)} 
                    className={`pixel-button py-3 text-center text-xl font-black text-white uppercase transition-all ${lastFailedChoice === opt.k ? 'opacity-30 grayscale' : 'hover:scale-105 active:translate-y-1'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-black text-slate-800 mb-6 uppercase tracking-wide">{currentWord.chinese}</div>
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {userInput.map((char, i) => (
                  <div key={i} className={`w-10 h-14 rounded-lg border-2 border-black flex items-center justify-center text-3xl font-black uppercase shadow-inner ${char === '_' ? 'bg-slate-50 text-slate-200' : 'bg-blue-50 text-blue-600'}`}>{char}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 md:grid-cols-13 gap-1.5 px-2">
                {"abcdefghijklmnopqrstuvwxyz".split('').map(l => (
                  <button key={l} onClick={() => handleSpellingInput(l)} className={`w-8 h-10 bg-white border-2 border-black rounded-lg font-black text-black uppercase transition-all shadow-sm ${highlightLetter === l ? 'bg-amber-400 animate-pulse ring-4 ring-amber-200 border-amber-600' : 'hover:bg-blue-100 hover:-translate-y-0.5 active:translate-y-0.5'}`}>{l}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showChoiceModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white p-8 border-4 border-black rounded-[2rem] text-center shadow-xl">
            <h3 className="font-black mb-6 uppercase text-blue-600 text-2xl tracking-tight">Need a Boost?</h3>
            <div className="flex flex-col gap-4">
              <button onClick={() => { setDisplayExample(currentWord.example); setShowChoiceModal(false); }} className="pixel-button bg-purple-500 text-white py-4 text-lg font-black uppercase border-b-4 border-purple-900">WATCH EXAMPLE</button>
              <button onClick={handleFlashReveal} className="pixel-button bg-amber-400 text-black py-4 text-lg font-black uppercase border-b-4 border-amber-600">FLASH REVEAL</button>
            </div>
          </div>
        </div>
      )}
      
      {displayExample && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-yellow-50 border-2 border-black p-2 rounded-lg font-bold text-black text-sm z-30 animate-bounce">
          💡 "{displayExample}"
        </div>
      )}
    </div>
  );
};
