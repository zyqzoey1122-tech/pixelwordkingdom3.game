
import React from 'react';

interface SpriteProps {
  type: 'hero' | 'monster';
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  action?: 'idle' | 'attack' | 'hit';
  variant?: string; 
}

export const PixelSprite: React.FC<SpriteProps> = ({ type, color, size = 'md', action = 'idle', variant }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-32',
    lg: 'w-44 h-48',
    xl: 'w-60 h-64'
  };

  const isHit = action === 'hit';
  const isAttack = action === 'attack';

  const renderHero = () => {
    const isAlice = variant === 'h1';
    const isPrince = variant === 'h2';
    const isRedHood = variant === 'h3';
    const isRapunzel = variant === 'h4';

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 120" style={{ filter: isHit ? 'grayscale(0.5) brightness(1.5)' : 'none' }}>
        <g transform={isAttack ? 'translate(15,0)' : ''} className="transition-transform duration-300">
          
          {/* Back Hair - More voluminous for Chibi style */}
          {isAlice && <path d="M22,35 Q10,75 25,100 Q50,115 75,100 Q90,75 78,35" fill="#fbc02d" stroke="#000" strokeWidth="1.5" />}
          {isRapunzel && <path d="M22,35 Q-5,120 40,118 Q65,125 78,35" fill="#fff59d" stroke="#000" strokeWidth="1.5" />}
          
          {/* Body/Dress */}
          {isAlice && <path d="M35,65 Q50,60 65,65 L78,105 Q50,115 22,105 Z" fill="#4fc3f7" stroke="#000" strokeWidth="2" />}
          {isPrince && (
            <>
              <path d="M30,65 L10,75 L20,110 L80,110 L90,75 L70,65" fill="#e53935" stroke="#000" strokeWidth="2" />
              <path d="M38,65 L62,65 L65,100 L35,100 Z" fill="#1a237e" stroke="#000" strokeWidth="2" />
            </>
          )}
          {isRedHood && <path d="M30,60 Q50,55 70,60 L85,110 Q50,120 15,110 Z" fill="#c62828" stroke="#000" strokeWidth="2.5" />}
          {isRapunzel && <path d="M35,65 Q50,60 65,65 L75,110 Q50,120 25,110 Z" fill="#81c784" stroke="#000" strokeWidth="2.5" />}

          {/* Stick Legs */}
          <g stroke="#000" strokeWidth="3" strokeLinecap="round">
            <line x1="43" y1="105" x2="43" y2="118" />
            <line x1="57" y1="105" x2="57" y2="118" />
          </g>

          {/* Arms */}
          <g stroke="#000" strokeWidth="2.5" strokeLinecap="round">
            <line x1="38" y1="75" x2={isAttack ? "45" : "32"} y2="88" />
            <line x1="62" y1="75" x2={isAttack ? "88" : "68"} y2={isAttack ? "75" : "88"} />
          </g>

          {/* Large Chibi Head */}
          <circle cx="50" cy="40" r="28" fill="#ffe0b2" stroke="#000" strokeWidth="2.5" />

          {/* Front Hair/Fringe */}
          {isAlice && (
            <>
              <path d="M22,40 Q25,12 50,12 Q75,12 78,40 Q65,34 50,40 Q35,34 22,40" fill="#fbc02d" stroke="#000" strokeWidth="2" />
              <path d="M35,18 Q50,12 65,18" fill="none" stroke="#01579b" strokeWidth="6" />
            </>
          )}
          {isPrince && (
            <>
              <path d="M22,40 Q25,12 50,12 Q75,12 78,40 Q50,30 22,40" fill="#4e342e" stroke="#000" strokeWidth="2" />
              <path d="M42,12 L45,2 L50,8 L55,2 L58,12 Z" fill="#fbc02d" stroke="#000" strokeWidth="2" />
            </>
          )}
          {isRedHood && (
            <path d="M22,42 Q25,12 50,12 Q75,12 78,42 Q50,28 22,42" fill="#c62828" stroke="#000" strokeWidth="2" />
          )}
          {isRapunzel && (
            <path d="M22,40 Q25,12 50,12 Q75,12 78,40 Q50,30 22,40" fill="#fff59d" stroke="#000" strokeWidth="2" />
          )}

          {/* Face - Very simple eyes and smile */}
          <circle cx="41" cy="46" r="3" fill="#000" />
          <circle cx="59" cy="46" r="3" fill="#000" />
          <path d="M45,56 Q50,60 55,56" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    );
  };

  const renderMonster = () => {
    const isM1 = variant === 'monster1';
    const isM2 = variant === 'monster2';
    const isM3 = variant === 'monster3';

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 120" style={{ filter: isHit ? 'grayscale(0.5) brightness(1.5)' : 'none' }}>
        <g transform={isAttack ? 'translate(-15,0)' : ''} className="transition-transform duration-300">
          {isM1 && (
            <g>
              <path d="M20,60 Q20,30 50,30 Q80,30 80,60 Q80,95 50,95 Q20,95 20,60 Z" fill="#4caf50" stroke="#1b5e20" strokeWidth="2" />
              <circle cx="38" cy="50" r="10" fill="white" stroke="#000" strokeWidth="1" />
              <circle cx="40" cy="52" r="3" fill="black" />
              <circle cx="62" cy="45" r="12" fill="white" stroke="#000" strokeWidth="1" />
              <circle cx="65" cy="48" r="4" fill="black" />
              <path d="M40,80 Q50,90 60,80" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              <path d="M35,95 Q30,110 32,115" fill="none" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
              <path d="M50,95 Q50,110 52,115" fill="none" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
              <path d="M65,95 Q70,110 68,115" fill="none" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}
          {isM2 && (
            <g>
              <path d="M30,100 Q50,110 70,100 L70,40 Q70,15 50,15 Q30,15 30,40 Z" fill="#9575cd" stroke="#311b92" strokeWidth="2" />
              <circle cx="50" cy="35" r="14" fill="white" stroke="#000" strokeWidth="2" />
              <circle cx="53" cy="38" r="5" fill="black" />
              <path d="M35,25 L25,5 M65,25 L75,5" stroke="#311b92" strokeWidth="4" strokeLinecap="round" />
              <path d="M40,100 Q25,110 30,115 M60,100 Q75,110 70,115" stroke="#311b92" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}
          {isM3 && (
            <g>
              <circle cx="50" cy="60" r="35" fill="#f06292" stroke="#880e4f" strokeWidth="2" />
              {Array.from({length: 8}).map((_, i) => (
                <line key={i} x1="50" y1="60" x2={50 + 45 * Math.cos(i * Math.PI/4)} y2={60 + 45 * Math.sin(i * Math.PI/4)} stroke="#880e4f" strokeWidth="3" />
              ))}
              <circle cx="50" cy="60" r="30" fill="#f06292" stroke="#880e4f" strokeWidth="2" />
              <circle cx="42" cy="55" r="6" fill="white" stroke="#000" strokeWidth="1" />
              <circle cx="58" cy="55" r="6" fill="white" stroke="#000" strokeWidth="1" />
              <circle cx="50" cy="50" r="4" fill="white" stroke="#000" strokeWidth="1" />
              <path d="M40,75 Q50,85 60,75" fill="none" stroke="#000" strokeWidth="2" />
            </g>
          )}
        </g>
      </svg>
    );
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex flex-col items-center justify-end transition-all duration-300 
      ${isAttack ? (type === 'hero' ? 'translate-x-16' : '-translate-x-16') : ''}
      ${isHit ? 'animate-bounce' : 'animate-[float_3.5s_ease-in-out_infinite]'}`}>
      {type === 'hero' ? renderHero() : renderMonster()}
    </div>
  );
};
