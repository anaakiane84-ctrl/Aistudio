import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CreationWizardModal } from './components/CreationWizardModal';
import { LeftSidebar } from './components/LeftSidebar';
import { PreviewPlayer } from './components/PreviewPlayer';
import { ContextInspector } from './components/ContextInspector';
import { TimelineEditor } from './components/TimelineEditor';
import { ExportModal } from './components/ExportModal';
import { Project, AspectRatio, TimelineData } from './types';
import { SAMPLE_PROJECT } from './data/sampleProjects';
import { getVoiceById } from './data/voices';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('cinescript_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved projects:', e);
      }
    }
    return [SAMPLE_PROJECT];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(SAMPLE_PROJECT.id);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Active Project Reference
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECT;

  // Editor State
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    activeProject.scenes[0]?.id || null
  );
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync projects to localStorage
  useEffect(() => {
    setIsSaving(true);
    localStorage.setItem('cinescript_projects', JSON.stringify(projects));
    const timer = setTimeout(() => setIsSaving(false), 500);
    return () => clearTimeout(timer);
  }, [projects]);

  // Update active project helper
  const handleUpdateActiveProject = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  // Title Update
  const handleUpdateTitle = (newTitle: string) => {
    handleUpdateActiveProject({
      ...activeProject,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  // Aspect Ratio Change
  const handleChangeAspectRatio = (aspectRatio: AspectRatio) => {
    handleUpdateActiveProject({
      ...activeProject,
      settings: { ...activeProject.settings, aspectRatio },
      updatedAt: new Date().toISOString(),
    });
  };

  // Timeline Update
  const handleUpdateTimeline = (updatedTimeline: TimelineData) => {
    handleUpdateActiveProject({
      ...activeProject,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
    });
  };

  // Create Project via Wizard
  const handleCreateProjectFromWizard = (projectData: Partial<Project>) => {
    const newId = `proj_${Date.now()}`;
    const newProject: Project = {
      ...SAMPLE_PROJECT,
      id: newId,
      title: projectData.title || 'Novo Vídeo IA',
      description: projectData.description || '',
      rawScript: projectData.rawScript || '',
      settings: {
        ...SAMPLE_PROJECT.settings,
        ...projectData.settings,
      },
      scenes: projectData.scenes || [],
      thumbnailUrl: projectData.thumbnailUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newId);
    if (newProject.scenes.length > 0) {
      setActiveSceneId(newProject.scenes[0].id);
    }
  };

  // Duplicate Project
  const handleDuplicateProject = (projectId: string) => {
    const found = projects.find((p) => p.id === projectId);
    if (!found) return;

    const dupId = `proj_dup_${Date.now()}`;
    const duplicated: Project = {
      ...found,
      id: dupId,
      title: `${found.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [duplicated, ...prev]);
  };

  // Delete Project
  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    if (updated.length > 0) {
      setActiveProjectId(updated[0].id);
    } else {
      setProjects([SAMPLE_PROJECT]);
      setActiveProjectId(SAMPLE_PROJECT.id);
    }
  };

  // Rename Project
  const handleRenameProject = (projectId: string, newTitle: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, title: newTitle } : p))
    );
  };

  // Generate TTS Audio for Scene
  const handleGenerateVoiceForScene = async (sceneId: string, voiceId: string): Promise<void> => {
    const targetScene = activeProject.scenes.find((s) => s.id === sceneId);
    if (!targetScene) return;

    const voice = getVoiceById(voiceId);

    try {
      const res = await fetch('/api/voices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetScene.narrationText,
          voiceId: voice.id,
          prebuiltVoiceName: voice.prebuiltVoiceName,
          pitch: voice.defaultPitch,
          speed: voice.defaultSpeed,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const details = data.details || data.error || `HTTP ${res.status}`;
        console.error('Erro ao gerar voz:', details);

        if (res.status === 429 || String(details).includes('429') || String(details).toLowerCase().includes('quota')) {
          alert('O limite temporário do Gemini TTS foi atingido. Aguarde um pouco e tente novamente.');
        } else {
          alert(`Não foi possível gerar a narração: ${details}`);
        }
        return;
      }

      if (data.audioDataUrl) {
        setProjects((prev) =>
          prev.map((project) => {
            if (project.id !== activeProject.id) return project;

            const updatedScenes = project.scenes.map((scene) =>
              scene.id === sceneId
                ? {
                    ...scene,
                    narrationAudioUrl: data.audioDataUrl,
                    actualDurationSec: data.durationSec,
                  }
                : scene
            );

            const updatedTracks = project.timeline.tracks.map((track) => {
              if (track.type !== 'voice') return track;

              return {
                ...track,
                title: `Narração (${voice.name})`,
                clips: track.clips.map((clip, index) => ({
                  ...clip,
                  name: `Narração ${voice.name}`,
                  sourceUrl: index === 0 ? data.audioDataUrl : clip.sourceUrl,
                  durationSec:
                    index === 0 && data.durationSec
                      ? data.durationSec
                      : clip.durationSec,
                })),
              };
            });

            return {
              ...project,
              updatedAt: new Date().toISOString(),
              scenes: updatedScenes,
              timeline: {
                ...project.timeline,
                tracks: updatedTracks,
              },
            };
          })
        );
      }
    } catch (err: any) {
      console.error('Error generating voice for scene:', err);
      alert(`Erro de comunicação ao gerar a narração: ${err?.message || String(err)}`);
    }
  };

  // Generate AI Visual for Scene
  const handleGenerateSceneVisual = async (sceneId: string) => {
    const targetScene = activeProject.scenes.find((s) => s.id === sceneId);
    if (!targetScene) return;

    try {
      const res = await fetch('/api/scenes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId,
          visualPrompt: targetScene.visualPrompt,
          aspectRatio: activeProject.settings.aspectRatio,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedScenes = activeProject.scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                imageMediaUrl: data.imageMediaUrl,
                videoMediaUrl: data.videoMediaUrl,
                status: 'completed' as const,
              }
            : s
        );
        handleUpdateActiveProject({ ...activeProject, scenes: updatedScenes });
      }
    } catch (err) {
      console.error('Error generating scene visual:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none">
      {/* Top Header */}
      <Header
        projectTitle={activeProject.title}
        onUpdateTitle={handleUpdateTitle}
        aspectRatio={activeProject.settings.aspectRatio}
        onChangeAspectRatio={handleChangeAspectRatio}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onNewProject={() => setIsWizardOpen(true)}
        onPreview={() => setIsPlaying(!isPlaying)}
        onExport={() => setIsExportOpen(true)}
        isSaving={isSaving}
      />

      {/* Main Workspace (Left Sidebar + Center Monitor + Right Inspector) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <LeftSidebar
          project={activeProject}
          onUpdateProject={handleUpdateActiveProject}
          activeSceneId={activeSceneId}
          onSelectScene={setActiveSceneId}
          onGenerateVoiceForScene={handleGenerateVoiceForScene}
          onGenerateSceneVisual={handleGenerateSceneVisual}
        />

        <PreviewPlayer
          project={activeProject}
          currentTimeSec={currentTimeSec}
          onTimeUpdate={setCurrentTimeSec}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
        />

        <ContextInspector
          project={activeProject}
          activeSceneId={activeSceneId}
          onUpdateProject={handleUpdateActiveProject}
          onGenerateSceneVisual={handleGenerateSceneVisual}
          onClose={() => setActiveSceneId(null)}
        />
      </div>

      {/* Bottom Multitrack Timeline */}
      <TimelineEditor
        timeline={activeProject.timeline}
        currentTimeSec={currentTimeSec}
        onTimeUpdate={setCurrentTimeSec}
        onUpdateTimeline={handleUpdateTimeline}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
      />

      {/* Overlays & Modals */}
      {isDashboardOpen && (
        <Dashboard
          projects={projects}
          onSelectProject={(id) => {
            setActiveProjectId(id);
            setIsDashboardOpen(false);
          }}
          onNewProject={() => {
            setIsDashboardOpen(false);
            setIsWizardOpen(true);
          }}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onClose={() => setIsDashboardOpen(false)}
        />
      )}

      {isWizardOpen && (
        <CreationWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onCreateProject={handleCreateProjectFromWizard}
        />
      )}

      {isExportOpen && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          project={activeProject}
        />
      )}
    </div>
  );
}
