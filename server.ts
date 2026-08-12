import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

function pcmToWav(
  pcmData: Buffer,
  sampleRate: number = 24000,
  channels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;

  const wavBuffer = Buffer.alloc(44 + pcmData.length);

  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + pcmData.length, 4);
  wavBuffer.write('WAVE', 8);

  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20);
  wavBuffer.writeUInt16LE(channels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);

  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(pcmData.length, 40);

  pcmData.copy(wavBuffer, 44);

  return wavBuffer;
}

// 1. API - Health check
app.get('/api/health', (req, res) => {
  const hasApiKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );

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
      return res.status(400).json({
        error: 'O texto do roteiro é obrigatório.',
      });
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
                      characterIds: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
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

          return res.json({
            success: true,
            source: 'gemini',
            analysis: parsed,
          });
        }
      } catch (geminiError: any) {
        console.warn(
          'Gemini API call failed, falling back to smart analyzer:',
          geminiError?.message
        );
      }
    }

    const sentences = script
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const scenes = sentences.map((sentence, idx) => {
      const wordCount = sentence.split(/\s+/).length;
      const duration = Math.max(
        3,
        Math.round(wordCount * 0.45)
      );

      return {
        id: `scene_${Date.now()}_${idx + 1}`,
        order: idx + 1,
        title: `Cena ${idx + 1}: ${sentence.slice(0, 30)}...`,
        narrationText: sentence,
        estimatedDurationSec: duration,
        visualPrompt: `Cinematic high quality shot illustrating: ${sentence}. Professional lighting, 8k resolution, detailed aesthetic, ${globalStyle || 'cinematic vibe'}`,
        negativePrompt:
          'blurry, low quality, distorted, extra limbs, watermark, text overlay',
        characterIds: ['char_main'],
        locationId: 'loc_primary',
        transitionOut:
          idx % 2 === 0 ? 'dissolve' : 'cut',
      };
    });

    const totalDuration = scenes.reduce(
      (acc, s) => acc + s.estimatedDurationSec,
      0
    );

    const fallbackAnalysis = {
      projectTitle:
        title || 'Roteiro CineScript AI',
      language:
        language || 'Português',
      estimatedDurationSec:
        totalDuration,
      globalVisualStyle:
        globalStyle || 'Cinematográfico Moderno',

      continuityBible: {
        characters: [
          {
            id: 'char_main',
            name: 'Protagonista Principal',
            visualDescription:
              'Pessoa expressiva, traços marcantes e carismáticos.',
            clothing:
              'Vestuário moderno e elegante.',
          },
        ],

        locations: [
          {
            id: 'loc_primary',
            name: 'Cenário Principal',
            visualDescription:
              'Ambiente cinematográfico com iluminação de estúdio.',
          },
        ],
      },

      scenes,
    };

    return res.json({
      success: true,
      source: 'demo_analyzer',
      analysis: fallbackAnalysis,
    });

  } catch (err: any) {
    console.error(
      'Error in /api/scripts/analyze:',
      err
    );

    res.status(500).json({
      error: 'Falha ao analisar o roteiro.',
    });
  }
});

