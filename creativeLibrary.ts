import React from 'react';
import {
  Video,
  Plus,
  Play,
  Download,
  Smartphone,
  Tv,
  Square,
  RotateCcw,
  RotateCw,
  Check,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { AspectRatio } from '../types';

interface HeaderProps {
  projectTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  onOpenDashboard: () => void;
  onNewProject: () => void;
  onPreview: () => void;
  onExport: () => void;
  isSaving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle,
  onUpdateTitle,
  aspectRatio,
  onChangeAspectRatio,
  onOpenDashboard,
  onNewProject,
  onPreview,
  onExport,
  isSaving = false,
}) => {
  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between text-zinc-100 select-none z-30 relative">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenDashboard}
          className="flex items-center space-x-2 text-violet-400 hover:text-violet-300 transition-colors font-bold text-lg tracking-tight group"
          title="Ver todos os projetos"
        >
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Video className="w-4 h-4 text-violet-400" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent font-extrabold">
            CineScript AI
          </span>
        </button>

        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

        <button
          onClick={onOpenDashboard}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
        >
          <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span>Projetos</span>
        </button>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="bg-transparent hover:bg-zinc-800/60 focus:bg-zinc-800 text-sm font-semibold text-zinc-100 px-2 py-1 rounded border border-transparent focus:border-violet-500 focus:outline-none transition-all max-w-[200px] sm:max-w-[280px] truncate"
            placeholder="Título do projeto..."
          />
          {isSaving ? (
            <span className="text-[10px] text-zinc-500 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Salvando...
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400/80 flex items-center gap-1 hidden md:flex">
              <Check className="w-3 h-3" />
              Salvo
            </span>
          )}
        </div>
      </div>

      {/* Middle Controls: Aspect Ratio & Undo/Redo */}
      <div className="hidden md:flex items-center space-x-3 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800/80">
        <span className="text-[11px] text-zinc-400 font-medium px-1">Formato:</span>
        <div className="flex items-center bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
          <button
            onClick={() => onChangeAspectRatio('9:16')}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              aspectRatio === '9:16'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Vertical 9:16 (Shorts / Reels / TikTok)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => onChangeAspectRatio('16:9')}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              aspectRatio === '16:9'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Horizontal 16:9 (YouTube / TV)"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>16:9</span>
          </button>
          <button
            onClick={() => onChangeAspectRatio('1:1')}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              aspectRatio === '1:1'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Quadrado 1:1 (Instagram / Feed)"
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1</span>
          </button>
        </div>

        <div className="h-3 w-px bg-zinc-800" />

        <div className="flex items-center space-x-1">
          <button
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Desfazer (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Refazer (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onNewProject}
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700/60"
        >
          <Plus className="w-3.5 h-3.5 text-violet-400" />
          <span>Novo Projeto</span>
        </button>

        <button
          onClick={onPreview}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700/60"
        >
          <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
          <span className="hidden sm:inline">Prévia</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  );
};
