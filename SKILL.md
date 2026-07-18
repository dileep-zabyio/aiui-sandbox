---
name: aiui-test-playground
description: >
  AIUI Test Playground — a Vite + React + TypeScript sandbox for building
  AI chat interfaces powered by the Zaby Agentic OS SDK and AIUI React
  component library. This skill covers project setup, Zaby agent creation,
  and UI extension using the published npm packages.
---

# AIUI Test Playground

## Overview

This project is a standalone React playground application that demonstrates a
production-quality AI chat interface. It connects to **Zaby Agentic OS** via
the `@zaby-ai/sdk` and renders rich interactive UI artifacts using
`@zaby-ai/aiui-react` components.

> **IMPORTANT**: This project does NOT depend on any local sibling repositories.
> All `@zaby-ai/*` packages are installed from the **public npm registry**.

---

## 1. Project Setup

### Prerequisites

- **Node.js** ≥ 20
- **bun** (preferred) or **npm**

### Install & Run

```bash
# Install dependencies from npm (no local repos needed)
bun install

# Start the development server
bun run dev

# Build for production
bun run build
```

### Key Dependencies (from npm)

| Package                 | Purpose                                          |
|-------------------------|--------------------------------------------------|
| `@zaby-ai/sdk`          | Zaby Agentic OS TypeScript SDK — agent management, runtime tokens, runs, MCP, knowledge bases |
| `@zaby-ai/aiui-react`   | React UI components — Chat, Chart, Spreadsheet, Image, Gallery, Map, and more |
| `@zaby-ai/aiui-core`    | Core protocol types and schemas (pulled transitively by aiui-react) |
| `react` / `react-dom`   | React 19                                         |
| `framer-motion`         | Animation library                                |
| `tailwindcss`           | Utility-first CSS framework                      |
| `zod`                   | Runtime schema validation                        |

### Adding New `@zaby-ai` Packages

All packages are scoped under `@zaby-ai` on the **public npmjs.org** registry.
No `.npmrc` or GitHub Packages configuration is needed. Simply:

```bash
bun add @zaby-ai/aiui-react@latest
bun add @zaby-ai/aiui-core@latest
bun add @zaby-ai/sdk@latest
```

---

## 2. Architecture

```
aiui-test/
├── src/
│   ├── App.tsx                     # Main application shell (chat + showcase)
│   ├── main.tsx                    # React entry point
│   ├── App.css / index.css         # Global styles + Tailwind base
│   ├── components/
│   │   ├── ArtifactRenderer.tsx    # Maps LLM artifact blocks → AIUI components
│   │   └── SettingsModal.tsx       # Zaby / OpenAI / Firecrawl config UI
│   └── services/
│       ├── zaby.ts                 # Zaby SDK integration (tokens, runs, SSE)
│       ├── openai.ts               # OpenAI direct API streaming
│       ├── firecrawl.ts            # Web search context via Firecrawl
│       ├── systemPrompt.ts         # LLM system prompt with artifact protocol
│       └── artifactParser.ts       # Parses :::artifact{} blocks from LLM output
├── vite.config.ts                  # Vite + CORS proxy + Firecrawl proxy
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript config
└── package.json                    # All deps from public npm registry
```

---

## 3. Zaby SDK Integration

The project uses the Zaby SDK (`@zaby-ai/sdk`) to interact with the
Zaby Agentic OS platform. The SDK provides two main entry points:

### 3.1 `Zaby` — Management Client (API Key auth)

Used for creating agents, managing deployments, MCP tools, and knowledge bases.

```typescript
import { configureZaby, Zaby } from '@zaby-ai/sdk';

configureZaby({ apiOrigin: 'https://genapi.zaby.io' });

const zaby = new Zaby({ apiKey: '<YOUR_API_KEY>' });

// Available clients:
// zaby.agents          — Create, publish, deploy agents
// zaby.deployments     — Manage deployments
// zaby.externalApps    — External app management
// zaby.runtimeTokens   — Mint/rotate/revoke runtime tokens
// zaby.knowledgeBases  — Create/manage knowledge bases & documents
// zaby.mcp             — MCP server catalog, installations, tool management
// zaby.memory          — Agent memory items and candidates
// zaby.intelligence    — Signals, rollups, improvements
// zaby.approvals       — Human-in-the-loop approvals
// zaby.usage           — Usage analytics
```

### 3.2 `ZabyRuntime` — Runtime Client (Token auth)

Used for running agents and streaming responses in production/client-side code.

