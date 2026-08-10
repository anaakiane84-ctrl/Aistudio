export type AspectRatio = '9:16' | '16:9' | '1:1';

export type Resolution = '720p' | '1080p' | '4K';

export type ExportQuality = 'Rápida' | 'Alta' | 'Máxima';

export type FrameRate = 24 | 30 | 60;

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface VoiceStyle {
  id: string;
  name: string; // e.g. "Valentino", "Rayo", "Knightley", "Nandez", "Mentora Estável", "Amelia"
  description: string;
  category: string;
  gender: 'male' | 'female';
  tone: string;
  defaultSpeed: number;
  defaultPitch: number;
  sampleAudioUrl?: string;
  prebuiltVoiceName: string; // Gemin/TTS voice equivalent
  avatarColor: string;
  badge: string;
}

export interface CharacterContinuity {
  id: string;
  name: string;
  visualDescription: string;
  clothing: string;
  referenceAssetId?: string;
}

export interface LocationContinuity {
  id: string;
  name: string;
  visualDescription: string;
}

export interface ContinuityBible {
  characters: CharacterContinuity[];
  locations: LocationContinuity[];
}

export interface Scene {
  id: string;
  order: number;
  title: string;
  narrationText: string;
  estimatedDurationSec: number;
  actualDurationSec?: number;
  visualPrompt: string;
  negativePrompt?: string;
  characterIds: string[];
  locationId?: string;
  transitionOut: string;
  visualStyle?: string;
  videoMediaUrl?: string;
  imageMediaUrl?: string;
  narrationAudioUrl?: string;
  status: 'draft' | 'queued' | 'generating' | 'completed' | 'failed';
  generationAttempts?: number;
  generationError?: string;
}

export interface ScriptAnalysis {
  projectTitle: string;
  language: string;
  estimatedDurationSec: number;
  globalVisualStyle: string;
  continuityBible: ContinuityBible;
  scenes: Scene[];
}

export interface CaptionCue {
  id: string;
  sceneId?: string;
  text: string;
  startTimeSec: number;
  endTimeSec: number;
  words?: Array<{
    word: string;
    startTimeSec: number;
    endTimeSec: number;
  }>;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  backgroundColor: string;
  backgroundPadding: number;
  shadow: boolean;
  positionY: 'top' | 'center' | 'bottom';
  highlightColor: string;
  textTransform: 'none' | 'uppercase' | 'capitalize';
}

export interface CaptionTrack {
  id: string;
  style: SubtitleStyle;
  cues: CaptionCue[];
}

export type TrackType = 'video' | 'overlay' | 'avatar' | 'text' | 'captions' | 'voice' | 'music' | 'sfx' | 'stickers';

export interface TimelineClip {
  id: string;
  trackId: string;
  sceneId?: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'text' | 'sticker' | 'caption';
  startTimeSec: number;
  durationSec: number;
  sourceStartSec?: number;
  sourceUrl?: string;
  mediaType?: string;
  color?: string;
  effectName?: string;
  filterName?: string;
  transitionIn?: string;
  transitionOut?: string;
  volume?: number;
  opacity?: number;
  speed?: number;
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  title: string;
  isMuted: boolean;
  isLocked: boolean;
  isHidden: boolean;
  clips: TimelineClip[];
}

export interface TimelineData {
  tracks: TimelineTrack[];
  durationSec: number;
  currentTimeSec: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  durationSec?: number;
  thumbnailUrl?: string;
  fileSizeMb?: number;
  createdAt: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  type: 'script_analysis' | 'tts' | 'scene_video' | 'captions' | 'export';
  sceneId?: string;
  status: JobStatus;
  progressPercent: number;
  message: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  resultUrl?: string;
}

export interface ExportSettings {
  filename: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  quality: ExportQuality;
  frameRate: FrameRate;
  burnInCaptions: boolean;
  includeWatermark: boolean;
}

export interface ProjectSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  language: string;
  defaultVoiceId: string;
  globalVisualStyle: string;
  targetDurationSec?: number;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  rawScript: string;
  settings: ProjectSettings;
  analysis?: ScriptAnalysis;
  scenes: Scene[];
  captions: CaptionTrack;
  timeline: TimelineData;
  mediaAssets: MediaAsset[];
  exportSettings: ExportSettings;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface CreativeEffect {
  id: string;
  name: string;
  description: string;
  category: 'animation' | 'transition' | 'effect' | 'filter' | 'sticker';
  previewCss?: string;
  iconName?: string;
  sampleUrl?: string;
}
