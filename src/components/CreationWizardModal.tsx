import React, { useState } from 'react';
import {
  Wand2,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  Tv,
  Square,
  Volume2,
  Sparkles,
  Loader2,
  Film,
  MessageSquareText,
  Palette,
} from 'lucide-react';
import { AspectRatio, Project, Scene, ScriptAnalysis } from '../types';
import { VOICE_STYLES, getVoiceById } from '../data/voices';

interface CreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Partial<Project>) => void;
}

const VISUAL_STYLES = [
  { id: 'cinematic', name: 'Cinematográfico Moderno', description: 'Iluminação de cinema, profundidade de campo e riqueza de cores.', previewColor: 'from-blue-900 to-indigo-950' },
  { id: 'photorealistic', name: 'Fotorealista 8K', description: 'Detalhes nítidos, iluminação de estúdio e textura ultrarrealista.', previewColor: 'from-amber-900 to-zinc-950' },
  { id: 'cyberpunk', name: 'Retro & Cyberpunk', description: 'Luzes neon, reflexos noturnos e atmosfera tecnológica.', previewColor: 'from-fuchsia-900 to-purple-950' },
  { id: 'anime_3d', name: 'Anime 3D Render', description: 'Estética estilizada de animação 3D com cores vibrantes.', previewColor: 'from-teal-900 to-emerald-950' },
  { id: 'minimalist', name: 'Minimalista Elegante', description: 'Composição limpa, fundos suaves e foco nos elementos principais.', previewColor: 'from-zinc-800 to-zinc-950' },
];