```typescript
import { ZabyRuntime } from '@zaby-ai/sdk/runtime';
import type { SseEvent } from '@zaby-ai/sdk/types';

const runtime = new ZabyRuntime({ token: '<RUNTIME_TOKEN>' });

// Start a run
const runResponse = await runtime.runs.start({
  input: { message: 'Hello' },
  externalSessionId: 'optional-session-id',
});

// Stream events
for await (const event of runtime.runs.stream(runId)) {
  // Handle SSE events (text chunks, tool calls, etc.)
}
```

### 3.3 Authentication Modes

The playground supports two Zaby authentication modes (configured in Settings):

1. **Direct Token** — Paste a pre-minted Zaby Runtime Token directly.
2. **Auto-Mint** — Provide an API Key + App ID + Deployment ID, and the
   playground mints a short-lived runtime token on each session.

---

## 4. Agent Setup — ASK THE USER

When setting up a new Zaby agent for this playground, **you MUST ask the user**
the following questions before proceeding:

### 4.1 Agent Type

> **Ask**: "What type of Zaby agent should I create?"

Possible agent types include:
- **Conversational** — General chat agent with text input/output
- **Task-oriented** — Agent focused on specific workflows/automations
- **RAG-powered** — Agent with knowledge base retrieval augmented generation
- **Multi-modal** — Agent that handles text, images, files, and other media
- **Custom** — User-defined agent configuration

### 4.2 Skills

> **Ask**: "Which skills should I add to the agent?"

Skills extend the agent's capabilities. Examples:
- Code generation and execution
- Data analysis and visualization
- Document summarization
- Web browsing and research
- Image generation
- Custom domain-specific skills

Use `zaby.agents.attachSkill(agentId, skillConfig)` to attach skills.

### 4.3 MCP Tools

> **Ask**: "Which MCP (Model Context Protocol) servers and tools should I connect?"

MCP integrations provide the agent access to external tools and services.

```typescript
// List available MCP servers from catalog
const catalog = await zaby.mcp.listCatalog();

// Install an MCP server
const installation = await zaby.mcp.installServer({
  serverId: '<SERVER_ID>',
  // ... configuration
});

// Attach MCP tools to an agent
await zaby.agents.attachMcpTool(agentId, {
  installationId: '<INSTALLATION_ID>',
  toolName: '<TOOL_NAME>',
});
```

Common MCP integrations include:
- **File system** — Read/write files
- **Database** — Query SQL/NoSQL databases
- **API connectors** — REST/GraphQL third-party APIs
- **Web search** — Search engine integrations
- **Code execution** — Sandboxed code runners

### 4.4 Knowledge Bases

> **Ask**: "Which knowledge bases should I attach to the agent?"

Knowledge bases provide the agent with domain-specific context via RAG.

```typescript
// Create a knowledge base
const kb = await zaby.knowledgeBases.create({
  name: 'Product Documentation',
  // ... configuration
});

// Upload documents
await zaby.knowledgeBases.uploadTextDocument(kb.id, {
  title: 'API Reference',
  content: '...',
});

// Attach to agent
await zaby.agents.attachKnowledgeBase(agentId, {
  knowledgeBaseId: kb.id,
});
```

Knowledge base sources can include:
- Text documents (markdown, plain text)
- PDF files
- Web pages (crawled and indexed)
- API documentation
- Internal wikis and confluence pages

---

## 5. Creating and Deploying an Agent (Full Workflow)

Once the user has answered the questions above, follow this workflow:

```typescript
import { configureZaby, Zaby } from '@zaby-ai/sdk';

// 1. Configure the SDK
configureZaby({ apiOrigin: 'https://genapi.zaby.io' });
const zaby = new Zaby({ apiKey: '<USER_API_KEY>' });

// 2. Create the agent
const agent = await zaby.agents.create({
  name: '<AGENT_NAME>',
  description: '<AGENT_DESCRIPTION>',
  systemPrompt: '<SYSTEM_PROMPT>',
  // ... other config based on agent type
});

// 3. Attach skills (based on user's answer)
for (const skill of selectedSkills) {
  await zaby.agents.attachSkill(agent.id, skill);
}

// 4. Attach MCP tools (based on user's answer)
for (const mcpTool of selectedMcpTools) {
  await zaby.agents.attachMcpTool(agent.id, mcpTool);
}

// 5. Attach knowledge bases (based on user's answer)
for (const kb of selectedKnowledgeBases) {
  await zaby.agents.attachKnowledgeBase(agent.id, {
    knowledgeBaseId: kb.id,
  });
}

// 6. Publish the agent
await zaby.agents.publish(agent.id);

// 7. Deploy the agent
const deployment = await zaby.deployments.create(agent.id, {
  // deployment configuration
});

// 8. Create an external app and bind the deployment
const app = await zaby.externalApps.create({
  name: '<APP_NAME>',
  // ... app configuration
});
await zaby.externalApps.bindDeployment(app.id, {
  deploymentId: deployment.id,
});

// 9. Mint a runtime token for the playground
const tokenResponse = await zaby.runtimeTokens.create({
  externalAppId: app.id,
  deploymentId: deployment.id,
  externalUserId: 'playground-user',
  channel: 'server',
  ttlSeconds: 3600,
  maxUses: 100,
});

// 10. Use the token in the playground Settings modal
console.log('Runtime Token:', tokenResponse.token);
```