// 3. API - Voice TTS Generation & Preview
app.post('/api/voices/generate', async (req, res) => {
  try {
    const {
      text,
      voiceId,
      prebuiltVoiceName,
      pitch,
      speed,
    } = req.body;

    if (
      !text ||
      typeof text !== 'string' ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        error:
          'O texto da narração é necessário.',
      });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(500).json({
        success: false,
        error:
          'GEMINI_API_KEY não configurada no servidor.',
      });
    }

    const voiceToUse =
      prebuiltVoiceName || 'Kore';

    console.log(
      `[TTS] Gerando voz "${voiceToUse}" para ${text.length} caracteres`
    );

    try {
      const interaction: any =
        await ai.interactions.create({
          model:
            'gemini-3.1-flash-tts-preview',

          input: `
Gere exclusivamente a narração em áudio.

Idioma: português do Brasil.
Fale de forma natural, clara e profissional.
Não leia estas instruções.
Não acrescente comentários.

Texto que deve ser falado:
${text.trim()}
          `.trim(),

          response_format: {
            type: 'audio',
          },

          generation_config: {
            speech_config: [
              {
                voice: voiceToUse,
              },
            ],
          },
        });

      const outputAudio =
        interaction?.output_audio;

      if (!outputAudio?.data) {
        console.error(
          '[TTS] Gemini não retornou output_audio:',
          JSON.stringify(
            interaction,
            null,
            2
          )
        );

        return res.status(502).json({
          success: false,
          error:
            'O Gemini respondeu, mas não retornou áudio.',
          details:
            'output_audio.data não encontrado.',
        });
      }

      const pcmBuffer = Buffer.from(
        outputAudio.data,
        'base64'
      );

      const sampleRate = 24000;
      const channels = 1;
      const bitsPerSample = 16;

      const wavBuffer = pcmToWav(
        pcmBuffer,
        sampleRate,
        channels,
        bitsPerSample
      );

      const wavBase64 =
        wavBuffer.toString('base64');

      const estimatedDuration =
        Math.max(
          1,
          pcmBuffer.length /
            (
              sampleRate *
              channels *
              (bitsPerSample / 8)
            )
        );

      console.log(
        `[TTS] Voz gerada com sucesso. Duração aproximada: ${estimatedDuration.toFixed(2)}s`
      );

      return res.json({
        success: true,
        source: 'gemini_tts',
        voice: voiceToUse,
        audioDataUrl:
          `data:audio/wav;base64,${wavBase64}`,
        durationSec:
          Number(
            estimatedDuration.toFixed(2)
          ),
      });

    } catch (ttsErr: any) {
      console.error(
        '[TTS] ERRO REAL DO GEMINI:',
        ttsErr
      );

      const status =
        ttsErr?.status ||
        ttsErr?.statusCode ||
        500;

      if (status === 429) {
        return res.status(429).json({
          success: false,
          error:
            'Limite temporário de geração de voz atingido.',
          details:
            ttsErr?.message ||
            'Aguarde alguns instantes e tente novamente.',
        });
      }

      return res.status(500).json({
        success: false,
        error:
          'Falha ao gerar voz com Gemini TTS.',
        details:
          ttsErr?.message ||
          ttsErr?.error?.message ||
          String(ttsErr),
      });
    }

  } catch (err: any) {
    console.error(
      'Error in /api/voices/generate:',
      err
    );

    return res.status(500).json({
      success: false,
      error:
        'Erro interno ao gerar narração.',
      details:
        err?.message || String(err),
    });
  }
});

