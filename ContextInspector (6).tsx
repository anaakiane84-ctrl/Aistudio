import React from 'react';
import {
  SlidersHorizontal,
  Wand2,
  Clock,
  Volume2,
  Sparkles,
  Layers,
  Video,
  X,
  Type,
} from 'lucide-react';
import { Project, Scene } from '../types';
import { VOICE_STYLES } from '../data/voices';
import { TRANSITIONS } from '../data/creativeLibrary';

interface ContextInspectorProps {
  project: Project;
  activeSceneId: string | null;
  onUpdateProject: (updated: Project) => void;
  onGenerateSceneVisual: (sceneId: string) => void;
  onClose: () => void;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  project,
  activeSceneId,
  onUpdateProject,
  onGenerateSceneVisual,
  onClose,
}) => {
  const activeScene = project.scenes.find((s) => s.id === activeSceneId) || project.scenes[0];

  if (!activeScene) {
    return (
      <div className="w-72 bg-zinc-900 border-l border-zinc-800 p-4 text-xs text-zinc-500 text-center flex items-center justify-center">
        Selecione uma cena para editar suas propriedades.
      </div>
    );
  }

  const handleUpdateScene = (field: keyof Scene, value: any) => {
    const updatedScenes = project.scenes.map((s) =>
      s.id === activeScene.id ? { ...s, [field]: value } : s
    );
    onUpdateProject({ ...project, scenes: updatedScenes });
  };

  return (
    <div className="w-72 sm:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 select-none z-20">
      {/* Inspector Header */}
      <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-violet-400" />
          <h3 className="font-bold text-xs text-zinc-100 truncate">
            Propriedades da Cena #{activeScene.order}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Scene Title */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-zinc-400">Título da Cena</label>
          <input
            type="text"
            value={activeScene.title}
            onChange={(e) => handleUpdateScene('title', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Scene Duration */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-zinc-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-violet-400" />
              <span>Duração da Cena (segundos)</span>
            </label>
            <span className="font-mono text-xs text-violet-300 font-bold">
              {activeScene.estimatedDurationSec}s
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={15}
            step={0.5}
            value={activeScene.estimatedDurationSec}
            onChange={(e) => handleUpdateScene('estimatedDurationSec', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        {/* Narration Text */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-zinc-400">
            Texto de Narração
          </label>
          <textarea
            rows={3}
            value={activeScene.narrationText}
            onChange={(e) => handleUpdateScene('narrationText', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
          />
        </div>

        {/* Visual Prompt */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-zinc-400">
            Prompt Visual para IA
          </label>
          <textarea
            rows={3}
            value={activeScene.visualPrompt}
            onChange={(e) => handleUpdateScene('visualPrompt', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 italic focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
          />
        </div>

        {/* Negative Prompt */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-zinc-400">
            Prompt Negativo (O que evitar)
          </label>
          <input
            type="text"
            value={activeScene.negativePrompt || ''}
            onChange={(e) => handleUpdateScene('negativePrompt', e.target.value)}
            placeholder="Ex: desfocado, marca d'água, texto..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-400 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Transition Out */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-zinc-400">
            Transição de Saída
          </label>
          <select
            value={activeScene.transitionOut}
            onChange={(e) => handleUpdateScene('transitionOut', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
          >
            {TRANSITIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Regenerate Scene Visual */}
        <button
          onClick={() => onGenerateSceneVisual(activeScene.id)}
          className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-md transition-colors mt-2"
        >
          <Wand2 className="w-4 h-4 text-violet-200" />
          <span>Regenerar Vídeo/Imagem com IA</span>
        </button>
      </div>
    </div>
  );
};
