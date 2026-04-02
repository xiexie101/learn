import { useState, useEffect, useRef } from 'react';
import { 
  SPECIES, HATS, EYES, renderSprite 
} from './sprites';
import { AppState, QUOTES, getAmbientQuote, BubbleState } from './store';
import { Download, Settings, Sparkles } from 'lucide-react';

const THEMES = ['green', 'amber', 'pink'] as const;

const SPECIES_ZH: Record<string, string> = {
  duck: '鸭子', goose: '鹅', blob: '史莱姆', cat: '猫', 
  dragon: '龙', octopus: '章鱼', owl: '猫头鹰', penguin: '企鹅', 
  turtle: '乌龟', snail: '蜗牛', ghost: '幽灵', axolotl: '蝾螈', 
  capybara: '水豚', cactus: '仙人掌', robot: '机器人', rabbit: '兔子', 
  mushroom: '蘑菇', chonk: '胖嘟嘟'
};

const HAT_ZH: Record<string, string> = {
  none: '无', crown: '皇冠', tophat: '高礼帽', propeller: '竹蜻蜓',
  halo: '光环', wizard: '巫师帽', beanie: '无檐帽', tinyduck: '头顶鸭鸭'
};

function App() {
  // Load state from local storage or set defaults
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('ascii-buddy-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          state: 'idle',
          bubbleText: null
        };
      } catch (e) {
        console.error('Failed to parse saved state');
      }
    }
    return {
      species: 'cat',
      hat: 'none',
      eye: 'o',
      theme: 'green',
      useCrt: true,
      bubbleText: null,
      state: 'idle'
    };
  });

  const [frame, setFrame] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  
  // Interaction & Tracking refs
  const lastInteractionRef = useRef<number>(Date.now());
  const pokeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Eye Tracking refs
  const stageRef = useRef<HTMLDivElement>(null);
  const [trackingEye, setTrackingEye] = useState<string | null>(null);
  const trackingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });
  
  // Touch Gesture refs
  const touchStartRef = useRef<{ time: number, x: number, y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  // Save state on change
  useEffect(() => {
    const stateToSave = { ...state };
    // Don't save transient state
    stateToSave.bubbleText = null;
    stateToSave.state = 'idle';
    localStorage.setItem('ascii-buddy-state', JSON.stringify(stateToSave));
  }, [state.species, state.hat, state.eye, state.theme, state.useCrt]);

  // Animation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 3);
      
      // Idle logic (Sleep after 30s)
      const now = Date.now();
      if (state.state !== 'sleeping' && now - lastInteractionRef.current > 30000) {
        updateState({ state: 'sleeping', eye: '-', bubbleText: 'Zzz...' });
        setTrackingEye(null); // Reset tracking eye when asleep
      }
      
      // Random ambient quotes with time awareness
      if (state.state === 'idle' && Math.random() < 0.05 && !state.bubbleText) {
        showBubble(getAmbientQuote());
      }
    }, 600);
    return () => clearInterval(interval);
  }, [state.state, state.bubbleText]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
    if (updates.state && updates.state !== 'sleeping') {
       lastInteractionRef.current = Date.now();
    }
  };

  const showBubble = (text: string, duration = 3000) => {
    updateState({ bubbleText: text });
    if (pokeTimeoutRef.current) clearTimeout(pokeTimeoutRef.current);
    pokeTimeoutRef.current = setTimeout(() => {
      updateState({ bubbleText: null, state: 'idle' });
    }, duration);
  };

  // ----- Mouse Eye Tracking & Velocity -----
  const handleMouseMove = (e: React.MouseEvent) => {
    if (state.state === 'sleeping' || state.state === 'alert') return; 
    lastInteractionRef.current = Date.now();

    if (stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      // Calculate angle in degrees
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Only track if mouse is somewhat outside the center deadzone
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 50) {
         let newEye = state.eye;
         // Map angle to eye character
         if (angle > -45 && angle <= 45) newEye = '>'; // Right
         else if (angle > 45 && angle <= 135) newEye = 'v'; // Down
         else if (angle > 135 || angle <= -135) newEye = '<'; // Left
         else if (angle > -135 && angle <= -45) newEye = '^'; // Up
         
         setTrackingEye(newEye);
         
         // Clear tracking eye after mouse stops for 1.5s
         if (trackingTimeoutRef.current) clearTimeout(trackingTimeoutRef.current);
         trackingTimeoutRef.current = setTimeout(() => setTrackingEye(null), 1500);
      } else {
         setTrackingEye(null);
      }

      // Velocity Check for "Jump Scare / Alert"
      const now = Date.now();
      const timeDt = now - lastMouseRef.current.time;
      if (timeDt > 0 && timeDt < 100) {
        const mouseDx = e.clientX - lastMouseRef.current.x;
        const mouseDy = e.clientY - lastMouseRef.current.y;
        const speed = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy) / timeDt;
        
        // If mouse is whipped very fast, trigger alert
        if (speed > 4.5 && (state.state as string) !== 'alert') {
           handleAlert();
           setTrackingEye(null);
        }
      }
      
      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };
    }
  };

  const handleAlert = () => {
    updateState({ state: 'alert' as BubbleState, eye: 'O' });
    showBubble(QUOTES.alert[Math.floor(Math.random() * QUOTES.alert.length)], 2500);
  };

  // ----- Touch & Mobile Interactions -----
  const handleTouchStart = (e: React.TouchEvent) => {
    lastInteractionRef.current = Date.now();
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStartRef.current = { time: Date.now(), x: touch.clientX, y: touch.clientY };

    // Double Tap Check
    const timeSinceLastTap = touchStartRef.current.time - lastTapRef.current;
    if (timeSinceLastTap > 0 && timeSinceLastTap < 300) {
       if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
       handleAlert();
       lastTapRef.current = 0; // reset
       return;
    }
    lastTapRef.current = touchStartRef.current.time;

    // Start Long Press timer for "Petting"
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
       handlePet();
       touchStartRef.current = null; // Clear to prevent normal click
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    
    // If it was a quick tap, and we haven't already handled a double tap
    if (touchStartRef.current) {
       const dt = Date.now() - touchStartRef.current.time;
       if (dt < 300) {
          handlePoke();
       }
    }
    touchStartRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press if finger moves too much
    if (touchStartRef.current) {
       const touch = e.touches[0];
       if (touch) {
         const dx = touch.clientX - touchStartRef.current.x;
         const dy = touch.clientY - touchStartRef.current.y;
         if (Math.sqrt(dx * dx + dy * dy) > 15) {
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            touchStartRef.current = null;
         }
       }
    }
  };

  const handlePet = () => {
    updateState({ state: 'loved', eye: '^' });
    showBubble(QUOTES.loved[Math.floor(Math.random() * QUOTES.loved.length)], 3000);
  };

  // ----- General Interactions -----
  const handleInteraction = () => {
    lastInteractionRef.current = Date.now();
    if (state.state === 'sleeping') {
      updateState({ state: 'idle', bubbleText: '?' });
      setTimeout(() => updateState({ bubbleText: null }), 2000);
    }
  };

  const handlePoke = () => {
    handleInteraction();
    updateState({ state: 'poked', eye: '>' });
    showBubble(QUOTES.poked[Math.floor(Math.random() * QUOTES.poked.length)], 2000);
  };

  const handleFeed = () => {
    handleInteraction();
    updateState({ state: 'excited', eye: '^' });
    showBubble(QUOTES.excited[Math.floor(Math.random() * QUOTES.excited.length)], 3000);
  };

  // Determine current eye based on state OR tracking
  let currentEye = state.eye;
  if (state.state === 'sleeping') currentEye = '-';
  else if (state.state === 'poked') currentEye = '>';
  else if (state.state === 'excited') currentEye = '^';
  else if (state.state === 'loved') currentEye = '^';
  else if (state.state === 'alert') currentEye = 'O';
  else if (state.state === 'idle' && trackingEye) currentEye = trackingEye;

  const exportText = () => {
    const lines = renderSprite({
      species: state.species,
      hat: state.hat,
      eye: currentEye
    }, frame);
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopyStatus('Copied ASCII!');
    setTimeout(() => setCopyStatus(''), 2000);
  };
  
  const exportBash = () => {
    const lines = renderSprite({
      species: state.species,
      hat: state.hat,
      eye: currentEye
    }, frame);
    const bash = lines.map(l => `echo "${l.replace(/"/g, '\\"')}"`).join('\n');
    navigator.clipboard.writeText(bash);
    setCopyStatus('Copied Bash script!');
    setTimeout(() => setCopyStatus(''), 2000);
  }

  const renderedLines = renderSprite({
    species: state.species,
    hat: state.hat,
    eye: currentEye
  }, frame);

  const themeClass = `text-glow-${state.theme}`;
  const crtClass = state.useCrt ? 'crt-effect border-opacity-50 border shadow-[0_0_15px_rgba(0,255,0,0.2)]' : '';

  // Only jump animation for specific states, no more parallax translation
  let transformStyle = '';
  if (state.state === 'excited') {
     transformStyle = 'translateY(-16px)'; // Jump
  } else if (state.state === 'loved') {
     transformStyle = `scale(1.05)`; // Pulse
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0c0c0c] text-slate-300 font-sans" onMouseMove={handleMouseMove}>
      
      {/* Left/Top: Stage */}
      <div 
        ref={stageRef}
        className="flex-[1.5] p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[50vh] md:min-h-screen"
      >
        
        {/* CRT Background styling container */}
        <div 
          className={`relative bg-[#111] border-[#333] rounded-lg p-12 flex flex-col items-center justify-center w-full max-w-2xl min-h-[300px] md:min-h-[400px] transition-all duration-300 ${crtClass} ${state.useCrt ? `border-${state.theme}-900/30` : 'border border-[#222]'}`}
          onClick={handlePoke}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
             borderColor: state.useCrt ? (state.theme === 'green' ? '#003300' : state.theme === 'amber' ? '#332000' : '#330033') : '#222',
             touchAction: 'manipulation' // Prevent double-tap zoom on mobile
          }}
        >
          {/* Speech Bubble */}
          <div className="absolute top-8 md:top-12 h-16 w-full flex justify-center items-end pointer-events-none">
            {state.bubbleText && (
              <div className={`
                px-4 py-2 rounded-lg border text-sm font-mono animate-bounce
                ${state.theme === 'green' ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : ''}
                ${state.theme === 'amber' ? 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10' : ''}
                ${state.theme === 'pink' ? 'border-[#ff00ff] text-[#ff00ff] bg-[#ff00ff]/10' : ''}
              `}>
                {state.bubbleText}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" 
                     style={{ borderTopColor: state.theme === 'green' ? '#00ff00' : state.theme === 'amber' ? '#ffb000' : '#ff00ff' }}></div>
              </div>
            )}
          </div>

          {/* ASCII Sprite */}
          <pre 
            className={`font-mono text-xl md:text-2xl leading-[1.2] cursor-pointer select-none transition-transform duration-200 ${themeClass}`}
            style={{ 
              color: state.theme === 'green' ? '#00ff00' : state.theme === 'amber' ? '#ffb000' : '#ff00ff',
              transform: transformStyle
            }}
          >
            {renderedLines.join('\n')}
          </pre>
          
          {/* Floor line */}
          <div className={`mt-8 w-48 h-px ${state.theme === 'green' ? 'bg-[#00ff00]/30' : state.theme === 'amber' ? 'bg-[#ffb000]/30' : 'bg-[#ff00ff]/30'} blur-[1px]`}></div>

          {/* Interaction Hint */}
          <div className="absolute bottom-4 text-xs opacity-40 font-mono flex gap-4 pointer-events-none md:pointer-events-auto">
             <span className="hidden md:inline cursor-pointer hover:opacity-100" onClick={(e) => { e.stopPropagation(); handlePoke(); }}>[戳一下]</span>
             <span className="cursor-pointer pointer-events-auto hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleFeed(); }}>[投喂零食]</span>
          </div>
          
          {/* Mobile Hint (visible only on small screens) */}
          <div className="absolute top-4 text-[10px] opacity-30 font-mono md:hidden pointer-events-none">
             [长按抚摸] [双击惊吓]
          </div>
        </div>

      </div>

      {/* Right/Bottom: Controls */}
      <div className="flex-1 md:w-96 md:flex-none bg-[#161616] border-t md:border-t-0 md:border-l border-[#2a2a2a] p-6 overflow-y-auto no-scrollbar flex flex-col gap-8 h-auto md:h-screen">
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            ASCII Buddy <Sparkles size={20} className="text-[#00ff00]" />
          </h1>
          <p className="text-sm text-gray-400">你的网页版终端电子宠物</p>
        </div>

        {/* Species Select */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">物种选择</h2>
          <div className="grid grid-cols-2 gap-2">
            {SPECIES.map(sp => (
              <button 
                key={sp}
                onClick={() => updateState({ species: sp })}
                className={`py-2 px-1 text-xs rounded border transition-colors ${state.species === sp ? 'bg-[#2a2a2a] border-[#555] text-white' : 'border-[#222] text-gray-500 hover:border-[#444] hover:text-gray-300'}`}
              >
                {SPECIES_ZH[sp]} ({sp})
              </button>
            ))}
          </div>
        </section>

        {/* Hat Select */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">帽子装饰</h2>
          <div className="grid grid-cols-4 gap-2">
            {HATS.map(h => (
              <button 
                key={h}
                onClick={() => updateState({ hat: h })}
                className={`py-2 px-1 text-xs rounded border transition-colors ${state.hat === h ? 'bg-[#2a2a2a] border-[#555] text-white' : 'border-[#222] text-gray-500 hover:border-[#444] hover:text-gray-300'}`}
              >
                {HAT_ZH[h]}
              </button>
            ))}
          </div>
        </section>

        {/* Eye Select */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">眼神状态</h2>
          <div className="flex flex-wrap gap-2">
            {EYES.map(e => (
              <button 
                key={e}
                onClick={() => updateState({ eye: e })}
                className={`w-10 h-10 font-mono text-lg rounded border transition-colors ${state.eye === e ? 'bg-[#2a2a2a] border-[#555] text-white' : 'border-[#222] text-gray-500 hover:border-[#444] hover:text-gray-300'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {/* Theme & Display */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings size={14} /> 屏幕显示
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {THEMES.map(t => (
                <button 
                  key={t}
                  onClick={() => updateState({ theme: t })}
                  className={`flex-1 py-2 text-xs rounded border transition-all ${state.theme === t ? `border-[${t === 'green' ? '#00ff00' : t === 'amber' ? '#ffb000' : '#ff00ff'}] bg-[#222] text-white` : 'border-[#222] text-gray-500 hover:border-[#444]'}`}
                  style={state.theme === t ? { borderColor: t === 'green' ? '#00ff00' : t === 'amber' ? '#ffb000' : '#ff00ff' } : {}}
                >
                  {t === 'green' ? '经典绿' : t === 'amber' ? '琥珀黄' : '赛博粉'}
                </button>
              ))}
            </div>
            
            <label className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded cursor-pointer hover:border-[#333] transition-colors">
              <input 
                type="checkbox" 
                checked={state.useCrt}
                onChange={(e) => updateState({ useCrt: e.target.checked })}
                className="w-4 h-4 accent-[#00ff00] bg-[#222] border-[#333]"
              />
              <span className="text-sm text-gray-300">开启复古 CRT 扫描线与发光特效</span>
            </label>
          </div>
        </section>

        {/* Export */}
        <section className="mt-auto pt-6 pb-8 md:pb-0">
          <div className="flex flex-col gap-2">
            <button 
              onClick={exportText}
              className="w-full flex items-center justify-center gap-2 bg-[#222] hover:bg-[#333] text-white py-3 px-4 rounded border border-[#444] transition-colors font-mono text-sm"
            >
              <Download size={16} /> {copyStatus === 'Copied ASCII!' ? '已复制 ASCII 码!' : '复制为 ASCII 纯文本'}
            </button>
            <button 
              onClick={exportBash}
              className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-[#1a1a1a] text-gray-400 py-2 px-4 rounded border border-[#222] transition-colors font-mono text-xs"
            >
               {copyStatus === 'Copied Bash script!' ? '已复制 Bash 脚本!' : '生成并复制为终端脚本 (.sh)'}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;