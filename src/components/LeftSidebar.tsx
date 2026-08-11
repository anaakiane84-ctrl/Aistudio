import React, { useState } from 'react';
import {
  Film,
  Volume2,
  Upload,
  Type,
  Sparkles,
  Smile,
  User,
  Plus,
  Play,
  Wand2,
  Trash2,
  Copy,
  ChevronDown,
  Check,
  Palette,
  SlidersHorizontal,
  Loader2,
  Music,
} from 'lucide-react';
import { Project, Scene, VoiceStyle, CaptionTrack } from '../types';
import { VOICE_STYLES, getVoiceById } from '../data/voices';
import { ANIMATIONS, TRANSITIONS, EFFECTS, FILTERS, STICKERS } from '../data/creativeLibrary';

interface LeftSidebarProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  activeSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onGenerateVoiceForScene: (sceneId: string, voiceId: string) => void;
  onGenerateSceneVisual: (sceneId: string) => void;
}

type TabType = 'scenes' | 'voices' | 'media' | 'captions' | 'effects' | 'stickers' | 'avatar';

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  project,
  onUpdateProject,
  activeSceneId,
  onSelectScene,
  onGenerateVoiceForScene,
  onGenerateSceneVisual,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('scenes');
  const [isGeneratingAllVoice, setIsGeneratingAllVoice] = useState(false);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);

  // Tab 1: Scenes Management
  const handleAddScene = () => {
    const newSceneNumber = project.scenes.length + 1;
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      order: newSceneNumber,
      title: `Cena ${newSceneNumber}`,
      narrationText: 'Digite a nova frase de narração...',
      estimatedDurationSec: 4,
      visualPrompt: 'Cena cinematográfica em alta definição...',
      characterIds: [],
      transitionOut: 'dissolve',
      status: 'completed',
      imageMediaUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1080&h=1920&q=80',
    };

    onUpdateProject({
      ...project,
      scenes: [...project.scenes, newScene],
    });
  };

  const handleDuplicateScene = (scene: Scene) => {
    const duplicated: Scene = {
      ...scene,
      id: `scene_${Date.now()}`,
      title: `${scene.title} (Cópia)`,
    };
    onUpdateProject({
      ...project,
      scenes: [...project.scenes, duplicated],
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    if (project.scenes.length <= 1) {
      alert('O vídeo deve ter pelo menos uma cena.');
      return;
    }
    onUpdateProject({
      ...project,
      scenes: project.scenes.filter((s) => s.id !== sceneId),
    });
  };

  const handleUpdateSceneText = (sceneId: string, text: string) => {
    const updatedScenes = project.scenes.map((s) =>
      s.id === sceneId ? { ...s, narrationText: text } : s
    );
    onUpdateProject({ ...project, scenes: updatedScenes });
  };

  const handleUpdateScenePrompt = (sceneId: string, prompt: string) => {
    const updatedScenes = project.scenes.map((s) =>
      s.id === sceneId ? { ...s, visualPrompt: prompt } : s
    );
    onUpdateProject({ ...project, scenes: updatedScenes });
  };

  // Generate Voice for all scenes
  const handleGenerateAllVoice = async () => {
    setIsGeneratingAllVoice(true);
    for (const scene of project.scenes) {
      await onGenerateVoiceForScene(scene.id, project.settings.defaultVoiceId);
    }
    setIsGeneratingAllVoice(false);
  };

  return (
    <div className="w-80 sm:w-96 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 select-none z-20">
      {/* Sidebar Top Nav Tabs */}
      <div className="flex items-center overflow-x-auto bg-zinc-950 border-b border-zinc-800 p-1 space-x-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('scenes')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'scenes'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Cenas</span>
        </button>

        <button
          onClick={() => setActiveTab('voices')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'voices'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Vozes</span>
        </button>

        <button
          onClick={() => setActiveTab('captions')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'captions'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Legendas</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'effects'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Efeitos</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'media'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Mídia</span>
        </button>

        <button
          onClick={() => setActiveTab('stickers')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'stickers'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Stickers</span>
        </button>

        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'avatar'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Avatar</span>
        </button>
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: CENAS */}
        {activeTab === 'scenes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-100">Divisão de Cenas</h3>
                <p className="text-[11px] text-zinc-400">
                  {project.scenes.length} Cenas na linha do tempo
                </p>
              </div>

              <button
                onClick={handleAddScene}
                className="flex items-center space-x-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Cena</span>
              </button>
            </div>

            <div className="space-y-3">
              {project.scenes.map((scene, idx) => {
                const isActive = activeSceneId === scene.id;
                return (
                  <div
                    key={scene.id}
                    onClick={() => onSelectScene(scene.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-violet-950/40 border-violet-500/80 shadow-md ring-1 ring-violet-500/30'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-zinc-200 truncate">
                          {scene.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateScene(scene);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                          title="Duplicar Cena"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScene(scene);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                          title="Excluir Cena"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Narration Text Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-zinc-400">
                        Texto da Narração
                      </label>
                      <textarea
                        rows={2}
                        value={scene.narrationText}
                        onChange={(e) => handleUpdateSceneText(scene.id, e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                      />
                    </div>

                    {/* Visual Prompt Input */}
                    <div className="space-y-1.5 mt-2">
                      <label className="block text-[10px] font-semibold text-zinc-400">
                        Prompt Visual IA
                      </label>
                      <textarea
                        rows={2}
                        value={scene.visualPrompt}
                        onChange={(e) => handleUpdateScenePrompt(scene.id, e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 italic focus:outline-none focus:border-violet-500 transition-colors resize-none"
                      />
                    </div>

                    {/* Quick Action Button for Scene Visual */}
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500">
                        Duração: {scene.estimatedDurationSec}s
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateSceneVisual(scene.id);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-violet-600 text-zinc-300 hover:text-white text-[11px] font-semibold transition-colors"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>Gerar Visual IA</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VOZES (CapCut-inspired Styles) */}
        {activeTab === 'voices' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Catálogo de Vozes com IA</h3>
              <p className="text-[11px] text-zinc-400">
                Selecione a voz principal para a narração do projeto:
              </p>
            </div>

            <button
              onClick={handleGenerateAllVoice}
              disabled={isGeneratingAllVoice}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
            >
              {isGeneratingAllVoice ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-violet-200" />
                  <span>Gerando Áudio de Narração...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-violet-200" />
                  <span>Gerar Narração de Todas as Cenas</span>
                </>
              )}
            </button>

            <div className="space-y-3">
              {VOICE_STYLES.map((voice) => {
                const isSelected = project.settings.defaultVoiceId === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      const updatedTracks = project.timeline.tracks.map((track) =>
                        track.type === 'voice'
                          ? {
                              ...track,
                              title: `Narração (${voice.name})`,
                              clips: track.clips.map((clip) => ({
                                ...clip,
                                name: `Narração ${voice.name}`,
                              })),
                            }
                          : track
                      );

                      onUpdateProject({
                        ...project,
                        settings: {
                          ...project.settings,
                          defaultVoiceId: voice.id,
                        },
                        timeline: {
                          ...project.timeline,
                          tracks: updatedTracks,
                        },
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-violet-950/40 border-violet-500/80 shadow-sm ring-1 ring-violet-500/30'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${voice.avatarColor} flex items-center justify-center shrink-0 shadow`}
                    >
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-100">{voice.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-violet-300 font-semibold">
                          {voice.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        {voice.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LEGENDAS */}
        {activeTab === 'captions' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Estilo das Legendas Automáticas</h3>
              <p className="text-[11px] text-zinc-400">
                Personalize fontes, cores e animações de palavra por palavra:
              </p>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Cor da Palavra em Destaque
                </label>
                <div className="flex items-center space-x-2">
                  {['#FFE600', '#00FF66', '#FF0055', '#00E5FF', '#FFFFFF'].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          captions: {
                            ...project.captions,
                            style: { ...project.captions.style, highlightColor: color },
                          },
                        })
                      }
                      className={`w-6 h-6 rounded-full border border-white/20 transition-transform ${
                        project.captions.style.highlightColor === color
                          ? 'scale-125 ring-2 ring-violet-500'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Posição na Tela
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['top', 'center', 'bottom'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          captions: {
                            ...project.captions,
                            style: {
                              ...project.captions.style,
                              positionY: pos as 'top' | 'center' | 'bottom',
                            },
                          },
                        })
                      }
                      className={`py-1 rounded border capitalize ${
                        project.captions.style.positionY === pos
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {pos === 'top' ? 'Topo' : pos === 'center' ? 'Centro' : 'Rodapé'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EFEITOS & TRANSIÇÕES */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Biblioteca Visual</h3>
              <p className="text-[11px] text-zinc-400">
                Transições, filtros e efeitos cinematográficos originais
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                Transições de Cena
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {TRANSITIONS.map((trans) => (
                  <div
                    key={trans.id}
                    className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <span className="font-semibold text-zinc-200 block">{trans.name}</span>
                    <span className="text-[10px] text-zinc-500 line-clamp-1">{trans.description}</span>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider pt-2">
                Filtros e Gradação de Cor
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {FILTERS.map((filt) => (
                  <div
                    key={filt.id}
                    className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <span className="font-semibold text-zinc-200 block">{filt.name}</span>
                    <span className="text-[10px] text-zinc-500 line-clamp-1">{filt.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MÍDIA DO USUÁRIO */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Seus Arquivos de Mídia</h3>
              <p className="text-[11px] text-zinc-400">
                Faça upload de vídeos, imagens e áudios próprios:
              </p>
            </div>

            <div className="border-2 border-dashed border-zinc-800 hover:border-violet-500/60 rounded-xl p-6 text-center bg-zinc-950/60 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <span className="text-xs font-semibold text-zinc-300 block">
                Clique ou arraste arquivos aqui
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Formatos aceitos: MP4, MOV, PNG, JPG, MP3, WAV
              </span>
            </div>
          </div>
        )}

        {/* TAB 6: STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Stickers e Destaques</h3>
              <p className="text-[11px] text-zinc-400">
                Elementos gráficos e chamadas para ação originais
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {STICKERS.map((st) => (
                <div
                  key={st.id}
                  className="p-3 bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 rounded-xl text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-1"
                >
                  <span className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 text-[10px] font-bold">
                    {st.badge}
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">{st.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AVATAR IA */}
        {activeTab === 'avatar' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Avatar de IA</h3>
              <p className="text-[11px] text-zinc-400">
                Integrador de apresentadores virtuais
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-center space-y-2">
              <User className="w-8 h-8 text-violet-400 mx-auto" />
              <h4 className="font-bold text-xs text-zinc-200">
                Integração de Avatar não configurada
              </h4>
              <p className="text-[11px] text-zinc-500">
                Conecte um provedor licenciado de avatar para apresentar narrações em vídeo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