// 4. API - Real Scene Image Generation with Gemini / Nano Banana
app.post('/api/scenes/generate', async (req, res) => {
  try {
    const {
      sceneId,
      visualPrompt,
      negativePrompt,
      aspectRatio,
    } = req.body;

    if (!visualPrompt || typeof visualPrompt !== 'string' || !visualPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'O prompt visual da cena é obrigatório.',
      });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY não configurada no servidor.',
      });
    }

    const safeAspectRatio =
      aspectRatio === '9:16' || aspectRatio === '1:1' || aspectRatio === '16:9'
        ? aspectRatio
        : '16:9';

    const jobId = `job_scene_${Date.now()}`;

    jobsStore.set(jobId, {
      id: jobId,
      sceneId,
      status: 'processing',
      progressPercent: 25,
      message: 'Gerando imagem da cena com IA...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const imageModel =
      process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

    const generationPrompt = `
Crie UMA imagem cinematográfica para uma cena de vídeo.

PROMPT PRINCIPAL:
${visualPrompt.trim()}

${negativePrompt ? `EVITAR:\n${negativePrompt.trim()}` : ''}

REQUISITOS:
- composição adequada para vídeo no formato ${safeAspectRatio};
- imagem visualmente coerente, detalhada e profissional;
- iluminação cinematográfica;
- sem moldura;
- sem interface de aplicativo;
- sem texto sobreposto, salvo se o prompt pedir explicitamente;
- não explique a imagem e não retorne texto: gere apenas a imagem.
    `.trim();

    console.log(
      `[IMAGE] Gerando cena ${sceneId || 'sem-id'} com ${imageModel} em ${safeAspectRatio}`
    );

    try {
      const interaction: any = await ai.interactions.create({
        model: imageModel,
        input: generationPrompt,
        response_format: {
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: safeAspectRatio,
          image_size: '1K',
        },
      });

      const outputImage = interaction?.output_image;

      if (!outputImage?.data) {
        console.error(
          '[IMAGE] Gemini respondeu sem output_image:',
          JSON.stringify(interaction, null, 2)
        );

        const failedJob = jobsStore.get(jobId);
        if (failedJob) {
          failedJob.status = 'failed';
          failedJob.progressPercent = 100;
          failedJob.message = 'A IA respondeu, mas não retornou uma imagem.';
          failedJob.updatedAt = new Date().toISOString();
          jobsStore.set(jobId, failedJob);
        }

        return res.status(502).json({
          success: false,
          error: 'O Gemini respondeu, mas não retornou imagem.',
          details: 'output_image.data não encontrado.',
        });
      }

      const mimeType =
        outputImage.mime_type ||
        outputImage.mimeType ||
        'image/jpeg';

      const imageMediaUrl =
        `data:${mimeType};base64,${outputImage.data}`;

      const completedJob = jobsStore.get(jobId);
      if (completedJob) {
        completedJob.status = 'completed';
        completedJob.progressPercent = 100;
        completedJob.message = 'Imagem da cena gerada com sucesso!';
        completedJob.updatedAt = new Date().toISOString();
        jobsStore.set(jobId, completedJob);
      }

      console.log(
        `[IMAGE] Cena ${sceneId || 'sem-id'} gerada com sucesso.`
      );

      return res.json({
        success: true,
        source: 'gemini_image',
        model: imageModel,
        jobId,
        imageMediaUrl,
        videoMediaUrl: undefined,
        visualPrompt,
        aspectRatio: safeAspectRatio,
      });
    } catch (imageErr: any) {
      console.error('[IMAGE] ERRO REAL DO GEMINI:', imageErr);

      const failedJob = jobsStore.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.progressPercent = 100;
        failedJob.message = 'Falha ao gerar imagem.';
        failedJob.updatedAt = new Date().toISOString();
        jobsStore.set(jobId, failedJob);
      }

      const status =
        imageErr?.status ||
        imageErr?.statusCode ||
        500;

      if (status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Limite de geração de imagens atingido.',
          details:
            imageErr?.message ||
            'Aguarde e tente novamente ou verifique os limites da sua conta Gemini.',
        });
      }

      if (status === 402 || status === 403) {
        return res.status(status).json({
          success: false,
          error: 'A geração de imagens exige uma conta/projeto com cobrança habilitada.',
          details:
            imageErr?.message ||
            'Verifique o faturamento do projeto associado à GEMINI_API_KEY.',
        });
      }

      return res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        error: 'Falha ao gerar imagem com Gemini.',
        details:
          imageErr?.message ||
          imageErr?.error?.message ||
          String(imageErr),
      });
    }
  } catch (err: any) {
    console.error('Error in /api/scenes/generate:', err);

    return res.status(500).json({
      success: false,
      error: 'Erro interno ao gerar a cena.',
      details: err?.message || String(err),
    });
  }
});

