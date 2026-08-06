# 🎬 CineScript AI — Editor de Vídeos com IA

> **Transforme roteiros em vídeos completos e editáveis com narração estilo CapCut, cenas geradas por IA, legendas automáticas e exportação em alta resolução.**

---

## 📌 Visão Geral

O **CineScript AI** é uma plataforma web para criação e edição de vídeos impulsionada por inteligência artificial. Com apenas um texto de roteiro, o aplicativo utiliza a **Gemini API** para analisar e dividir a história em cenas sequenciais, gera narrações profissionais com um catálogo de **6 estilos de voz** inspirados em perfis de alta performance e cria prompts visuais para composição na linha do tempo.

---

## ✨ Recursos Principais

### 🎙️ Catálogo de Vozes com IA (Estilo CapCut)
- **Valentino**: Narrador Elegante — tom grave, refinado e sofisticado para documentários.
- **Rayo**: Energia Rápida — jovem, dinâmico e acelerado, ideal para Shorts, Reels e TikTok.
- **Knightley**: Narrador Cinematográfico — voz profunda e dramática para histórias marcantes.
- **Nandez**: Comunicador Natural — tom amigável, autêntico e conversacional.
- **Mentora Estável**: Mentora Serena — voz firme e profissional para tutoriais e negócios.
- **Amelia**: Voz Feminina Acolhedora — tom suave, quente e expressivo.

### 📜 Análise de Roteiro com Gemini
- Divisão automática de texto em cenas cronometradas.
- Geração de prompts visuais detalhados e prompts negativos por cena.
- Bíblia de continuidade (personagens e cenários).

### 📐 Múltiplos Formatos de Vídeo
- **Vertical 9:16** (1080 × 1920) — Shorts, Reels, TikTok.
- **Horizontal 16:9** (1920 × 1080) — YouTube e Apresentações.
- **Quadrado 1:1** (1080 × 1080) — Instagram Feed.

### ⏱️ Timeline Multifaixa & Pré-visualização
- Monitor de prévia com renderização de vídeo e imagem.
- Legendas automáticas com destaque palavra por palavra (Word Highlight).
- Timeline multifaixa (Vídeo principal, Narração, Trilha Sonora, Legendas).
- Ferramentas de corte (split), exclusão e ajuste de duração.

### 🎞️ Biblioteca Criativa & Exportação
- Transições de cena, filtros de cor, animações e stickers.
- Gerenciador de jobs de exportação MP4 em 720p, 1080p ou 4K.
- Opção para incorporar legendas diretamente ao vídeo (burn-in captions).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion.
- **Backend**: Express (Node.js/TypeScript) executado via `tsx` em desenvolvimento e empacotado via `esbuild`.
- **Inteligência Artificial**: SDK oficial `@google/genai` (Modelos `gemini-3.6-flash` e `gemini-3.1-flash-tts-preview`).
- **Persistência**: LocalStorage + Módulos de repositório configurados para integração com Firebase Firestore.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js v18+ e npm.

### Passos de Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env` e defina sua chave da Gemini API:
   ```env
   GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"
   APP_URL="http://localhost:3000"
   ```
   *(Caso não informe uma chave, o aplicativo rodará automaticamente no **Modo Demonstração** com sintetizador local).*

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Estrutura do Projeto

```text
├── server.ts                    # Backend Express com rotas de API e integrações Gemini
├── src/
│   ├── App.tsx                  # Componente principal e orquestrador de estado
│   ├── types.ts                 # Definições estritas de TypeScript
│   ├── data/
│   │   ├── voices.ts            # Catálogo dos 6 estilos de voz
│   │   ├── creativeLibrary.ts   # Efeitos, transições, filtros e stickers
│   │   └── sampleProjects.ts    # Projeto demonstrativo pré-carregado
│   └── components/
│       ├── Header.tsx           # Barra superior com título, formato e exportação
│       ├── Dashboard.tsx        # Painel de gerenciamento de projetos
│       ├── CreationWizardModal.tsx # Assistente de criação em 6 etapas
│       ├── LeftSidebar.tsx      # Abas de Cenas, Vozes, Legendas, Efeitos e Mídia
│       ├── PreviewPlayer.tsx    # Monitor de prévia com sobreposição de legendas
│       ├── ContextInspector.tsx # Painel lateral de propriedades da cena
│       ├── TimelineEditor.tsx   # Linha do tempo multifaixa interativa
│       └── ExportModal.tsx      # Modal de renderização e download de vídeo MP4
├── metadata.json                # Configurações do applet AI Studio
├── package.json                 # Scripts de build, start e dev
└── vite.config.ts               # Configuração do Vite e aliases
```

---

## 🛰️ Endpoints da API

- `GET /api/health` — Status do servidor e detecção de chave API.
- `POST /api/scripts/analyze` — Análise de roteiro e divisão em cenas via Gemini.
- `POST /api/voices/generate` — Geração de narração em áudio (Gemini TTS / Síntese local).
- `POST /api/scenes/generate` — Geração de assets visuais por cena.
- `POST /api/captions/generate` — Alinhamento e geração de marcações temporais para legendas.
- `POST /api/exports` — Criação de job de renderização de vídeo.
- `GET /api/exports/:id` — Status do progresso de exportação MP4.

---

## 📄 Licença e Isenção de Responsabilidade

Este projeto foi desenvolvido como uma demonstração tecnológica independente. Todos os nomes de vozes e estilos visuais são originais e não possuem vinculação oficial com o CapCut ou com serviços proprietários de terceiros.
