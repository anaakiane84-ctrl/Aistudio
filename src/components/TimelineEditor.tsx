import React, { useState } from 'react';
import {
  Play,
  Pause,
  Scissors,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TimelineData, TimelineClip, TimelineTrack } from '../types';

interface TimelineEditorProps {
  timeline: TimelineData;
  currentTimeSec: number;
  onTimeUpdate: (newTimeSec: number) => void;
  onUpdateTimeline: (updatedTimeline: TimelineData) => void;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  timeline,
  currentTimeSec,
  onTimeUpdate,
  onUpdateTimeline,
  selectedClipId,
  onSelectClip,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 4x zoom

  const duration = Math.max(10, timeline.durationSec || 20);
  const pxPerSec = 24 * zoomLevel; // Base timeline scale

  const handleTrackToggleMute = (trackId: string) => {
    const updatedTracks = timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, isMuted: !t.isMuted } : t
    );
    onUpdateTimeline({ ...timeline, tracks: updatedTracks });
  };

  const handleTrackToggleLock = (trackId: string) => {
    const updatedTracks = timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, isLocked: !t.isLocked } : t
    );
    onUpdateTimeline({ ...timeline, tracks: updatedTracks });
  };

  const handleSplitClipAtPlayhead = () => {
    if (!selectedClipId) return;

    let targetTrack: TimelineTrack | null = null;
    let targetClip: TimelineClip | null = null;

    for (const tr of timeline.tracks) {
      const found = tr.clips.find((c) => c.id === selectedClipId);
      if (found) {
        targetTrack = tr;
        targetClip = found;
        break;
      }
    }

    if (!targetClip || !targetTrack) return;

    // Check if playhead intersects clip
    const clipStart = targetClip.startTimeSec;
    const clipEnd = targetClip.startTimeSec + targetClip.durationSec;

    if (currentTimeSec > clipStart + 0.5 && currentTimeSec < clipEnd - 0.5) {
      const firstPartDuration = currentTimeSec - clipStart;
      const secondPartDuration = targetClip.durationSec - firstPartDuration;

      const firstClip: TimelineClip = {
        ...targetClip,
        durationSec: firstPartDuration,
      };

      const secondClip: TimelineClip = {
        ...targetClip,
        id: `clip_split_${Date.now()}`,
        name: `${targetClip.name} (pt 2)`,
        startTimeSec: currentTimeSec,
        durationSec: secondPartDuration,
      };

      const updatedClips = targetTrack.clips.flatMap((c) =>
        c.id === targetClip?.id ? [firstClip, secondClip] : [c]
      );

      const updatedTracks = timeline.tracks.map((tr) =>
        tr.id === targetTrack?.id ? { ...tr, clips: updatedClips } : tr
      );

      onUpdateTimeline({ ...timeline, tracks: updatedTracks });
    }
  };

  const handleDeleteSelectedClip = () => {
    if (!selectedClipId) return;

    const updatedTracks = timeline.tracks.map((tr) => ({
      ...tr,
      clips: tr.clips.filter((c) => c.id !== selectedClipId),
    }));

    onUpdateTimeline({ ...timeline, tracks: updatedTracks });
    onSelectClip(null);
  };

  return (
    <div className="h-64 bg-zinc-900 border-t border-zinc-800 flex flex-col select-none z-20">
      {/* Timeline Controls Header */}
      <div className="h-10 border-b border-zinc-800 px-4 flex items-center justify-between text-xs text-zinc-300 bg-zinc-950">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSplitClipAtPlayhead}
            disabled={!selectedClipId}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition-colors"
            title="Dividir Clipe no Reproduzir (S)"
          >
            <Scissors className="w-3.5 h-3.5 text-violet-400" />
            <span>Dividir</span>
          </button>

          <button
            onClick={handleDeleteSelectedClip}
            disabled={!selectedClipId}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-400 disabled:opacity-40 transition-colors"
            title="Excluir Clipe Selecionado"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>

          <div className="h-3 w-px bg-zinc-800" />

          <span className="text-zinc-500 text-[11px]">
            {selectedClipId ? 'Clipe selecionado' : 'Clique em um clipe para editar'}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-zinc-500">Zoom:</span>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-zinc-400 w-8 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Timeline Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Headers (Left Column) */}
        <div className="w-52 bg-zinc-950 border-r border-zinc-800 shrink-0 z-10 flex flex-col">
          {/* Header Spacer for Time Ruler */}
          <div className="h-7 border-b border-zinc-800 bg-zinc-900/60 px-3 flex items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Faixas de Mídia
          </div>

          <div className="flex-1 overflow-y-auto">
            {timeline.tracks.map((track) => (
              <div
                key={track.id}
                className="h-11 border-b border-zinc-800/80 px-3 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-200 truncate" title={track.title}>
                    {track.title}
                  </span>
                </div>

                <div className="flex items-center space-x-1 opacity-70 hover:opacity-100">
                  <button
                    onClick={() => handleTrackToggleMute(track.id)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                    title={track.isMuted ? 'Ativar Áudio' : 'Silenciar Faixa'}
                  >
                    {track.isMuted ? (
                      <VolumeX className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTrackToggleLock(track.id)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                    title={track.isLocked ? 'Desbloquear Faixa' : 'Bloquear Faixa'}
                  >
                    {track.isLocked ? (
                      <Lock className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks Canvas & Playhead (Right Column) */}
        <div className="flex-1 overflow-x-auto relative flex flex-col">
          {/* Timecode Ruler */}
          <div
            className="h-7 border-b border-zinc-800 bg-zinc-950 relative shrink-0 cursor-pointer"
            style={{ width: `${duration * pxPerSec}px` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newTime = Math.max(0, Math.min(duration, clickX / pxPerSec));
              onTimeUpdate(Number(newTime.toFixed(1)));
            }}
          >
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 border-l border-zinc-800 text-[9px] font-mono text-zinc-500 pl-1 pt-0.5 select-none"
                style={{ left: `${sec * pxPerSec}px` }}
              >
                {sec % 2 === 0 ? `${sec}s` : ''}
              </div>
            ))}
          </div>

          {/* Tracks Area */}
          <div
            className="flex-1 relative overflow-y-auto"
            style={{ width: `${duration * pxPerSec}px` }}
          >
            {/* Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none"
              style={{ left: `${currentTimeSec * pxPerSec}px` }}
            >
              <div className="w-3 h-3 bg-rose-500 -ml-1.25 rounded-b border border-white/40 shadow-md" />
            </div>

            {timeline.tracks.map((track) => (
              <div
                key={track.id}
                className="h-11 border-b border-zinc-800/80 relative bg-zinc-950/40 flex items-center px-1"
              >
                {track.clips.map((clip) => {
                  const isSelected = selectedClipId === clip.id;
                  const clipWidth = clip.durationSec * pxPerSec;
                  const clipLeft = clip.startTimeSec * pxPerSec;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip.id);
                      }}
                      className={`absolute h-8 rounded-lg border px-2.5 flex items-center justify-between text-xs font-semibold cursor-pointer transition-all shadow-sm truncate ${
                        clip.color || 'bg-violet-600'
                      } ${
                        isSelected
                          ? 'ring-2 ring-white border-white scale-[1.02] z-10'
                          : 'border-white/20 hover:brightness-110'
                      }`}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                      }}
                      title={`${clip.name} (${clip.durationSec}s)`}
                    >
                      <span className="truncate text-white text-[11px]">{clip.name}</span>
                      <span className="text-[9px] font-mono text-white/70 ml-1">
                        {clip.durationSec}s
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