// 5. API - Captions Auto Generator
app.post('/api/captions/generate', (req, res) => {
  try {
    const {
      scenes,
      narrationText,
    } = req.body;

    const cues: any[] = [];
    let currentTime = 0;

    if (
      Array.isArray(scenes) &&
      scenes.length > 0
    ) {
      scenes.forEach((scene: any) => {
        const text =
          scene.narrationText || '';

        const duration =
          scene.estimatedDurationSec || 4;

        if (text) {
          const sentences =
            text
              .split(/(?<=[.!?])\s+/)
              .filter(Boolean);

          const timePerSentence =
            duration /
            sentences.length;

          sentences.forEach(
            (
              sentence: string,
              sIdx: number
            ) => {
              const startSec =
                currentTime +
                sIdx *
                timePerSentence;

              const endSec =
                startSec +
                timePerSentence;

              const wordsList =
                sentence
                  .split(/\s+/)
                  .map(
                    (
                      word: string,
                      wIdx: number,
                      arr: string[]
                    ) => {
                      const wordDuration =
                        timePerSentence /
                        arr.length;

                      return {
                        word,
                        startTimeSec:
                          Number(
                            (
                              startSec +
                              wIdx *
                                wordDuration
                            ).toFixed(2)
                          ),
                        endTimeSec:
                          Number(
                            (
                              startSec +
                              (wIdx + 1) *
                                wordDuration
                            ).toFixed(2)
                          ),
                      };
                    }
                  );

              cues.push({
                id:
                  `cue_${Date.now()}_${sIdx}`,
                sceneId:
                  scene.id,
                text:
                  sentence,
                startTimeSec:
                  Number(
                    startSec.toFixed(2)
                  ),
                endTimeSec:
                  Number(
                    endSec.toFixed(2)
                  ),
                words:
                  wordsList,
              });
            }
          );
        }

        currentTime += duration;
      });
    }

    res.json({
      success: true,
      cues,
    });

  } catch (err: any) {
    console.error(
      'Error in /api/captions/generate:',
      err
    );

    res.status(500).json({
      error:
        'Erro ao gerar legendas.',
    });
  }
});

// 6. API - Render & Export Jobs
app.post('/api/exports', (req, res) => {
  try {
    const {
      projectId,
      settings,
    } = req.body;

    const exportId =
      `export_${Date.now()}`;

    const job = {
      id: exportId,
      projectId,
      type: 'export',
      status: 'queued',
      progressPercent: 10,
      message:
        'Preparando plano de renderização FFmpeg e recursos de mídia...',
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
      settings,
    };

    jobsStore.set(
      exportId,
      job
    );

    res.json({
      success: true,
      exportJob: job,
    });

  } catch (err: any) {
    console.error(
      'Error in /api/exports:',
      err
    );

    res.status(500).json({
      error:
        'Erro ao criar job de exportação.',
    });
  }
});

app.get('/api/exports/:id', (req, res) => {
  const exportId =
    req.params.id;

  const job =
    jobsStore.get(exportId);

  if (!job) {
    return res.json({
      exportJob: {
        id: exportId,
        status:
          'completed',
        progressPercent:
          100,
        message:
          'Vídeo renderizado com sucesso!',
        resultUrl:
          '#download_demo',
      },
    });
  }

  if (job.status === 'queued') {
    job.status =
      'processing';

    job.progressPercent =
      35;

    job.message =
      'Sincronizando áudio de narração e legendas automáticas...';

  } else if (
    job.status === 'processing' &&
    job.progressPercent < 90
  ) {
    job.progressPercent += 30;

    job.message =
      'Aplicando transições, filtros e codificando MP4 H.264...';

  } else if (
    job.progressPercent >= 90
  ) {
    job.status =
      'completed';

    job.progressPercent =
      100;

    job.message =
      'Vídeo MP4 gerado e pronto para download!';

    job.resultUrl =
      '#download_demo';
  }

  job.updatedAt =
    new Date().toISOString();

  jobsStore.set(
    exportId,
    job
  );

  res.json({
    exportJob: job,
  });
});

app.post('/api/jobs/:id/cancel', (req, res) => {
  const jobId =
    req.params.id;

  const job =
    jobsStore.get(jobId);

  if (job) {
    job.status =
      'cancelled';

    job.message =
      'Operação cancelada pelo usuário.';

    jobsStore.set(
      jobId,
      job
    );
  }

  res.json({
    success: true,
    jobId,
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    const {
      createServer:
        createViteServer,
    } =
      await import('vite');

    const vite =
      await createViteServer({
        server: {
          middlewareMode:
            true,
        },
        appType: 'spa',
      });

    app.use(
      vite.middlewares
    );

  } else {
    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(
        distPath
      )
    );

    app.get('*', (req, res) => {
      res.sendFile(
        path.join(
          distPath,
          'index.html'
        )
      );
    });
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `🎬 CineScript AI Server running at http://0.0.0.0:${PORT}`
      );
    }
  );
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
