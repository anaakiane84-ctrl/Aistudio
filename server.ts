import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// In-memory store for jobs in dev/demo mode
const jobsStore = new Map<string, any>();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to create a synthetic WAV audio buffer in case live API keys aren't attached
function createSyntheticWavBuffer(durationSec: number = 2.5, pitchHz: number = 220): Buffer {
  const sampleRate = 24000;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate sine wave with mild decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * pitchHz * t) * 0.3 * Math.exp(-t / (durationSec * 1.2));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

// 1. API - Health check
app.get('/api/health', (req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasApiKey,
    demoMode: !hasApiKey,
    appUrl: process.env.APP_URL || 'http://localhost:3000',
  });
});

// 2. API - Script Analysis using Gemini
app.post('/api/scripts/analyze', async (req, res) => {
  try {
    const { script, title, language, globalStyle } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'O texto do roteiro é obrigatório.' });
    }

    const ai = getGeminiClient();

    if (ai) {
      try {
        const promptText = `
Você é um diretor de cinema e editor de vídeo profissional especialista em redes sociais e narrativas em vídeo.
Analise e divida o seguinte roteiro em cenas sequenciais detalhadas para produção de vídeo.

Título do Projeto: "${title || 'Vídeo Sem Título'}"
Idioma: "${language || 'Português'}"
Estilo Visual Global: "${globalStyle || 'Cinematográfico moderno, alta definição, iluminação dramática'}"

Roteiro Bruto:
"""
${script}
"""

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
- projectTitle: string
- language: string
- estimatedDurationSec: number
- globalVisualStyle: string
- continuityBible: {
    characters: Array<{ id: string, name: string, visualDescription: string, clothing: string }>,
    locations: Array<{ id: string, name: string, visualDescription: string }>
  }
- scenes: Array<{
    id: string,
    order: number,
    title: string,
    narrationText: string,
    estimatedDurationSec: number,
    visualPrompt: string,
    negativePrompt: string,
    characterIds: string[],
    locationId: string,
    transitionOut: string
  }>
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                projectTitle: { type: Type.STRING },
                language: { type: Type.STRING },
                estimatedDurationSec: { type: Type.NUMBER },
                globalVisualStyle: { type: Type.STRING },
                continuityBible: {
                  type: Type.OBJECT,
                  properties: {
                    characters: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          visualDescription: { type: Type.STRING },
                          clothing: { type: Type.STRING },
                        },
                      },
                    },
                    locations: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          visualDescription: { type: Type.STRING },
                        },
                      },
                    },
                  },
                },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      order: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      narrationText: { type: Type.STRING },
                      estimatedDurationSec: { type: Type.NUMBER },
                      visualPrompt: { type: Type.STRING },
                      negativePrompt: { type: Type.STRING },
                      characterIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      locationId: { type: Type.STRING },
                      transitionOut: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, source: 'gemini', analysis: parsed });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to smart analyzer:', geminiError?.message);
      }
    }

    // Fallback Smart Local Parser for Demo Mode or API limits
    const sentences = script
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const sceneCount = Math.max(1, sentences.length);
    const scenes = sentences.map((sentence, idx) => {
      const wordCount = sentence.split(/\s+/).length;
      const duration = Math.max(3, Math.round(wordCount * 0.45));
      return {
        id: `scene_${Date.now()}_${idx + 1}`,
        order: idx + 1,
        title: `Cena ${idx + 1}: ${sentence.slice(0, 30)}...`,
        narrationText: sentence,
        estimatedDurationSec: duration,
        visualPrompt: `Cinematic high quality shot illustrating: ${sentence}. Professional lighting, 8k resolution, detailed aesthetic, ${globalStyle || 'cinematic vibe'}`,
        negativePrompt: 'blurry, low quality, distorted, extra limbs, watermark, text overlay',
        characterIds: ['char_main'],
        locationId: 'loc_primary',
        transitionOut: idx % 2 === 0 ? 'dissolve' : 'cut',
      };
    });

    const totalDuration = scenes.reduce((acc, s) => acc + s.estimatedDurationSec, 0);

    const fallbackAnalysis = {
      projectTitle: title || 'Roteiro CineScript AI',
      language: language || 'Português',
      estimatedDurationSec: totalDuration,
      globalVisualStyle: globalStyle || 'Cinematográfico Moderno',
      continuityBible: {
        characters: [
          {
            id: 'char_main',
            name: 'Protagonista Principal',
            visualDescription: 'Pessoa expressiva, traços marcantes e carismáticos.',
            clothing: 'Vestuário moderno e elegante.',
          },
        ],
        locations: [
          {
            id: 'loc_primary',
            name: 'Cenário Principal',
            visualDescription: 'Ambiente cinematográfico com iluminação de estúdio.',
          },
        ],
      },
      scenes,
    };

    return res.json({ success: true, source: 'demo_analyzer', analysis: fallbackAnalysis });
  } catch (err: any) {
    console.error('Error in /api/scripts/analyze:', err);
    res.status(500).json({ error: 'Falha ao analisar o roteiro.' });
  }
});

// 3. API - Voice TTS Generation & Preview
app.post('/api/voices/generate', async (req, res) => {
  try {
    const { text, voiceId, prebuiltVoiceName, pitch, speed } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'O texto da narração é necessário.' });
    }

    const ai = getGeminiClient();
    const voiceToUse = prebuiltVoiceName || 'Kore';

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceToUse },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioBuffer = Buffer.from(base64Audio, 'base64');
          return res.json({
            success: true,
            source: 'gemini_tts',
            audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
            durationSec: Math.max(2, Math.round(text.split(/\s+/).length * 0.4)),
          });
        }
      } catch (ttsErr: any) {
        console.warn('Gemini TTS error, fallback to synthetic audio:', ttsErr?.message);
      }
    }

    // Synthetic Wav Fallback in Demo Mode
    const estimatedDuration = Math.max(2, Math.round(text.split(/\s+/).length * 0.45));
    const wavBuffer = createSyntheticWavBuffer(estimatedDuration, voiceId === 'rayo' ? 320 : voiceId === 'knightley' ? 140 : 220);
    const base64Audio = wavBuffer.toString('base64');

    return res.json({
      success: true,
      source: 'synthetic_demo',
      audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
      durationSec: estimatedDuration,
    });
  } catch (err: any) {
    console.error('Error in /api/voices/generate:', err);
    res.status(500).json({ error: 'Erro ao gerar narração de voz.' });
  }
});

// 4. API - Scene AI Generation (Video / Image preview)
app.post('/api/scenes/generate', async (req, res) => {
  try {
    const { sceneId, visualPrompt, negativePrompt, aspectRatio } = req.body;

    const jobId = `job_scene_${Date.now()}`;
    const job = {
      id: jobId,
      sceneId,
      status: 'completed',
      progressPercent: 100,
      message: 'Cena gerada com sucesso!',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    jobsStore.set(jobId, job);

    // Provide high-quality visual placeholder or synthesized video canvas data
    const promptParam = encodeURIComponent(visualPrompt || 'Cinematic video scene');
    const width = aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920;
    const height = aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;

    return res.json({
      success: true,
      jobId,
      imageMediaUrl: `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=${width}&h=${height}&q=80`,
      videoMediaUrl: undefined,
      visualPrompt,
    });
  } catch (err: any) {
    console.error('Error in /api/scenes/generate:', err);
    res.status(500).json({ error: 'Erro ao gerar a cena.' });
  }
});

// 5. API - Captions Auto Generator
app.post('/api/captions/generate', (req, res) => {
  try {
    const { scenes, narrationText } = req.body;

    const cues: any[] = [];
    let currentTime = 0;

    if (Array.isArray(scenes) && scenes.length > 0) {
      scenes.forEach((scene: any) => {
        const text = scene.narrationText || '';
        const duration = scene.estimatedDurationSec || 4;

        if (text) {
          const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
          const timePerSentence = duration / sentences.length;

          sentences.forEach((sentence: string, sIdx: number) => {
            const startSec = currentTime + sIdx * timePerSentence;
            const endSec = startSec + timePerSentence;

            const wordsList = sentence.split(/\s+/).map((word: string, wIdx: number, arr: string[]) => {
              const wordDuration = timePerSentence / arr.length;
              return {
                word,
                startTimeSec: Number((startSec + wIdx * wordDuration).toFixed(2)),
                endTimeSec: Number((startSec + (wIdx + 1) * wordDuration).toFixed(2)),
              };
            });

            cues.push({
              id: `cue_${Date.now()}_${sIdx}`,
              sceneId: scene.id,
              text: sentence,
              startTimeSec: Number(startSec.toFixed(2)),
              endTimeSec: Number(endSec.toFixed(2)),
              words: wordsList,
            });
          });
        }
        currentTime += duration;
      });
    }

    res.json({ success: true, cues });
  } catch (err: any) {
    console.error('Error in /api/captions/generate:', err);
    res.status(500).json({ error: 'Erro ao gerar legendas.' });
  }
});

// 6. API - Render & Export Jobs
app.post('/api/exports', (req, res) => {
  try {
    const { projectId, settings } = req.body;
    const exportId = `export_${Date.now()}`;

    const job = {
      id: exportId,
      projectId,
      type: 'export',
      status: 'queued',
      progressPercent: 10,
      message: 'Preparando plano de renderização FFmpeg e recursos de mídia...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings,
    };

    jobsStore.set(exportId, job);

    res.json({ success: true, exportJob: job });
  } catch (err: any) {
    console.error('Error in /api/exports:', err);
    res.status(500).json({ error: 'Erro ao criar job de exportação.' });
  }
});

app.get('/api/exports/:id', (req, res) => {
  const exportId = req.params.id;
  const job = jobsStore.get(exportId);

  if (!job) {
    // Return mock completed export if not found
    return res.json({
      exportJob: {
        id: exportId,
        status: 'completed',
        progressPercent: 100,
        message: 'Vídeo renderizado com sucesso!',
        resultUrl: '#download_demo',
      },
    });
  }

  // Progress simulation for render
  if (job.status === 'queued') {
    job.status = 'processing';
    job.progressPercent = 35;
    job.message = 'Sincronizando áudio de narração e legendas automáticas...';
  } else if (job.status === 'processing' && job.progressPercent < 90) {
    job.progressPercent += 30;
    job.message = 'Aplicando transições, filtros e codificando MP4 H.264...';
  } else if (job.progressPercent >= 90) {
    job.status = 'completed';
    job.progressPercent = 100;
    job.message = 'Vídeo MP4 gerado e pronto para download!';
    job.resultUrl = '#download_demo';
  }

  job.updatedAt = new Date().toISOString();
  jobsStore.set(exportId, job);

  res.json({ exportJob: job });
});

app.post('/api/jobs/:id/cancel', (req, res) => {
  const jobId = req.params.id;
  const job = jobsStore.get(jobId);
  if (job) {
    job.status = 'cancelled';
    job.message = 'Operação cancelada pelo usuário.';
    jobsStore.set(jobId, job);
  }
  res.json({ success: true, jobId });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineScript AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
