import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS, LEVELS, QUOTES } from '../constants';
import { Color, Point, Level, Difficulty } from '../types';
import { Trophy, RotateCcw, ChevronLeft, ChevronRight, Play, Grid, X, Volume2, VolumeX, BarChart } from 'lucide-react';
import { soundManager } from '../lib/soundManager';

const PathConnect = () => {
  const [levelIdx, setLevelIdx] = useState(0);
  const currentLevel = LEVELS[levelIdx];
  const [paths, setPaths] = useState<Record<string, Point[]>>({});
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animatingDots, setAnimatingDots] = useState<Record<string, 'pulse' | 'shake' | null>>({});
  const [time, setTime] = useState(0);
  const [currentQuote, setCurrentQuote] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(currentLevel.difficulty);
  const gridRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isWin && !showLevelSelector) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWin, showLevelSelector, levelIdx]);

  const triggerDotAnimation = (pos: Point, type: 'pulse' | 'shake') => {
    const key = `${pos.x},${pos.y}`;
    setAnimatingDots(prev => ({ ...prev, [key]: type }));
    setTimeout(() => {
      setAnimatingDots(prev => ({ ...prev, [key]: null }));
    }, 500);
  };

  // Initialize paths for the level
  useEffect(() => {
    const initialPaths: Record<string, Point[]> = {};
    currentLevel.dots.forEach(dot => {
      if (!initialPaths[dot.color]) {
        initialPaths[dot.color] = [];
      }
    });
    setPaths(initialPaths);
    setAnimatingDots({});
    setIsWin(false);
    setCurrentQuote("");
    setTime(0);
    setSelectedDifficulty(currentLevel.difficulty);
  }, [levelIdx, currentLevel]);

  // Handle sound toggle
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const getCellFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.floor(((clientX - rect.left) / rect.width) * currentLevel.size);
    const y = Math.floor(((clientY - rect.top) / rect.height) * currentLevel.size);

    if (x >= 0 && x < currentLevel.size && y >= 0 && y < currentLevel.size) {
      return { x, y };
    }
    return null;
  };

  const isDot = (p: Point) => {
    return currentLevel.dots.find(d => d.pos.x === p.x && d.pos.y === p.y);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isWin) return;
    if ('button' in e && e.button !== 0) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const dot = isDot(cell);
    if (dot) {
      setActiveColor(dot.color);
      setIsDragging(true);
      setPaths(prev => ({
        ...prev,
        [dot.color]: [cell]
      }));
      soundManager.playStart();
      triggerDotAnimation(cell, 'pulse');
    } else {
      // Check if clicked on an existing path to pick it up
      let foundPath = false;
      for (const [color, path] of Object.entries(paths) as [Color, Point[]][]) {
        const idx = path.findIndex(p => p.x === cell.x && p.y === cell.y);
        if (idx !== -1) {
          setActiveColor(color);
          setIsDragging(true);
          setPaths(prev => ({
            ...prev,
            [color]: path.slice(0, idx + 1)
          }));
          soundManager.playStart();
          foundPath = true;
          break;
        }
      }
      
      // If no path found, we might want to allow starting from a dot even if not exactly on it
      // but standard Flow Free requires clicking the dot or path.
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !activeColor || isWin) return;
    
    // Prevent scrolling on touch
    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }

    const cell = getCellFromEvent(e);
    if (!cell) return;

    setPaths(prevPaths => {
      const currentPath = prevPaths[activeColor] || [];
      const lastPoint = currentPath[currentPath.length - 1];

      if (!lastPoint || (cell.x === lastPoint.x && cell.y === lastPoint.y)) return prevPaths;

      // Check if moving to an existing point in the current path (backtracking)
      const existingIdx = currentPath.findIndex(p => p.x === cell.x && p.y === cell.y);
      if (existingIdx !== -1) {
        if (existingIdx < currentPath.length - 1) {
          soundManager.playMove();
          return {
            ...prevPaths,
            [activeColor]: currentPath.slice(0, existingIdx + 1)
          };
        }
        return prevPaths;
      }

      // If we've already reached the target dot, don't allow extending further
      const lastIsDot = isDot(lastPoint);
      const startDot = currentLevel.dots.find(d => d.color === activeColor);
      const isTargetDot = lastIsDot && lastIsDot.color === activeColor && 
                         (lastPoint.x !== startDot?.pos.x || lastPoint.y !== startDot?.pos.y);
      
      if (isTargetDot && currentPath.length > 1) return prevPaths;

      // Interpolation: Step-by-step orthogonal movement
      let workingPaths = { ...prevPaths };
      let workingPath = [...currentPath];
      let currentX = lastPoint.x;
      let currentY = lastPoint.y;
      let safety = 0;
      const maxSteps = currentLevel.size * 3;
      let completed = false;
      let collisionOccurred = false;

      while ((currentX !== cell.x || currentY !== cell.y) && safety < maxSteps) {
        safety++;
        const dx = cell.x - currentX;
        const dy = cell.y - currentY;
        
        let nextX = currentX;
        let nextY = currentY;
        
        if (Math.abs(dx) >= Math.abs(dy)) {
          nextX += dx > 0 ? 1 : -1;
        } else {
          nextY += dy > 0 ? 1 : -1;
        }
        
        const nextPoint = { x: nextX, y: nextY };

        // Check for self-collision (looping back)
        const selfIdx = workingPath.findIndex(p => p.x === nextPoint.x && p.y === nextPoint.y);
        if (selfIdx !== -1) {
          workingPath = workingPath.slice(0, selfIdx + 1);
          currentX = nextX;
          currentY = nextY;
          continue;
        }

        // Check for collisions with other paths
        let collisionColor: Color | null = null;
        for (const [color, path] of Object.entries(workingPaths) as [Color, Point[]][]) {
          if (color === activeColor) continue;
          if (path.some(p => p.x === nextPoint.x && p.y === nextPoint.y)) {
            collisionColor = color;
            break;
          }
        }

        if (collisionColor) {
          workingPaths[collisionColor] = [];
          soundManager.playError();
          const dot = isDot(nextPoint);
          if (dot) triggerDotAnimation(nextPoint, 'shake');
          collisionOccurred = true;
          break; // Stop interpolation at collision
        }

        // Check if we hit a dot of a different color
        const dot = isDot(nextPoint);
        if (dot && dot.color !== activeColor) {
          soundManager.playError();
          triggerDotAnimation(nextPoint, 'shake');
          collisionOccurred = true;
          break; // Blocked by different dot
        }

        workingPath.push(nextPoint);
        currentX = nextX;
        currentY = nextY;

        // If we hit our own target dot, stop here
        if (dot && dot.color === activeColor) {
          completed = true;
          break;
        }
      }

      if (workingPath.length > currentPath.length || collisionOccurred) {
        if (completed) {
          soundManager.playComplete();
          currentLevel.dots.filter(d => d.color === activeColor).forEach(d => {
            triggerDotAnimation(d.pos, 'pulse');
          });
        } else if (!collisionOccurred) {
          soundManager.playMove();
        }
        
        return {
          ...workingPaths,
          [activeColor]: workingPath
        };
      }

      return prevPaths;
    });
  };


  const handleEnd = () => {
    setIsDragging(false);
    setActiveColor(null);
  };

  // Check win condition
  useEffect(() => {
    if (isWin) return;

    const allConnected = currentLevel.dots.every(dot => {
      const path = paths[dot.color] || [];
      if (path.length < 2) return false;
      const start = path[0];
      const end = path[path.length - 1];
      const dotPairs = currentLevel.dots.filter(d => d.color === dot.color);
      const isStartDot = dotPairs.some(d => d.pos.x === start.x && d.pos.y === start.y);
      const isEndDot = dotPairs.some(d => d.pos.x === end.x && d.pos.y === end.y);
      return isStartDot && isEndDot && (start.x !== end.x || start.y !== end.y);
    });

    if (allConnected) {
      const filledCells = new Set();
      (Object.values(paths) as Point[][]).forEach(path => {
        path.forEach(p => filledCells.add(`${p.x},${p.y}`));
      });
      
      if (filledCells.size === currentLevel.size * currentLevel.size) {
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)] || "Great job!";
        setCurrentQuote(randomQuote);
        setIsWin(true);
        soundManager.playWin();
      }
    }
  }, [paths, currentLevel, isWin]);

  // Auto-advance to next level
  useEffect(() => {
    if (isWin && levelIdx < LEVELS.length - 1) {
      const timer = setTimeout(() => {
        setLevelIdx(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isWin, levelIdx]);

  const resetLevel = () => {
    const initialPaths: Record<string, Point[]> = {};
    currentLevel.dots.forEach(dot => {
      if (!initialPaths[dot.color]) {
        initialPaths[dot.color] = [];
      }
    });
    setPaths(initialPaths);
    setIsWin(false);
    setCurrentQuote("");
    setTime(0);
  };

  const nextLevel = () => {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx(prev => prev + 1);
      setShowLevelSelector(false);
      setIsWin(false);
      setCurrentQuote("");
    }
  };

  const prevLevel = () => {
    if (levelIdx > 0) {
      setLevelIdx(prev => prev - 1);
      setShowLevelSelector(false);
      setIsWin(false);
      setCurrentQuote("");
    }
  };

  const selectLevel = (idx: number) => {
    setLevelIdx(idx);
    setShowLevelSelector(false);
    setIsWin(false);
    setCurrentQuote("");
  };

  const strokeWidth = Math.max(4, 16 - currentLevel.size);

  const filteredLevels = LEVELS.filter(l => l.difficulty === selectedDifficulty);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4 select-none touch-none">
      <div className="max-w-md w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-200 leading-none">Path Connect</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest ${
                currentLevel.difficulty === 'Easy' ? 'bg-green-900/50 text-green-400' :
                currentLevel.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                'bg-red-900/50 text-red-400'
              }`}>
                {currentLevel.difficulty}
              </span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Level {currentLevel.id}</span>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{currentLevel.size}x{currentLevel.size} Grid</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                {formatTime(time)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={() => setShowLevelSelector(true)}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={resetLevel}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative aspect-square w-full bg-zinc-950 rounded-3xl p-3 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-900">
          <div 
            ref={gridRef}
            className="grid w-full h-full relative rounded-2xl overflow-hidden"
            style={{ 
              gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)`,
              gridTemplateRows: `repeat(${currentLevel.size}, 1fr)`
            }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
          >
            {/* Grid Lines */}
            {Array.from({ length: currentLevel.size * currentLevel.size }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-zinc-900/50" />
            ))}

            {/* Paths Layer */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {(Object.entries(paths) as [Color, Point[]][]).map(([color, path]) => {
                if (path.length < 2) return null;
                const cellSize = 100 / currentLevel.size;
                
                // Smoothing logic: Add quadratic curves at corners
                let d = "";
                const cornerRadius = 0.5; // Maximum fluidity
                
                path.forEach((p, i) => {
                  const x = (p.x + 0.5) * cellSize;
                  const y = (p.y + 0.5) * cellSize;

                  if (i === 0) {
                    d += `M ${x} ${y}`;
                  } else if (i === path.length - 1) {
                    d += ` L ${x} ${y}`;
                  } else {
                    const prev = path[i - 1];
                    const next = path[i + 1];
                    
                    const dxPrev = p.x - prev.x;
                    const dyPrev = p.y - prev.y;
                    const dxNext = next.x - p.x;
                    const dyNext = next.y - p.y;
                    
                    if (dxPrev === dxNext && dyPrev === dyNext) {
                      d += ` L ${x} ${y}`;
                    } else {
                      const startX = (p.x + 0.5 - dxPrev * cornerRadius) * cellSize;
                      const startY = (p.y + 0.5 - dyPrev * cornerRadius) * cellSize;
                      const endX = (p.x + 0.5 + dxNext * cornerRadius) * cellSize;
                      const endY = (p.y + 0.5 + dyNext * cornerRadius) * cellSize;
                      
                      d += ` L ${startX} ${startY} Q ${x} ${y} ${endX} ${endY}`;
                    }
                  }
                });

                return (
                  <React.Fragment key={color}>
                    {/* Glow Path */}
                    <motion.path
                      d={d}
                      stroke={COLORS[color]}
                      strokeWidth={strokeWidth * 2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.15 }}
                      transition={{ duration: 0.2 }}
                    />
                    {/* Main Path */}
                    <motion.path
                      d={d}
                      stroke={COLORS[color]}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.15 }}
                    />
                  </React.Fragment>
                );
              })}
            </svg>

            {/* Dots Layer */}
            {currentLevel.dots.map((dot, i) => {
              const animType = animatingDots[`${dot.pos.x},${dot.pos.y}`];
              return (
                <div 
                  key={i}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{
                    width: `${100 / currentLevel.size}%`,
                    height: `${100 / currentLevel.size}%`,
                    left: `${(dot.pos.x / currentLevel.size) * 100}%`,
                    top: `${(dot.pos.y / currentLevel.size) * 100}%`,
                  }}
                >
                  <motion.div 
                    className="w-1/2 h-1/2 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-black/20"
                    style={{ backgroundColor: COLORS[dot.color] }}
                    animate={
                      animType === 'pulse' 
                        ? { scale: [1, 1.3, 1] } 
                        : animType === 'shake' 
                        ? { x: [0, -5, 5, -5, 5, 0] } 
                        : { scale: 1, x: 0 }
                    }
                    transition={{ duration: animType === 'pulse' ? 0.4 : 0.3 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Win Overlay */}
          <AnimatePresence>
            {isWin && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 rounded-3xl backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.5, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="bg-zinc-900 p-8 rounded-full mb-6 border border-zinc-800 shadow-2xl"
                >
                  <Trophy size={80} className="text-yellow-500" />
                </motion.div>
                <h2 className="text-5xl font-black italic uppercase mb-1 tracking-tighter">Solved</h2>
                <p className="text-zinc-500 mb-2 font-mono text-xs uppercase tracking-[0.3em]">Perfect Connection</p>
                <p className="text-white mb-6 font-mono text-xl font-black tracking-tighter italic">Time: {formatTime(time)}</p>
                
                <div className="max-w-md px-8 mb-8">
                  <p className="text-zinc-400 font-serif italic text-lg leading-relaxed text-center">
                    "{currentQuote}"
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={nextLevel}
                    className="px-10 py-4 bg-white text-black font-black uppercase italic tracking-tighter rounded-2xl flex items-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                  >
                    Next Level <Play size={20} fill="black" />
                  </button>
                  {levelIdx < LEVELS.length - 1 && (
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
                      Auto-advancing...
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Level Selector Overlay */}
          <AnimatePresence>
            {showLevelSelector && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-30 flex flex-col bg-zinc-950 rounded-3xl border border-zinc-800 p-6 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Select Level</h3>
                  <button onClick={() => setShowLevelSelector(false)} className="p-2 hover:bg-zinc-900 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                {/* Difficulty Tabs */}
                <div className="flex gap-2 mb-6">
                  {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        selectedDifficulty === diff 
                          ? 'bg-white text-black border-white' 
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                  {LEVELS.map((level, i) => {
                    if (level.difficulty !== selectedDifficulty) return null;
                    return (
                      <button
                        key={level.id}
                        onClick={() => selectLevel(i)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all border ${
                          i === levelIdx 
                            ? 'bg-white text-black border-white' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-sm font-black">{level.id}</span>
                        <span className="text-[8px] font-mono opacity-50">{level.size}x{level.size}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center px-2">
          <button 
            onClick={prevLevel}
            disabled={levelIdx === 0}
            className="group flex items-center gap-3 text-zinc-600 hover:text-white disabled:opacity-10 transition-all font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600">
              <ChevronLeft size={16} />
            </div>
            Prev
          </button>
          
          <div className="text-center">
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Progress</div>
            <div className="flex gap-1.5">
              {LEVELS.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${
                    i === levelIdx ? 'bg-white scale-150' : i < levelIdx ? 'bg-zinc-600' : 'bg-zinc-900'
                  }`} 
                />
              ))}
            </div>
          </div>

          <button 
            onClick={nextLevel}
            disabled={levelIdx === LEVELS.length - 1}
            className="group flex items-center gap-3 text-zinc-600 hover:text-white disabled:opacity-10 transition-all font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            Next
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600">
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
};

export default PathConnect;

