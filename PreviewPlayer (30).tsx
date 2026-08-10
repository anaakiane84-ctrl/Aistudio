import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Project, CaptionCue, Scene } from '../types';

interface PreviewPlayerProps {
  project: Project;
  currentTimeSec: number;
  onTimeUpdate: (newTimeSec: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  project,
  currentTimeSec,
  onTimeUpdate,
  isPlaying,
  onTogglePlay,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalDuration = Math.max(
    5,
    project.scenes.reduce((acc, s) => acc + (s.estimatedDurationSec || 4), 0)
  );

  // Auto time progression during playback
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onTimeUpdate(
          currentTimeSec >= totalDuration ? 0 : Number((currentTimeSec + 0.1).toFixed(1))
        );
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTimeSec, totalDuration, onTimeUpdate]);

  // Determine current active scene based on playhead time
  let activeScene: Scene | null = null;
  let accumulatedTime = 0;

  for (const scene of project.scenes) {
    const sceneDur = scene.estimatedDurationSec || 4;
    if (currentTimeSec >= accumulatedTime && currentTimeSec < accumulatedTime + sceneDur) {
      activeScene = scene;
      break;
    }
    accumulatedTime += sceneDur;
  }

  if (!activeScene && project.scenes.length > 0) {
    activeScene = project.scenes[project.scenes.length - 1];
  }

  // Determine current active caption cue
  const activeCue = project.captions.cues.find(
    (c) => currentTimeSec >= c.startTimeSec && currentTimeSec <= c.endTimeSec
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // Aspect ratio styling
  const getAspectRatioClass = () => {
    switch (project.settings.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[520px] w-auto';
      case '16:9':
        return 'aspect-[16/9] w-full max-w-[720px] h-auto';
      case '1:1':
        return 'aspect-square max-h-[480px] w-auto';
    }
  };

  const captionStyle = project.captions.style;

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 p-4 overflow-hidden justify-between select-none relative">
      {/* Player Canvas Frame */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        <div
          ref={containerRef}
          className={`relative bg-black rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-300 ${getAspectRatioClass()}`}
        >
          {/* Active Scene Media Layer */}
          {activeScene?.imageMediaUrl ? (
            <img
              src={activeScene.imageMediaUrl}
              alt={activeScene.title}
              className="w-full h-full object-cover transition-all duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 p-6 text-center space-y-2">
              <span className="text-xs font-semibold text-zinc-400">Gerando visual por IA...</span>
              <p className="text-[10px] text-zinc-600 italic max-w-xs">{activeScene?.visualPrompt}</p>
            </div>
          )}

          {/* Subtitle Overlay */}
          {activeCue && (
            <div
              className={`absolute left-4 right-4 text-center z-20 pointer-events-none transition-all ${
                captionStyle.positionY === 'top'
                  ? 'top-8'
                  : captionStyle.positionY === 'center'
                  ? 'top-1/2 -translate-y-1/2'
                  : 'bottom-10'
              }`}
            >
              <div
                className="inline-block rounded-xl px-4 py-2 font-bold max-w-full text-balance shadow-2xl"
                style={{
                  fontFamily: captionStyle.fontFamily || 'sans-serif',
                  fontSize: `${captionStyle.fontSize || 22}px`,
                  color: captionStyle.color || '#FFFFFF',
                  backgroundColor: captionStyle.backgroundColor || 'rgba(0,0,0,0.7)',
                  textTransform: captionStyle.textTransform || 'none',
                  WebkitTextStroke: `${captionStyle.outlineWidth || 0}px ${captionStyle.outlineColor || '#000'}`,
                }}
              >
                {activeCue.words && activeCue.words.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {activeCue.words.map((w, idx) => {
                      const isWordActive =
                        currentTimeSec >= w.startTimeSec && currentTimeSec <= w.endTimeSec;
                      return (
                        <span
                          key={idx}
                          style={{
                            color: isWordActive
                              ? captionStyle.highlightColor || '#FFE600'
                              : captionStyle.color,
                            transform: isWordActive ? 'scale(1.08)' : 'scale(1.0)',
                            transition: 'transform 0.1s ease',
                          }}
                          className="inline-block font-black"
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span>{activeCue.text}</span>
                )}
              </div>
            </div>
          )}

          {/* Watermark / Logo Overlay */}
          <div className="absolute top-3 right-3 text-[10px] font-bold text-white/40 tracking-wider bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
            CineScript AI
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center justify-between space-x-4 max-w-2xl mx-auto w-full z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTimeUpdate(0)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Início"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 transition-transform active:scale-95"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onTimeUpdate(Math.min(totalDuration, currentTimeSec + 2))}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Avançar 2s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timecode & Scrubber */}
        <div className="flex-1 flex items-center space-x-3">
          <span className="font-mono text-xs text-zinc-300 font-medium">
            {formatTime(currentTimeSec)}
          </span>
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.1}
            value={currentTimeSec}
            onChange={(e) => onTimeUpdate(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <span className="font-mono text-xs text-zinc-500">{formatTime(totalDuration)}</span>
        </div>

        {/* Volume & Fullscreen */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
