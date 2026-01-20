
import React, { useState, useEffect } from 'react';
import { Hero } from '../types';
import { PixelSprite } from './PixelSprite';

interface BattleViewProps {
  hero: Hero;
  monsterType: 1 | 2 | 3;
  heroAction: 'idle' | 'attack' | 'hit';
  monsterAction: 'idle' | 'attack' | 'hit';
}

export const BattleView: React.FC<BattleViewProps> = ({ hero, monsterType, heroAction, monsterAction }) => {
  const monsterNames = ["Swamp Blob", "Iron Jelly", "Ancient King Blob"];
  const monsterColors = ["bg-green-500", "bg-slate-600", "bg-red-600"];
  const monsterVariants = ["monster1", "monster2", "monster3"];
  const monsterSizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ["md", "lg", "xl"];

  const [fireball, setFireball] = useState<{ active: boolean, direction: 'hero' | 'monster' }>({ active: false, direction: 'monster' });

  useEffect(() => {
    if (heroAction === 'attack') {
      setFireball({ active: true, direction: 'monster' });
      setTimeout(() => setFireball({ active: false, direction: 'monster' }), 600);
    }
  }, [heroAction]);

  useEffect(() => {
    if (monsterAction === 'attack') {
      setFireball({ active: true, direction: 'hero' });
      setTimeout(() => setFireball({ active: false, direction: 'hero' }), 600);
    }
  }, [monsterAction]);

  return (
    <div className="w-full h-52 rounded-[30px] mb-2 relative overflow-hidden border-4 border-indigo-900 flex items-end justify-between px-12 pb-6 shadow-[8px_8px_0px_rgba(26,35,126,0.1)] bg-white max-h-[25vh] flex-shrink-0">
      {/* Cartoon Landscape Background */}
      <div className="absolute inset-0 z-0 bg-sky">
        {/* Rolling Hills */}
        <div className="absolute bottom-0 left-[-10%] right-[-10%] h-24 bg-green-400 rounded-[50%_50%_0_0] border-t-2 border-green-600" />
        <div className="absolute bottom-0 left-[20%] right-[-30%] h-32 bg-green-500 rounded-[60%_40%_0_0] border-t-2 border-green-700 opacity-80" />
        
        {/* Clouds */}
        <div className="absolute top-6 left-[15%] w-16 h-5 bg-white rounded-full opacity-60 floating" />
        <div className="absolute top-12 left-[60%] w-24 h-7 bg-white rounded-full opacity-40 floating" style={{ animationDelay: '1s' }} />
      </div>

      {/* Monster Name Tag */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-indigo-900 text-white px-6 py-1 rounded-full border-2 border-white text-[10px] font-black uppercase tracking-widest shadow-md">
          {monsterNames[monsterType - 1]}
        </div>
      </div>

      {/* Fireball Attack Visual */}
      {fireball.active && (
        <div 
          className="absolute bottom-16 z-30 transition-all duration-500 ease-in-out"
          style={{ 
            left: fireball.direction === 'monster' ? '15%' : '80%', 
            transform: `translateX(${fireball.direction === 'monster' ? '50vw' : '-50vw'})`,
            opacity: fireball.active ? 1 : 0
          }}
        >
          <div className="w-12 h-12 bg-orange-500 rounded-full shadow-[0_0_20px_#f97316] relative flex items-center justify-center animate-pulse">
            <div className="absolute -left-4 w-8 h-8 bg-red-600 rounded-full opacity-60" />
            <div className="absolute -right-2 w-6 h-6 bg-yellow-400 rounded-full" />
            <span className="text-white font-black text-xs">🔥</span>
          </div>
        </div>
      )}

      {/* Hero Battle Position */}
      <div className="relative z-10 transition-all duration-300 transform scale-75">
        <PixelSprite 
          type="hero" 
          color={hero.color} 
          variant={hero.id} 
          action={heroAction} 
          size="md" 
        />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/10 rounded-full blur-sm" />
      </div>

      {/* Monster Battle Position */}
      <div className="relative z-10 transition-all duration-300 transform scale-75">
        <PixelSprite 
          type="monster" 
          color={monsterColors[monsterType - 1]} 
          variant={monsterVariants[monsterType - 1]} 
          action={monsterAction} 
          size={monsterSizes[monsterType - 1]} 
        />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/10 rounded-full blur-sm" />
      </div>
      
      {monsterAction === 'hit' && (
        <div className="absolute right-24 top-1/2 animate-ping text-red-600 font-black text-2xl z-20 drop-shadow-[2px_2px_0px_white]">*WHAM!*</div>
      )}
      {heroAction === 'hit' && (
        <div className="absolute left-24 top-1/2 animate-ping text-orange-600 font-black text-2xl z-20 drop-shadow-[2px_2px_0px_white]">OUCH!</div>
      )}
    </div>
  );
};
