import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Loader2,
  Film,
  Sparkles,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { ExportSettings, Project } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  const [settings, setSettings] = useState<ExportSettings>({
    filename: `${project.title.replace(/\s+/g, '_')}.mp4`,
    resolution: '1080p',
    aspectRatio: project.settings.aspectRatio,
    quality: 'Alta',
    frameRate: 30,
    burnInCaptions: true,
    includeWatermark: false,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (exportJobId && isExporting && !isCompleted) {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/exports/${exportJobId}`);
          const data = await res.json();
          if (data.exportJob) {
            setProgressPercent(data.exportJob.progressPercent);
            setStatusMessage(data.exportJob.message);

            if (data.exportJob.status === 'completed') {
              setIsCompleted(true);
              setIsExporting(false);
            }
          }
        } catch (err) {
          console.error('Error checking export job status:', err);
        }
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [exportJobId, isExporting, isCompleted]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressPercent(10);
    setStatusMessage('Iniciando plano de renderização FFmpeg...');
    setIsCompleted(false);

    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          settings,
        }),
      });

      const data = await response.json();
      if (data.success && data.exportJob) {
        setExportJobId(data.exportJob.id);
      }
    } catch (err) {
      console.error('Failed to trigger export:', err);
      setStatusMessage('Ocorreu um erro na renderização.');
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    // Simulated MP4 Download Blob
    const content = `CineScript AI Rendered Video File\nTitle: ${project.title}\nResolution: ${settings.resolution}\nFormat: ${settings.aspectRatio}\nCodec: H.264 AAC`;
    const blob = new Blob([content], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = settings.filename || 'video_cinescript.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-zinc-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/50 flex items-center justify-center">
              <Download className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Exportar Vídeo MP4</h2>
              <p className="text-xs text-zinc-400">Configure resolução e qualidade de renderização</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Filename */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome do Arquivo
            </label>
            <input
              type="text"
              value={settings.filename}
              onChange={(e) => setSettings({ ...settings, filename: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Resolution & Quality Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Resolução</label>
              <select
                value={settings.resolution}
                onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <option value="720p">720p (HD Rápido)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="4K">4K Ultra HD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Qualidade</label>
              <select
                value={settings.quality}
                onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <option value="Rápida">Rápida (Menor tamanho)</option>
                <option value="Alta">Alta (Recomendado)</option>
                <option value="Máxima">Máxima (Sem perdas)</option>
              </select>
            </div>
          </div>

          {/* Burn in Subtitles Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div>
              <span className="font-semibold text-xs text-zinc-200 block">
                Incorporar Legendas no Vídeo
              </span>
              <span className="text-[10px] text-zinc-500 block">
                Renderiza o texto com animações diretamente nos quadros MP4
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.burnInCaptions}
              onChange={(e) => setSettings({ ...settings, burnInCaptions: e.target.checked })}
              className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
            />
          </div>

          {/* Progress & Render Status */}
          {(isExporting || isCompleted) && (
            <div className="space-y-2 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-violet-300 flex items-center space-x-1.5">
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Renderização Concluída!</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      <span>Processando Render...</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-xs text-zinc-400 font-bold">
                  {progressPercent}%
                </span>
              </div>

              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-zinc-400 text-center">{statusMessage}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>

          {!isCompleted ? (
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-violet-600/20 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-violet-200" />
                  <span>Renderizando MP4...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 text-violet-200" />
                  <span>Iniciar Renderização</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Vídeo MP4</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
