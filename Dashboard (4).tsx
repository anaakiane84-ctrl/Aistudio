import React, { useState } from 'react';
import {
  Plus,
  Search,
  Video,
  Copy,
  Trash2,
  Edit2,
  Clock,
  HardDrive,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  Play,
  Film,
  X,
} from 'lucide-react';
import { Project, AspectRatio } from '../types';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRatioFilter, setSelectedRatioFilter] = useState<string>('all');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRatio =
      selectedRatioFilter === 'all' || p.settings.aspectRatio === selectedRatioFilter;
    return matchesSearch && matchesRatio;
  });

  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(project.id);
    setRenameTitle(project.title);
  };

  const handleSaveRename = (projectId: string) => {
    if (renameTitle.trim()) {
      onRenameProject(projectId, renameTitle.trim());
    }
    setRenamingId(null);
  };

  const renderRatioIcon = (aspectRatio: AspectRatio) => {
    switch (aspectRatio) {
      case '9:16':
        return <Smartphone className="w-3.5 h-3.5 text-violet-400" />;
      case '16:9':
        return <Tv className="w-3.5 h-3.5 text-blue-400" />;
      case '1:1':
        return <Square className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex flex-col overflow-hidden text-zinc-100">
      {/* Top Bar */}
      <div className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center">
            <Film className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-200 bg-clip-text text-transparent">
              CineScript AI — Meus Projetos
            </h1>
            <p className="text-xs text-zinc-400">
              Gerencie seus vídeos, roteiros e narrações gerados por Inteligência Artificial
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Fechar Dashboard"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Controls Row & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do projeto ou conteúdo..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* New Project CTA */}
          <button
            onClick={onNewProject}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Projeto</span>
          </button>
        </div>

        {/* Filter Badges & System Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-400 font-medium">Formato:</span>
            <button
              onClick={() => setSelectedRatioFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedRatioFilter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({projects.length})
            </button>
            <button
              onClick={() => setSelectedRatioFilter('9:16')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
                selectedRatioFilter === '9:16'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16 Vertical</span>
            </button>
            <button
              onClick={() => setSelectedRatioFilter('16:9')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
                selectedRatioFilter === '16:9'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>16:9 Horizontal</span>
            </button>
            <button
              onClick={() => setSelectedRatioFilter('1:1')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
                selectedRatioFilter === '1:1'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Square className="w-3 h-3" />
              <span>1:1 Quadrado</span>
            </button>
          </div>

          <div className="flex items-center space-x-4 text-xs text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Créditos IA: <strong className="text-zinc-200">Ilimitados (Dev)</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>Armazenamento: <strong className="text-zinc-200">3.2 GB / 50 GB</strong></span>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 border-dashed space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 mx-auto flex items-center justify-center text-zinc-500">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-300">Nenhum projeto encontrado</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? 'Tente buscar com outros termos ou limpe o filtro.'
                  : 'Crie seu primeiro vídeo com roteiro, narração e cenas de Inteligência Artificial.'}
              </p>
            </div>
            <button
              onClick={onNewProject}
              className="inline-flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Projeto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProjects.map((project) => {
              const isRenaming = renamingId === project.id;
              const sceneCount = project.scenes.length;
              const totalDuration = project.scenes.reduce(
                (acc, s) => acc + (s.estimatedDurationSec || 4),
                0
              );

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="group bg-zinc-900 hover:bg-zinc-850 rounded-2xl border border-zinc-800 hover:border-violet-500/50 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-violet-950/20 flex flex-col"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video bg-zinc-950 overflow-hidden flex items-center justify-center group-hover:opacity-95 transition-opacity">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-600 space-y-1">
                        <Video className="w-8 h-8" />
                        <span className="text-[10px]">Sem Miniatura</span>
                      </div>
                    )}

                    {/* Format Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 text-[10px] font-semibold text-zinc-200 flex items-center space-x-1">
                      {renderRatioIcon(project.settings.aspectRatio)}
                      <span>{project.settings.aspectRatio}</span>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{Math.round(totalDuration)}s</span>
                    </div>

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-violet-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Info Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {isRenaming ? (
                        <div
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(project.id)}
                            className="bg-zinc-800 border border-violet-500 rounded px-2 py-1 text-xs text-white focus:outline-none w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(project.id)}
                            className="text-xs bg-violet-600 text-white px-2 py-1 rounded"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-sm text-zinc-100 group-hover:text-violet-300 transition-colors line-clamp-1">
                          {project.title}
                        </h3>
                      )}
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {project.description || project.rawScript}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{sceneCount} Cenas • Voz: {project.settings.defaultVoiceId}</span>

                      {/* Card Actions */}
                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(project, e)}
                          className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
                          title="Renomear"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateProject(project.id);
                          }}
                          className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
                          title="Duplicar Projeto"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Excluir o projeto "${project.title}"?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-red-950/50 hover:text-red-400 text-zinc-500"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