---

## 6. UI Components

### From `@zaby-ai/aiui-react` (npm)

The published package currently exports these components:

- **Hooks**: `useAgentChat`, `useChatUI`, `useRealtimeVoice`, `useVoicePipeline`
- **Providers**: `AgentProvider`, `A2UIProvider`, `ArtifactProvider`, `ExecutionProvider`
- **Chat UI**: `Chat`, `InputArea`, `MessageList`
- **Blocks**: `AiuiBlockRenderer`, `AiuiCodeBlock`, `AiuiDataTableBlock`, etc.
- **GPA**: `ThinkingIndicator`, `ReasoningBlock`, `ToolCallBlock`, `ArtifactRenderer`
- **Display**: `Chart`, `Spreadsheet`, `Image`, `Gallery`, `Map`, `DataGrid`
- **Utilities**: `cn` (classname merger), `Markdown`

### Local Mock Components

Components not yet published to npm are mocked locally in `App.tsx` and
`ArtifactRenderer.tsx`. These include: `Textarea`, `SendButton`, `Sidebar`,
`SessionGroup`, `SessionItem`, `MessageBubble`, `FileSelector`, `FilePreview`,
`VoiceInput`, `AttachmentMenu`, `ThinkingIndicatorPrimitive`, `MetricsCard`,
`Calendar`, `Timeline`, `FlowDiagram`, `JSONViewer`, `Tabs`, `Accordion`,
`Form`, `Badge`, `Alert`, `Progress`, `Loading`, `Divider`, `Table`,
`CodeBlock`, `Card`, `LinkedInputChart`, `ConversationOutline`,
`VoiceVisualizer`, and more.

When newer versions of `@zaby-ai/aiui-react` are published with these exports,
remove the local mocks and import from the package directly.

---

## 7. Artifact Protocol

The LLM system prompt (in `src/services/systemPrompt.ts`) instructs the model
to output structured UI artifacts using a fenced block syntax:

```
:::artifact{type="<type>" title="<title>"}
<JSON props>
:::
```

The `artifactParser.ts` service parses these blocks and the
`ArtifactRenderer.tsx` component maps each artifact type to the corresponding
React component.

### Supported Artifact Types

`table`, `code`, `chart`, `linked_input_chart`, `conversation_outline`,
`metrics`, `timeline`, `card`, `json`, `flow_diagram`, `sequence_diagram`,
`accordion`, `tabs`, `alert`, `progress`, `spreadsheet`, `calendar`, `tree`,
`pdf`, `map`, `canvas`, `gallery`, `file`, `video`, `iframe`, `mermaid`, `html`

---

## 8. Configuration Services

| Service         | File                          | Purpose                              |
|-----------------|-------------------------------|--------------------------------------|
| Zaby SDK        | `src/services/zaby.ts`        | Runtime token resolution, run streaming |
| OpenAI          | `src/services/openai.ts`      | Direct OpenAI API chat streaming     |
| Firecrawl       | `src/services/firecrawl.ts`   | Web search context enrichment        |
| System Prompt   | `src/services/systemPrompt.ts`| LLM artifact protocol instructions   |
| Artifact Parser | `src/services/artifactParser.ts` | Parses `:::artifact{}:::` blocks  |

All configuration is persisted in `localStorage` and managed through the
Settings modal (`src/components/SettingsModal.tsx`).

---

## 9. Development Notes

- **Vite dev server** includes a CORS proxy plugin for iframe embeds and a
  Firecrawl reverse proxy (see `vite.config.ts`).
- **TailwindCSS 3** is used for styling with a dark-theme-first design system.
- **Framer Motion** powers all animations and transitions.
- **TypeScript** strict mode with `tsc -b` for type checking before builds.
- Run `bun run lint` to check code quality with oxlint.