export const CreationWizardModal: React.FC<CreationWizardModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [step, setStep] = useState<number>(1);

  // Wizard State
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('Português');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [scriptText, setScriptText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('valentino');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseSampleScript = () => {
    setTitle('O Futuro da Inteligência Artificial');
    setScriptText(
      'A inteligência artificial está revolucionando como vivemos, trabalhamos e nos comunicamos.\n\nCom apenas um roteiro, algoritmos avançados criam áudios com vozes hiper-realistas e cenas visuais em segundos.\n\nSeja bem-vindo ao futuro da criação de conteúdo digital!'
    );
  };

  const handleRunAnalysis = async () => {
    if (!scriptText.trim()) {
      setAnalysisError('Por favor, digite ou cole um roteiro antes de continuar.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/scripts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          title: title || 'Novo Projeto CineScript',
          language,
          globalStyle: VISUAL_STYLES.find((s) => s.id === selectedStyle)?.name,
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        setStep(6); // Move to review step
      } else {
        throw new Error(data.error || 'Falha na análise');
      }
    } catch (err: any) {
      console.error('Error analyzing script:', err);
      setAnalysisError('Ocorreu um erro ao analisar o roteiro com a Gemini API. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinishCreation = () => {
    const defaultVoice = getVoiceById(selectedVoiceId);
    const styleObj = VISUAL_STYLES.find((s) => s.id === selectedStyle);

    let createdScenes: Scene[] = [];

    if (analysisResult && analysisResult.scenes) {
      createdScenes = analysisResult.scenes.map((s, idx) => ({
        ...s,
        status: 'completed',
        imageMediaUrl: `https://images.unsplash.com/photo-${
          1518770660439 + idx * 1000
        }?auto=format&fit=crop&w=1080&h=1920&q=80`,
      }));
    } else {
      // Fallback scene
      createdScenes = [
        {
          id: `scene_${Date.now()}_1`,
          order: 1,
          title: 'Cena 1: Introdução',
          narrationText: scriptText,
          estimatedDurationSec: 6,
          visualPrompt: `Visual scene reflecting: ${scriptText.slice(0, 60)}. ${styleObj?.name}`,
          characterIds: [],
          transitionOut: 'dissolve',
          status: 'completed',
          imageMediaUrl:
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&h=1920&q=80',
        },
      ];
    }

    const totalDuration = createdScenes.reduce(
      (acc, sc) => acc + (sc.estimatedDurationSec || 4),
      0
    );

    onCreateProject({
      title: title || analysisResult?.projectTitle || 'Meu Novo Vídeo IA',
      description: scriptText.slice(0, 120) + '...',
      rawScript: scriptText,
      settings: {
        aspectRatio,
        resolution: '1080p',
        language,
        defaultVoiceId: selectedVoiceId,
        globalVisualStyle: styleObj?.name || 'Cinematográfico Moderno',
      },
      analysis: analysisResult || undefined,
      scenes: createdScenes,
      thumbnailUrl: createdScenes[0]?.imageMediaUrl,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/50 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Assistente de Criação com IA</h2>
              <p className="text-xs text-zinc-400">Etapa {step} de 6 — Configure seu roteiro e voz</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="w-full bg-zinc-950 h-1.5 flex">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-full flex-1 transition-all duration-300 ${
                i <= step ? 'bg-gradient-to-r from-violet-600 to-indigo-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Step Contents */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Qual é o título do seu vídeo?</h3>
                <p className="text-xs text-zinc-400">
                  Dê um nome para organizar seu projeto. Você poderá alterar isso depois.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Título do Vídeo
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: As 5 Maiores Invenções da História"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Idioma da Narração
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="Português">Português (Brasil)</option>
                    <option value="Inglês">Inglês (US)</option>
                    <option value="Espanhol">Espanhol (LatAm)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Format & Ratio */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Escolha o formato do vídeo</h3>
                <p className="text-xs text-zinc-400">
                  Selecione a proporção ideal para a rede social em que você pretende publicar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-4 ${
                    aspectRatio === '9:16'
                      ? 'bg-violet-600/15 border-violet-500 ring-2 ring-violet-500/30'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-10 h-16 rounded-md border-2 border-violet-400 mx-auto bg-zinc-900 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">Vertical (9:16)</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Shorts, Reels, TikTok. Resolução 1080×1920.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-4 ${
                    aspectRatio === '16:9'
                      ? 'bg-violet-600/15 border-violet-500 ring-2 ring-violet-500/30'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-16 h-10 rounded-md border-2 border-blue-400 mx-auto bg-zinc-900 flex items-center justify-center">
                    <Tv className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">Horizontal (16:9)</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      YouTube, TV e Apresentações. Resolução 1920×1080.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-4 ${
                    aspectRatio === '1:1'
                      ? 'bg-violet-600/15 border-violet-500 ring-2 ring-violet-500/30'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-md border-2 border-emerald-400 mx-auto bg-zinc-900 flex items-center justify-center">
                    <Square className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">Quadrado (1:1)</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Instagram Feed e LinkedIn. Resolução 1080×1080.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Script Input */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Insira seu Roteiro</h3>
                  <p className="text-xs text-zinc-400">
                    O Gemini analisará o texto para criar as cenas e narração automaticamente.
                  </p>
                </div>
                <button
                  onClick={handleUseSampleScript}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-violet-300 transition-colors flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Usar Roteiro Exemplo</span>
                </button>
              </div>

              <div>
                <textarea
                  rows={7}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Cole seu roteiro completo aqui..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                  <span>Dica: Separe frases longas com pontos finais para melhorar a edição das cenas.</span>
                  <span>{scriptText.split(/\s+/).filter(Boolean).length} palavras</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Voice Selection (CapCut-inspired styles) */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Escolha a Voz do Narrador</h3>
                <p className="text-xs text-zinc-400">
                  Selecione entre os 6 estilos inspirados nos melhores perfis de narração:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {VOICE_STYLES.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => setSelectedVoiceId(voice.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'bg-violet-600/15 border-violet-500 ring-2 ring-violet-500/30'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${voice.avatarColor} flex items-center justify-center shrink-0 shadow-md`}
                      >
                        <Volume2 className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                            <span>{voice.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-violet-300 font-medium">
                            {voice.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {voice.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Visual Style */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Estilo Visual das Cenas</h3>
                <p className="text-xs text-zinc-400">
                  Defina a estética e o clima para os prompts visuais que o Gemini gerará.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {VISUAL_STYLES.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center space-x-3.5 ${
                        isSelected
                          ? 'bg-violet-600/15 border-violet-500 ring-2 ring-violet-500/30'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${style.previewColor} border border-white/10 flex items-center justify-center shrink-0 shadow-inner`}
                      >
                        <Palette className="w-5 h-5 text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-100">{style.name}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{style.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Review & Gemini Breakdown */}
          {step === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-300">
                    Roteiro Analisado com Sucesso!
                  </h4>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    O Gemini dividiu seu roteiro em {analysisResult?.scenes.length || 0} cenas estruturadas com prompts visuais específicos.
                  </p>
                </div>
              </div>

              {/* Scene Cards Preview */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {analysisResult?.scenes.map((scene, idx) => (
                  <div
                    key={scene.id || idx}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-400">
                        Cena {idx + 1} ({scene.estimatedDurationSec || 4}s)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-900 rounded text-zinc-400">
                        Transição: {scene.transitionOut || 'Dissolve'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 font-medium">"{scene.narrationText}"</p>
                    <p className="text-[11px] text-zinc-400 italic bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                      <strong>Prompt Visual IA:</strong> {scene.visualPrompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisError && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300">
              {analysisError}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1 || isAnalyzing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          {step < 5 && (
            <button
              type="button"
              onClick={() => {
                if (step === 3 && !scriptText.trim()) {
                  setAnalysisError('Por favor, preencha o roteiro para prosseguir.');
                  return;
                }
                setAnalysisError(null);
                setStep((prev) => prev + 1);
              }}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-lg shadow-violet-600/20"
            >
              <span>Avançar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
                  <span>Analisando Roteiro com IA...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-violet-300" />
                  <span>Analisar e Criar Cenas com IA</span>
                </>
              )}
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={handleFinishCreation}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Check className="w-4 h-4" />
              <span>Abrir no Editor Principal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
