
import React from 'react';
import { WORLDS, WORLD_COLORS } from '../constants';
import { User } from '../types';
import { PixelCard } from './PixelCard';

interface MapViewProps {
  user: User;
  onSelectLevel: (worldId: number, stageNum: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({ user, onSelectLevel }) => {
  // Calculate total stars
  // Fix: Explicitly type the reduce parameters as numbers to resolve the operator '+' unknown error.
  const totalStars = Object.values(user.stars).reduce((sum: number, s: number) => sum + s, 0);

  return (
    <div className="flex flex-col items-center p-8 overflow-y-auto h-screen bg-sky scrollbar-hide">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-3xl text-blue-900 drop-shadow-lg font-black tracking-[0.2em] uppercase mb-2">The Grand Archive</h1>
        <div className="bg-white border-4 border-black px-6 py-2 rounded-full flex items-center gap-3 shadow-md">
           <span className="text-yellow-400 text-2xl">★</span>
           <span className="text-xl font-black text-indigo-900">{totalStars} Collected</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-10 w-full max-w-4xl relative pb-32">
        <div className="absolute top-10 left-10 w-16 h-8 bg-white opacity-60 rounded-full floating" />
        <div className="absolute top-40 right-20 w-12 h-6 bg-white opacity-40 rounded-full floating" style={{ animationDelay: '1s' }} />

        {WORLDS.map((world) => (
          <div key={world.id} className="flex flex-col gap-4 bg-white/40 p-8 rounded-[40px] border-4 border-dashed border-white/60">
            <h2 className="text-xl text-indigo-950 font-black uppercase tracking-widest flex items-center gap-4">
               <div className={`w-4 h-4 rounded-full ${WORLD_COLORS[world.id]}`} />
               {world.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((stage) => {
                const levelId = `w${world.id}-s${stage}`;
                // STAGE 1 of ALL worlds is UNLOCKED by default as requested
                const isUnlocked = stage === 1 || user.unlockedLevels.includes(levelId);
                const stars = user.stars[levelId] || 0;

                return (
                  <PixelCard 
                    key={stage}
                    onClick={() => isUnlocked && onSelectLevel(world.id, stage)}
                    className={`flex flex-col items-center justify-center py-8 border-4 transition-all duration-300 rounded-[2rem] ${isUnlocked ? 'bg-white hover:-translate-y-2' : 'bg-slate-200 opacity-60 grayscale'}`}
                  >
                    <span className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Stage {stage}</span>
                    <div className={`w-12 h-12 ${WORLD_COLORS[world.id] || 'bg-slate-500'} border-4 border-black mb-4 rounded-2xl shadow-lg relative flex items-center justify-center overflow-hidden`}>
                       {!isUnlocked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">🔒</div>}
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3].map(i => (
                        <span key={i} className={`text-lg leading-none ${i <= stars ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                      ))}
                    </div>
                    {!isUnlocked ? (
                      <span className="text-[10px] font-black text-red-400 uppercase">Locked</span>
                    ) : stars > 0 ? (
                      <span className="text-[10px] font-black text-emerald-500 uppercase">Cleared</span>
                    ) : (
                      <span className="text-[10px] font-black text-indigo-600 uppercase">New</span>
                    )}
                  </PixelCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
