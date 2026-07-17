import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sparkles, Trash2, PanelLeftOpen, Plus, Settings, Cpu, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart,
  Spreadsheet,
  cn,
  type UIMessage
} from '@zaby-ai/aiui-react';

type UIMessageType = UIMessage & { senderName?: string };

// Mock implementations for components missing in published @zaby-ai/aiui-react@0.1.2
const Textarea = ({ value, onChange, onEnterPress, placeholder, disabled, className, maxHeight, ...props }: any) => {
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnterPress?.();
    }
  };
  return (
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      style={{ maxHeight }}
      {...props}
    />
  );
};

const SendButton = ({ onClick, disabled, isStreaming, ...props }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-colors ${
      isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
    }`}
    {...props}
  >
    {isStreaming ? 'Stop' : 'Send'}
  </button>
);

const FileSelector = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
const FilePreview = (_props: any) => null;
const MessageBubble = ({ message, children, onEditSubmit, onRegenerate, onFeedback, isStreaming, ...props }: any) => (
  <div className={`p-4 rounded-xl border text-sm text-left flex flex-col gap-2 ${message.role === 'user' ? 'bg-muted/30 border-border/50' : 'bg-card border-border/80'}`} {...props}>
    <div className="flex items-center justify-between border-b border-border/40 pb-1 text-xs text-muted-foreground select-none">
      <span className="font-bold">{message.role === 'user' ? 'You' : 'Assistant'}</span>
    </div>
    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
    {children}
  </div>
);
const ThinkingIndicatorPrimitive = ({ statusText }: any) => (
  <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 select-none pl-2">
    <span>⚙️</span> {statusText || 'Thinking...'}
  </div>
);
const AttachmentMenu = (_props: any) => null;

const Sidebar = ({ isOpen, onClose, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0 z-20 transition-all duration-300 ease-in-out">
      <div className="flex justify-end p-2 border-b border-border/40">
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          Close ✕
        </button>
      </div>
      {children}
    </div>
  );
};

const SessionGroup = ({ title, children }: any) => (
  <div className="mb-4 text-left">
    <div className="px-2.5 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{title}</div>
    <div className="mt-1 space-y-0.5">{children}</div>
  </div>
);

const SessionItem = ({ id, title, isActive, onSelect, onDelete, onRename }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  return (
    <div 
      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors select-none ${
        isActive 
          ? 'bg-muted/80 text-foreground font-semibold border border-border/40' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-transparent'
      }`} 
      onClick={() => onSelect?.(id)}
    >
      {isEditing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onRename?.(id, editTitle);
              setIsEditing(false);
            }
          }}
          className="bg-transparent border-0 outline-none text-xs w-full text-foreground"
        />
      ) : (
        <span className="truncate flex-grow">{title}</span>
      )}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
          className="p-1 hover:bg-muted rounded-md text-[10px]"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(id);
          }}
          className="p-1 hover:bg-muted rounded-md text-[10px] text-red-500"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

const VoiceInput = (_props: any) => null;
const MetricsCard = ({ title, value, change, changeType, icon, trend, ...props }: any) => (
  <div className="p-5 bg-card/45 border border-border/80 rounded-xl leading-relaxed text-left relative flex flex-col justify-between overflow-hidden shadow-sm" {...props}>
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{title}</span>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  </div>
);

const Calendar = ({ events }: any) => (
  <div className="p-5 bg-card/45 border border-border/80 rounded-xl text-left">
    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Calendar Schedule</div>
    <div className="space-y-1.5 max-h-48 overflow-y-auto">
      {events?.map((evt: any) => (
        <div key={evt.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/40 text-xs">
          <span>{evt.title}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{evt.start}</span>
        </div>
      ))}
    </div>
  </div>
);

const Timeline = (_props: any) => null;
const FlowDiagram = (_props: any) => null;
const JSONViewer = ({ data, ...props }: any) => (
  <pre className="font-mono text-[10px] bg-muted/30 p-4 border border-border/50 rounded-lg overflow-x-auto text-muted-foreground text-left whitespace-pre" {...props}>
    {JSON.stringify(data, null, 2)}
  </pre>
);
const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const Accordion = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>;
const Badge = ({ children, ...props }: any) => (
  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted border border-border/60 text-muted-foreground select-none" {...props}>
    {children}
  </span>
);
const Alert = ({ children, ...props }: any) => (
  <div className="p-4 border rounded-xl bg-destructive/10 border-destructive/20 text-destructive text-xs leading-relaxed text-left flex gap-2" {...props}>
    <span>⚠️</span>
    <div>{children}</div>
  </div>
);
const Progress = (_props: any) => null;
const Loading = (_props: any) => <div className="text-xs text-muted-foreground select-none">Loading...</div>;
const Divider = (_props: any) => <hr className="border-border/50 my-4" />;
const LinkedInputChart = (_props: any) => null;
const ConversationOutline = ({ title, items, onSelect }: any) => (
  <div className="p-4 bg-muted/15 border border-border/80 rounded-xl text-left select-none">
    {title && <h3 className="text-xs font-bold text-foreground mb-3">{title}</h3>}
    <div className="space-y-1">
      {items?.map((item: any) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          className="w-full text-left p-1.5 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground truncate transition-colors cursor-pointer"
        >
          {item.icon && <span className="mr-1.5">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  </div>
);
const VoiceVisualizer = (_props: any) => null;

import { SettingsModal } from './components/SettingsModal';
import { ArtifactRenderer } from './components/ArtifactRenderer';
import { getStoredPlaygroundConfig, savePlaygroundConfig, streamZabyRun, type PlaygroundConfig } from './services/zaby';
import { streamChat, transcribeAudio, type OpenAIChatMessage } from './services/openai';
import { SYSTEM_PROMPT } from './services/systemPrompt';
import { parseArtifacts, type ContentBlock } from './services/artifactParser';
import { searchWeb, getStoredFirecrawlConfig, saveFirecrawlConfig } from './services/firecrawl';

interface ChatSession {
  id: string;
  title: string;
  group: string;
  messages: UIMessageType[];
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Free Tier ✓)' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Free Tier ✓)' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
  { id: 'o3-mini', label: 'o3-mini' },
  { id: 'gpt-image-1', label: 'GPT Image 1' },
];

function getOutlineTitle(content: string): string {
  const lines = content.trim().split('\n');
  let firstLine = lines[0].trim();
  firstLine = firstLine.replace(/[#*`_[\]()-]/g, '').trim();
  const words = firstLine.split(/\s+/);
  if (words.length > 7) {
    return words.slice(0, 7).join(' ') + '...';
  }
  return firstLine || 'Topic';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'showcase'>('chat');
  
  // Voice Visualizer Demo States
  const [visType, setVisType] = useState<'orb' | 'wave'>('orb');
  const [visState, setVisState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [visUseMic, setVisUseMic] = useState(false);
  const [visColorTheme, setVisColorTheme] = useState<'cyan' | 'violet' | 'green' | 'amber'>('cyan');

  const visColors = useMemo(() => {
    switch (visColorTheme) {
      case 'cyan':
        return { primary: '#06b6d4', secondary: '#8b5cf6' };
      case 'violet':
        return { primary: '#8b5cf6', secondary: '#ec4899' };
      case 'green':
        return { primary: '#10b981', secondary: '#3b82f6' };
      case 'amber':
        return { primary: '#f59e0b', secondary: '#ef4444' };
    }
  }, [visColorTheme]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playgroundConfig, setPlaygroundConfig] = useState<PlaygroundConfig>(getStoredPlaygroundConfig());
  
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  
  // Mock showcase telemetry states
  const [showcaseInterrupt, setShowcaseInterrupt] = useState(false);
  const [showcaseApproval, setShowcaseApproval] = useState(false);
  const [showcaseReview, setShowcaseReview] = useState(false);
  const [showcaseLogsList, setShowcaseLogsList] = useState<string[]>([
    '1. [06:45:12] invoke_subagent: scanning Cwd targets...',
    '2. [06:45:14] read_file: read package.json dependencies list.',
    '3. [06:45:15] run_command: compile check of aiui-core.',
    '4. [06:45:16] resolve: branch workspace is fully synced.'
  ]);
  const [isShowcaseReasoning, setIsShowcaseReasoning] = useState(false);
  const [showcaseToolActive, setShowcaseToolActive] = useState(false);
  const [showcaseToolOutput, setShowcaseToolOutput] = useState(true);
  const [artifactGalleryTab, setArtifactGalleryTab] = useState<'preview' | 'code'>('preview');
  
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Search & PDF Slide-over State
  const [isSearchEnabled, setIsSearchEnabled] = useState(() => getStoredFirecrawlConfig().isSearchEnabled);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [thinkingStatus, setThinkingStatus] = useState<string>('Thinking...');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Listen for open-pdf-panel custom events
  useEffect(() => {
    const handleOpenPdf = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string }>;
      if (customEvent.detail?.url) {
        setActivePdfUrl(customEvent.detail.url);
      }
    };
    window.addEventListener('open-pdf-panel', handleOpenPdf);
    return () => {
      window.removeEventListener('open-pdf-panel', handleOpenPdf);
    };
  }, []);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initial mock sessions
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-1',
      title: 'Welcome Session',
      group: 'Today',
      messages: [
        {
          id: 'init-1',
          role: 'assistant',
          senderName: 'Assistant',
          content: 'Hello! I can create rich interactive artifacts — tables, charts, code blocks, diagrams, and more. Try asking me something like:\n\n- "Compare React, Vue, and Angular in a table"\n- "Write a Python quicksort function"\n- "Show monthly sales data as a chart"\n\nMake sure to configure your **Settings** (gear icon) first!'
        }
      ]
    }
  ]);

  const [activeSessionId, setActiveSessionId] = useState('session-1');
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  const [activeOutlineId, setActiveOutlineId] = useState<string | undefined>(undefined);
  const [isOutlineHovered, setIsOutlineHovered] = useState(false);

  const outlineItems = useMemo(() => {
    return messages
      .filter((m) => m.role === 'user')
      .map((m) => {
        let timeStr = '';
        if (m.timestamp) {
          try {
            const date = new Date(m.timestamp);
            timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch {
            // ignore
          }
        }
        return {
          id: m.id,
          label: getOutlineTitle(m.content),
          timestamp: timeStr || undefined,
          icon: '💬',
        };
      });
  }, [messages]);

  const showOutlineSidebar = outlineItems.length >= 3;

  // Sync scroll positioning to outline highlights
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !showOutlineSidebar) return;

    const handleScroll = () => {
      const messageDivs = scrollContainer.querySelectorAll('[data-message-id]');
      if (!messageDivs.length) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const triggerY = containerRect.top + 100;

      let currentActive: string | undefined = undefined;

      for (let i = 0; i < messageDivs.length; i++) {
        const div = messageDivs[i] as HTMLDivElement;
        const rect = div.getBoundingClientRect();

        if (rect.top <= triggerY) {
          currentActive = div.getAttribute('data-message-id') || undefined;
        }
      }

      if (currentActive && currentActive !== activeOutlineId) {
        setActiveOutlineId(currentActive);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [messages, showOutlineSidebar, activeOutlineId]);

  // Auto-scroll logic when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, showThinking]);

  // Check configuration on mount
  useEffect(() => {
    const config = getStoredPlaygroundConfig();
    const hasConfig = 
      config.provider === 'zaby'
        ? (config.authMode === 'token'
            ? !!config.runtimeToken.trim()
            : !!config.apiKey.trim() && !!config.externalAppId.trim() && !!config.deploymentId.trim())
        : !!config.openaiApiKey.trim();

    if (!hasConfig) {
      setIsSettingsOpen(true);
    }
  }, []);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    const nextSessions = sessions.filter(s => s.id !== id);
    setSessions(nextSessions);
    if (activeSessionId === id && nextSessions.length > 0) {
      setActiveSessionId(nextSessions[0].id);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleCreateNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat Session',
      group: 'Today',
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          role: 'assistant',
          senderName: 'Assistant',
          content: 'New session started! Ask me anything — I can generate tables, charts, code, diagrams, and more.'
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
  };

  // Group sessions by group ('Today', 'Yesterday')
  const groupedSessions = sessions.reduce<Record<string, ChatSession[]>>((acc, s) => {
    if (!acc[s.group]) {
      acc[s.group] = [];
    }
    acc[s.group].push(s);
    return acc;
  }, {});

  // ---------------------------------------------------------------------------
  // Real Zaby & OpenAI streaming
  // ---------------------------------------------------------------------------
  const performStream = useCallback(async (sessionId: string, sessionMessages: UIMessageType[]) => {
    const config = getStoredPlaygroundConfig();
    const hasConfig = 
      config.provider === 'zaby'
        ? (config.authMode === 'token'
            ? !!config.runtimeToken.trim()
            : !!config.apiKey.trim() && !!config.externalAppId.trim() && !!config.deploymentId.trim())
        : !!config.openaiApiKey.trim();

    if (!hasConfig) {
      setIsSettingsOpen(true);
      setIsStreaming(false);
      return;
    }

    // Create abort controller for this stream
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Resolve prompt text
    let userPrompt = sessionMessages[sessionMessages.length - 1]?.content || '';

    // Search context injection if enabled
    if (isSearchEnabled) {
      setShowThinking(true);
      setThinkingStatus('Searching the web via Firecrawl...');
      try {
        const fcConfig = getStoredFirecrawlConfig();
        const searchContext = await searchWeb(userPrompt, fcConfig);
        userPrompt = searchContext + userPrompt;
      } catch (err) {
        console.warn('Search context retrieval failed, using fallback prompt', err);
      }
    }

    setThinkingStatus('Thinking...');
    setShowThinking(true);

    // Create the assistant message placeholder
    const assistantMsgId = `assistant-${Date.now()}`;
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [
              ...s.messages,
              {
                id: assistantMsgId,
                role: 'assistant',
                senderName: 'Assistant',
                content: '',
              }
            ]
          };
        }
        return s;
      })
    );

    setShowThinking(false);
    setStreamError(null);

    try {
      let accumulated = '';

      if (config.provider === 'zaby') {
        const generator = streamZabyRun(userPrompt, config, sessionId, controller.signal);
        for await (const event of generator) {
          const eventName = event.event ?? (event.data as any)?.type ?? '';
          if (eventName === 'TEXT_MESSAGE_CONTENT') {
            const delta = (event.data as any)?.delta ?? (event.data as any)?.content ?? (event.data as any)?.text ?? '';
            accumulated += delta;

            // Update the assistant message content with accumulated text
            setSessions(prev =>
              prev.map(s => {
                if (s.id === sessionId) {
                  return {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === assistantMsgId ? { ...m, content: accumulated } : m
                    )
                  };
                }
                return s;
              })
            );
          } else if (eventName === 'RUN_ERROR') {
            const errorMsg = (event.data as any)?.error?.message ?? (event.data as any)?.message ?? 'The run failed.';
            throw new Error(errorMsg);
          }
        }
      } else {
        // OpenAI streaming with search context prepended
        const openaiMessages: OpenAIChatMessage[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...sessionMessages
            .slice(0, -1)
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          { role: 'user', content: userPrompt }
        ];

        const openAIConfig = {
          apiKey: config.openaiApiKey,
          model: config.openaiModel,
          temperature: config.openaiTemperature,
        };

        for await (const chunk of streamChat(openaiMessages, openAIConfig, controller.signal)) {
          accumulated += chunk;

          // Update the assistant message content with accumulated text
          setSessions(prev =>
            prev.map(s => {
              if (s.id === sessionId) {
                return {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === assistantMsgId ? { ...m, content: accumulated } : m
                  )
                };
              }
              return s;
            })
          );
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled
      } else {
        const errorMsg = (err as Error).message || 'An unknown error occurred';
        setStreamError(errorMsg);

        // Add error as a system message
        setSessions(prev =>
          prev.map(s => {
            if (s.id === sessionId) {
              return {
                ...s,
                messages: [
                  ...s.messages.filter(m => m.id !== assistantMsgId || m.content.trim() !== ''),
                  {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    senderName: 'System',
                    content: `⚠️ **Error**: ${errorMsg}\n\nPlease check your settings and try again.`
                  }
                ]
              };
            }
            return s;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [isSearchEnabled]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (isStreaming) return;

    const userMessage: UIMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText
    };

    const updatedMessages = [...messages, userMessage];

    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, userMessage]
          };
        }
        return s;
      })
    );

    setInputText('');
    setAttachments([]);
    setIsStreaming(true);
    setShowThinking(true);
    setStreamError(null);

    // Start streaming
    performStream(activeSessionId, updatedMessages);
  }, [inputText, attachments, isStreaming, messages, activeSessionId, performStream]);

  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setShowThinking(false);
  }, []);

  const handleRecordingComplete = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const config = getStoredPlaygroundConfig();
      if (!config.openaiApiKey.trim()) {
        throw new Error('OpenAI API Key is missing. Please configure it in Settings to enable Whisper STT.');
      }
      const text = await transcribeAudio(blob, config.openaiApiKey);
      setInputText(prev => (prev ? prev + ' ' : '') + text);
    } catch (err) {
      console.error('STT error:', err);
      const errorMsg = (err as Error).message || 'Voice transcription failed.';
      alert(errorMsg);
    } finally {
      setIsTranscribing(false);
    }
  };

  const runMockLogsAnimation = () => {
    setShowcaseLogsList([]);
    setIsShowcaseReasoning(true);
    setShowcaseToolActive(false);
    setShowcaseToolOutput(false);

    // Step 1
    setTimeout(() => {
      setShowcaseLogsList(prev => [...prev, '1. [06:45:12] invoke_subagent: scanning Cwd targets...']);
    }, 800);

    // Step 2
    setTimeout(() => {
      setShowcaseLogsList(prev => [...prev, '2. [06:45:14] read_file: read package.json dependencies list.']);
      setShowcaseToolActive(true);
    }, 1600);

    // Step 3
    setTimeout(() => {
      setShowcaseLogsList(prev => [...prev, '3. [06:45:15] run_command: compile check of aiui-core.']);
      setShowcaseToolOutput(true);
    }, 2400);

    // Step 4
    setTimeout(() => {
      setShowcaseLogsList(prev => [...prev, '4. [06:45:16] resolve: branch workspace is fully synced.']);
      setIsShowcaseReasoning(false);
    }, 3200);
  };

  const handleTranscriptionStart = () => {
    setIsTranscribing(true);
  };

  const handleFileSelect = (files: FileList | File[]) => {
    const list = Array.isArray(files) ? files : Array.from(files);
    setAttachments(prev => [...prev, ...list]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMessageEdit = (id: string, newContent: string) => {
    if (isStreaming) return;

    // Find the index of the edited user message
    const msgIndex = messages.findIndex(m => m.id === id);
    if (msgIndex === -1) return;

    // Keep all messages prior to the edited message, plus the edited message with its updated content
    const updatedUserMsg = { ...messages[msgIndex], content: newContent };
    const truncatedMessages = [...messages.slice(0, msgIndex), updatedUserMsg];

    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: truncatedMessages
          };
        }
        return s;
      })
    );

    setIsStreaming(true);
    setShowThinking(true);
    setStreamError(null);

    // Resubmit the conversation thread from that point
    performStream(activeSessionId, truncatedMessages);
  };

  const handleRegenerate = (_id: string) => {
    if (isStreaming) return;
    const trimmedMessages = messages.filter(m => m.id !== _id);
    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: trimmedMessages };
        }
        return s;
      })
    );
    setIsStreaming(true);
    setShowThinking(true);
    performStream(activeSessionId, trimmedMessages);
  };

  const handleFeedback = (id: string, value: 'like' | 'dislike') => {
    console.log(`Feedback for message ${id}: ${value}`);
  };

  const clearChat = () => {
    setSessions(prev =>
      prev.map(s => (s.id === activeSessionId ? { ...s, messages: [] } : s))
    );
  };

  const handleConfigChange = (config: PlaygroundConfig) => {
    setPlaygroundConfig(config);
  };

  // ---------------------------------------------------------------------------
  // Render helper: parse assistant messages for artifacts
  // ---------------------------------------------------------------------------
  const renderMessageContent = useCallback((msg: UIMessageType, _isLastAndStreaming: boolean) => {
    if (msg.role === 'assistant' && msg.content && !_isLastAndStreaming) {
      const blocks: ContentBlock[] = parseArtifacts(msg.content);
      return <ArtifactRenderer blocks={blocks} />;
    }
    return undefined;
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased select-none">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigChange={handleConfigChange}
      />

      {/* Sessions Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      >
        <div className="flex flex-col gap-4 p-4">
          <button
            onClick={handleCreateNewSession}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
          >
            <Plus size={14} /> New Chat
          </button>

          {Object.entries(groupedSessions).map(([group, list]) => (
            <SessionGroup key={group} title={group}>
              {list.map(session => (
                <SessionItem
                  key={session.id}
                  id={session.id}
                  title={session.title}
                  isActive={session.id === activeSessionId}
                  onSelect={handleSelectSession}
                  onDelete={handleDeleteSession}
                  onRename={handleRenameSession}
                />
              ))}
            </SessionGroup>
          ))}
        </div>
      </Sidebar>

      {/* Main chat window */}
      <div className="flex-grow flex flex-col min-w-0 bg-background relative h-full">
        {/* Header toolbar */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/20 select-none">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer mr-1"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
            <Sparkles className="text-primary w-4 h-4" />
            <h1 className="text-sm font-bold text-foreground">AIUI Sandbox Playground</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'chat' ? 'showcase' : 'chat')}
              className="px-3 py-1.5 rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground text-[10px] font-bold transition-colors cursor-pointer shadow-sm select-none"
            >
              {activeTab === 'showcase' ? 'Back to Chat' : 'Component Showcase'}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-border/30 cursor-pointer"
              title="Playground Settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={clearChat}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-border/30 cursor-pointer"
              title="Clear Chat History"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </header>

        {/* Content Tabs */}
        {activeTab === 'showcase' ? (
          /* Interactive Showcase Dashboard */
          <div className="flex-1 overflow-y-auto p-6 bg-muted/5 select-text">
            <div className="max-w-4xl mx-auto flex flex-col gap-6 text-left">
              <div>
                <h2 className="text-base font-bold text-foreground">Interactive Component Showcase</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Explore high-fidelity mock renderings of the 38 newly designed React UI primitive components.</p>
              </div>

              {/* Grid 1: KPI metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricsCard
                  title="Total Revenue Monthly"
                  value="$45,231.89"
                  change={12.5}
                  changeType="up"
                  icon="💵"
                  trend={[30, 45, 35, 50, 48, 65, 75]}
                />
                <MetricsCard
                  title="Completed Signups"
                  value="1,205"
                  change={8.3}
                  changeType="down"
                  icon="👤"
                  trend={[80, 75, 90, 85, 70, 68, 60]}
                />
                <MetricsCard
                  title="Active Server Load"
                  value="24.8%"
                  change={0.2}
                  changeType="neutral"
                  icon="⚡"
                  trend={[20, 22, 25, 23, 26, 24, 25]}
                />
              </div>

              {/* Grid 2: Table, Calendar, Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Chart
                  chartType="line"
                  title="Weekly Conversion Funnel Trends"
                  series={[
                    { name: 'Direct Traffic', data: [12, 19, 3, 5, 2, 3, 10], color: '#3b82f6' },
                    { name: 'Organic Search', data: [2, 3, 20, 5, 1, 4, 15], color: '#10b981' }
                  ]}
                  axes={{
                    xAxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
                  }}
                />

                <Calendar
                  events={[
                    { id: '1', title: 'Sprint Review', start: '2026-07-13', end: '2026-07-13', color: '#3b82f6' },
                    { id: '2', title: 'Deploy v2', start: '2026-07-15', end: '2026-07-15', color: '#10b981' }
                  ]}
                />
              </div>

              {/* Grid 3: Spreadsheet & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Spreadsheet
                  sheets={[
                    {
                      name: 'Sheet 1',
                      cells: {
                        'A1': { value: 'Product Name' },
                        'B1': { value: 'Price Units' },
                        'A2': { value: 'SaaS Plan A' },
                        'B2': { value: 120 },
                        'A3': { value: 'SaaS Plan B' },
                        'B3': { value: 240 }
                      }
                    }
                  ]}
                />

                <Timeline
                  items={[
                    { title: 'Project Initialized', description: 'Setup monorepo and bundler configs.', date: 'July 10', status: 'completed' },
                    { title: 'Define Zod Schemas', description: 'Formalize API endpoints and capabilities structures.', date: 'July 11', status: 'completed' },
                    { title: 'Mount React Primitives', description: 'Create Table, Charts, and form grids elements.', date: 'July 13', status: 'active' },
                    { title: 'Beta Testing Rollout', description: 'Review telemetry and release packages.', date: 'July 15', status: 'pending' }
                  ]}
                />
              </div>

              {/* Grid 4: Form & Diagram Elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form
                  actionId="submit-signup-form"
                  submitLabel="Create Developer Account"
                  fields={[
                    { name: 'username', type: 'text', label: 'Developer Username', required: true, placeholder: 'e.g. octocat' },
                    {
                      name: 'role',
                      type: 'select',
                      label: 'Account Role',
                      placeholder: 'Choose role...',
                      options: [
                        { label: 'Frontend Engineer', value: 'frontend' },
                        { label: 'Systems Architect', value: 'systems' }
                      ]
                    },
                    { name: 'subscribe', type: 'checkbox', label: 'Receive updates', placeholder: 'Subscribe to newsletters' }
                  ]}
                />

                <FlowDiagram
                  nodes={[
                    { id: 'start', label: 'Init', type: 'circle' },
                    { id: 'proc', label: 'Build', type: 'rectangle' },
                    { id: 'end', label: 'Deploy', type: 'rounded' }
                  ]}
                  edges={[
                    { source: 'start', target: 'proc', label: 'transpile' },
                    { source: 'proc', target: 'end', label: 'compress', animated: true }
                  ]}
                />
              </div>

              {/* Grid 5: Accordion & Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 scroll-mt-6" id="rag-basics">
                <Tabs
                  items={[
                    { id: 't1', label: 'Overview API', content: 'The capabilities schema provides unified types representing various layout components.' },
                    { id: 't2', label: 'Quick Start', content: 'Import components directly from @zaby-ai/aiui-react and pass -inputs as props.' }
                  ]}
                />
                <Accordion
                  items={[
                    { id: 'a1', title: 'Why use Zod validation?', content: 'Zod ensures all dynamic blocks received from backend LLM models conform to exact structures.' },
                    { id: 'a2', title: 'Is server rendering supported?', content: 'Yes, all schemas are server-safe and compile target is es2020 modules.' }
                  ]}
                />
              </div>

              {/* Grid 6: JSONViewer */}
              <div id="vector-dbs" className="scroll-mt-6">
                <JSONViewer
                  data={{
                    monorepo: {
                      packages: ['aiui-core', 'aiui-react', 'aiui-server'],
                      version: '0.0.26',
                      dependencies: {
                        zod: '^4.1.12',
                        typescript: '^5.0.0'
                      }
                    }
                  }}
                  expandDepth={2}
                />
              </div>

              {/* Grid 6b: Interactive Linked Input Chart */}
              <div id="pinecone-weaviate" className="scroll-mt-6">
                <LinkedInputChart
                  title="Real-Time Interactive Pricing Calculator"
                  parameters={[
                    { id: 'conversionRate', label: 'Conversion Rate (%)', min: 0.1, max: 10, step: 0.1, defaultValue: 2.5 },
                    { id: 'monthlyTraffic', label: 'Monthly Traffic (visitors)', min: 1000, max: 100000, step: 1000, defaultValue: 20000 },
                    { id: 'averageOrderValue', label: 'Average Order Value ($)', min: 5, max: 200, step: 5, defaultValue: 45 }
                  ]}
                  formulaLabel="Estimated Monthly Revenue ($)"
                  formula="conversionRate / 100 * monthlyTraffic * averageOrderValue"
                  xAxisParamIndex={1}
                />
              </div>

              {/* Grid 6c: Interactive Conversation Outline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-6" id="rag-architecture">
                <ConversationOutline
                  title="Dynamic Chat Outline Index"
                  items={[
                    { id: 'rag-basics', label: 'RAG Basics & Definitions', timestamp: '10:02 AM', icon: '📖' },
                    { id: 'vector-dbs', label: 'Understanding Vector Databases', timestamp: '10:05 AM', level: 2, icon: '🗄️' },
                    { id: 'pinecone-weaviate', label: 'Comparison: Pinecone vs Weaviate', timestamp: '10:12 AM', level: 2, icon: '⚖️' },
                    { id: 'rag-architecture', label: 'Standard RAG System Architecture', timestamp: '10:20 AM', icon: '🏗️' },
                    { id: 'embeddings', label: 'How Semantic Embeddings Work', timestamp: '10:30 AM', level: 2, icon: '🧬' }
                  ]}
                  defaultActiveId="pinecone-weaviate"
                  onSelect={(id: any) => {
                    console.log('Selected outline topic ID:', id);
                  }}
                />

                <div className="flex flex-col justify-between p-5 bg-card/45 border rounded-xl leading-relaxed text-left text-xs gap-3">
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Interactive Topic Indexing</h4>
                    <p className="text-muted-foreground leading-normal">
                      The Conversation Outline maps long conversations automatically into a structured, clickable table of contents.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">Interactive search filter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">Smooth Framer Motion slide tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">Smooth scrolling to message target element IDs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 7: Status Indicators */}
              <div className="flex flex-col gap-4 p-4 rounded-lg border bg-card scroll-mt-6" id="embeddings">
                <h4 className="text-xs font-bold text-foreground leading-none">Feedback Indicators</h4>
                <Alert
                  title="System maintenance scheduled"
                  description="We will be updating servers tonight between 12:00 AM and 2:00 AM UTC."
                  variant="warning"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Badge label="Production" variant="success" />
                  <Badge label="Beta v2" variant="info" />
                  <Badge label="Outage" variant="destructive" />
                  <Divider orientation="vertical" />
                  <div className="max-w-[200px] w-full">
                    <Progress value={78} showValue label="System Rollout Status" />
                  </div>
                  <Divider orientation="vertical" />
                  <Loading size="sm" variant="dots" label="Streaming..." />
                </div>
              </div>

              {/* Grid 7.5: Siri-like Voice Visualizer */}
              <div className="flex flex-col gap-6 p-6 rounded-lg border bg-card scroll-mt-6" id="voice-visualizer-demo">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Siri-like Voice Visualizer</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Fluid Canvas animations driven by actual microphone streams or intelligent simulated voice frequencies.</p>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <div className="flex bg-muted rounded p-0.5 gap-1">
                      <button
                        type="button"
                        onClick={() => setVisType('orb')}
                        className={`px-2.5 py-1 font-bold rounded cursor-pointer transition-colors ${
                          visType === 'orb' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Siri Blob
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisType('wave')}
                        className={`px-2.5 py-1 font-bold rounded cursor-pointer transition-colors ${
                          visType === 'wave' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Classic Wave
                      </button>
                    </div>

                    <div className="flex bg-muted rounded p-0.5 gap-1">
                      <button
                        type="button"
                        onClick={() => setVisUseMic(false)}
                        className={`px-2.5 py-1 font-bold rounded cursor-pointer transition-colors ${
                          !visUseMic ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Simulated
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisUseMic(true)}
                        className={`px-2.5 py-1 font-bold rounded cursor-pointer transition-colors ${
                          visUseMic ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        🎙️ Live Mic
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-center">
                  {/* Left: Animation viewport */}
                  <div className="flex items-center justify-center p-6 rounded-xl bg-muted/10 border border-border/50 min-h-[220px] relative overflow-hidden">
                    <VoiceVisualizer
                      type={visType}
                      state={visState}
                      useMicrophone={visUseMic}
                      size={visType === 'orb' ? 180 : 340}
                      primaryColor={visColors.primary}
                      secondaryColor={visColors.secondary}
                    />
                  </div>

                  {/* Right: State controls & theme selector */}
                  <div className="space-y-4 text-left">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">Voice Engine State</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['idle', 'listening', 'thinking', 'speaking'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setVisState(s)}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer capitalize ${
                              visState === s
                                ? 'bg-primary/10 border-primary/45 text-primary shadow-sm'
                                : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">Color Palette Themes</span>
                      <div className="flex gap-2">
                        {(['cyan', 'violet', 'green', 'amber'] as const).map((theme) => {
                          const themeColors = {
                            cyan: 'from-[#06b6d4] to-[#8b5cf6]',
                            violet: 'from-[#8b5cf6] to-[#ec4899]',
                            green: 'from-[#10b981] to-[#3b82f6]',
                            amber: 'from-[#f59e0b] to-[#ef4444]',
                          };
                          return (
                            <button
                              key={theme}
                              type="button"
                              onClick={() => setVisColorTheme(theme)}
                              className={`h-6 w-12 rounded-md bg-gradient-to-r ${themeColors[theme]} border transition-all cursor-pointer ${
                                visColorTheme === theme
                                  ? 'ring-2 ring-ring scale-105 border-foreground'
                                  : 'border-border/65 opacity-80 hover:opacity-100'
                              }`}
                              title={`${theme} theme`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {visUseMic && (
                      <div className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded p-2.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Microphone capture enabled. Speak now to react the visualizer!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 8: Zaby GPA Agent Telemetry & Logs */}
              <div className="flex flex-col gap-6 p-6 rounded-lg border bg-card/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Zaby GPA Agent Telemetry & Logs</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Explore the collapsible reasoning chain, tool trace logs, and Human-in-the-Loop dialog states.</p>
                  </div>
                  
                  {/* Interactive Trigger Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={runMockLogsAnimation}
                      className="px-2.5 py-1.5 rounded bg-primary text-primary-foreground text-[9px] font-bold hover:bg-primary/95 cursor-pointer shadow-sm transition-colors"
                    >
                      ⚡ Run Logs Stream
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowcaseInterrupt(true)}
                      className="px-2.5 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold cursor-pointer shadow-sm transition-colors"
                    >
                      ⚠️ Interruption Modal
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowcaseApproval(true)}
                      className="px-2.5 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold cursor-pointer shadow-sm transition-colors"
                    >
                      🔑 Approval Modal
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowcaseReview(true)}
                      className="px-2.5 py-1.5 rounded bg-purple-500 hover:bg-purple-600 text-white text-[9px] font-bold cursor-pointer shadow-sm transition-colors"
                    >
                      📝 Review Modal
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Reasoning & Tooling & Artifact Gallery */}
                  <div className="space-y-4">
                    {/* Collapsible Reasoning Block representation */}
                    <div className="rounded-xl border border-border bg-muted/10 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/20 text-xs font-semibold text-muted-foreground select-none">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isShowcaseReasoning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="text-foreground">Reasoning Chain</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-500">
                          {isShowcaseReasoning ? 'Agent is reasoning...' : 'Reasoning Ended'}
                        </span>
                      </div>
                      <div className="p-4 bg-background/50 space-y-2 text-xs leading-relaxed">
                        <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px] mb-1">Reasoning Summary</div>
                        <p className="text-foreground font-medium mb-3">
                          {isShowcaseReasoning 
                            ? 'Processing file scanner and compilation configs...' 
                            : 'Scanning workspace complete. All directories matched clean.'}
                        </p>
                        <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px] mb-1">Thought Chain Steps</div>
                        <pre className="font-mono bg-muted/30 p-3 rounded-md overflow-x-auto text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap min-h-[90px]">
                          {showcaseLogsList.length > 0 
                            ? showcaseLogsList.join('\n') 
                            : 'No active telemetry logs. Click "Run Logs Stream" to animate.'}
                        </pre>
                      </div>
                    </div>

                    {/* Tool Call & Result Progress indicator representation */}
                    <div className="rounded-xl border border-border bg-muted/10 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/20 text-xs font-semibold text-muted-foreground select-none">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${showcaseToolActive ? 'bg-primary animate-ping' : 'bg-emerald-500'}`} />
                          <span className="font-mono text-foreground">tool: read_file</span>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold">
                          {showcaseToolActive ? 'Executing...' : 'Execution Output'}
                        </span>
                      </div>
                      <div className="p-4 bg-background/50 space-y-3">
                        <div>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Arguments</span>
                          <pre className="text-[11px] rounded-md bg-muted/30 p-2.5 overflow-x-auto font-mono text-foreground">
                            {JSON.stringify({ path: 'package.json' }, null, 2)}
                          </pre>
                        </div>
                        {showcaseToolOutput && (
                          <div>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Response Output</span>
                            <pre className="text-[10px] rounded-md bg-muted/30 p-2.5 overflow-x-auto font-mono text-muted-foreground leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                              {JSON.stringify({ name: 'aiui-test', version: '1.0.0', dependencies: { react: '^18.0.0' } }, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Artifact Gallery representing Code/Preview toggle */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
                        <span className="text-xs font-bold text-foreground">Artifact: landing_page.html</span>
                        <div className="flex bg-muted rounded p-0.5 gap-1">
                          <button
                            type="button"
                            onClick={() => setArtifactGalleryTab('preview')}
                            className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer transition-colors ${
                              artifactGalleryTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setArtifactGalleryTab('code')}
                            className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer transition-colors ${
                              artifactGalleryTab === 'code' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Code
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-background min-h-[140px] flex flex-col justify-center">
                        {artifactGalleryTab === 'preview' ? (
                          <div className="border border-border/60 rounded p-4 text-center bg-muted/5 flex flex-col items-center justify-center space-y-2">
                            <span className="text-xl">🚀</span>
                            <span className="text-xs font-bold text-foreground">App Landing Page Preview</span>
                            <span className="text-[10px] text-muted-foreground max-w-xs leading-normal">
                              Interactive sandbox environment running responsive layout simulation.
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            <pre className="text-[10px] font-mono p-3 rounded bg-muted/30 overflow-x-auto text-muted-foreground whitespace-pre-wrap">
{"<!DOCTYPE html>\n<html>\n<head>\n  <title>Landing Page</title>\n</head>\n<body>\n  <h1>Welcome to Zaby OS</h1>\n</body>\n</html>"}
                            </pre>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('<!DOCTYPE html>\n<html>\n<head>\n  <title>Landing Page</title>\n</head>\n<body>\n  <h1>Welcome to Zaby OS</h1>\n</body>\n</html>');
                                alert('Code copied to clipboard!');
                              }}
                              className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/10 text-[9px] font-bold text-foreground border border-border/80 cursor-pointer transition-colors"
                            >
                              Copy Code
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Human-in-the-Loop Mock Dialogs */}
                  <div className="space-y-4">
                    {/* Interruption Modal Mock representation */}
                    <div className="border border-amber-500/20 rounded-xl bg-amber-500/5 p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Action Blocked (HITL Interruption)</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">The agent is waiting for user response input to resume.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-400">Blocked</span>
                      </div>
                      
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-500 font-medium">
                        Enter target environment label (e.g. production, staging):
                      </div>

                      <div className="flex gap-2">
                        <input
                          id="mock-interrupt-input-inline"
                          type="text"
                          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                          placeholder="e.g. production"
                          defaultValue="production"
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={() => alert('Submit clicked!')}
                          className="rounded-md bg-amber-600 text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
                        >
                          Submit
                        </button>
                      </div>
                    </div>

                    {/* Approval Dialog Mock representation */}
                    <div className="border border-border rounded-xl bg-muted/10 p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Approval Required</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Approve execution of sensitive terminal commands.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-primary/20 text-primary">Pending Approval</span>
                      </div>

                      <div className="rounded-lg bg-background border border-border/80 p-3 space-y-2 text-[11px]">
                        <div className="font-semibold text-foreground">execute_command</div>
                        <div className="text-[10px] text-muted-foreground leading-normal">Command is going to download and install third-party dependencies from npm registry.</div>
                        <div className="grid grid-cols-[80px_1fr] gap-1 pt-1 text-[10px] border-t border-border/40 font-mono mt-1">
                          <span className="text-muted-foreground">cmd:</span>
                          <span className="text-foreground truncate">npm install framer-motion</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => alert('Rejected')}
                          className="rounded-md border border-border px-3 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('Approved')}
                          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Approve Action
                        </button>
                      </div>
                    </div>

                    {/* Review Dialog Mock representation */}
                    <div className="border border-border rounded-xl bg-muted/10 p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Task Review Required</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Please review the build code structure output.</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-400">Review</span>
                      </div>

                      <div className="rounded-lg bg-background border border-border/80 p-3 text-[10px] font-mono overflow-x-auto max-h-24 leading-relaxed">
                        <pre>{"{\n  \"status\": \"success\",\n  \"filesCompiled\": 4694,\n  \"bundleSize\": \"731kB\"\n}"}</pre>
                      </div>

                      <textarea
                        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary min-h-[50px] resize-none"
                        placeholder="Leave review comments/feedback (optional)..."
                        readOnly
                      />

                      <div className="flex justify-end gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => alert('Requires Edits')}
                          className="rounded-md border border-red-500/20 text-red-500 bg-red-500/5 px-3 py-1.5 font-semibold hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          Requires Edits
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('Approved')}
                          className="rounded-md bg-emerald-600 text-white px-3 py-1.5 font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Mark Approved
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- FULL OVERLAY MODALS FOR ACTIVE TESTING ACTIONS --- */}
                
                {/* 1. Interruption Modal Overlay */}
                {showcaseInterrupt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-left">
                    <div className="w-full max-w-md border border-border rounded-xl bg-card p-6 shadow-lg space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Action Blocked</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          The agent has encountered an interruption and requires your input to proceed.
                        </p>
                      </div>
                      
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
                        Enter target environment label (e.g. production, staging):
                      </div>

                      <div className="space-y-4">
                        <input
                          id="mock-interrupt-input-overlay"
                          type="text"
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                          placeholder="Type response (e.g. production)..."
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowcaseInterrupt(false)}
                            className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const val = (document.getElementById('mock-interrupt-input-overlay') as HTMLInputElement)?.value;
                              alert(`Resolving interruption with: "${val || 'production'}"`);
                              setShowcaseInterrupt(false);
                            }}
                            className="rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
                          >
                            Submit Response
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Approval Dialog Overlay */}
                {showcaseApproval && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-left">
                    <div className="w-full max-w-md border border-border rounded-xl bg-card p-6 shadow-lg space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Approval Required</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Confirm execution of the following action before the agent proceeds.
                        </p>
                      </div>

                      <div className="rounded-lg bg-card border border-border p-4 space-y-2">
                        <div className="font-semibold text-sm text-foreground">execute_command</div>
                        <div className="text-xs text-muted-foreground">Command is going to install third-party dependencies from npm registry.</div>
                        
                        <dl className="grid grid-cols-1 gap-1 border-t border-border/50 pt-2 mt-2">
                          <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                            <dt className="text-muted-foreground font-medium">Command:</dt>
                            <dd className="text-foreground font-mono truncate">npm install framer-motion</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="flex justify-end gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            alert('Action Rejected');
                            setShowcaseApproval(false);
                          }}
                          className="rounded-md border border-border px-4 py-2 font-semibold hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert('Action Approved');
                            setShowcaseApproval(false);
                          }}
                          className="rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Approve Action
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Review Dialog Overlay */}
                {showcaseReview && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-left">
                    <div className="w-full max-w-md border border-border rounded-xl bg-card p-6 shadow-lg space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Task Review Required</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Please review the task outcome and submit feedback.
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/20 border border-border p-3 text-xs font-mono overflow-x-auto max-h-40">
                        <pre>{JSON.stringify({ status: "success", filesCompiled: 4694, bundleSize: "731kB" }, null, 2)}</pre>
                      </div>

                      <textarea
                        id="mock-review-feedback"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                        placeholder="Leave review comments/feedback (optional)..."
                      />

                      <div className="flex justify-end gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            const val = (document.getElementById('mock-review-feedback') as HTMLInputElement)?.value;
                            alert(`Submitted: Requires Edits (Feedback: "${val || ''}")`);
                            setShowcaseReview(false);
                          }}
                          className="rounded-md border border-red-200 text-red-700 bg-red-50 px-4 py-2 font-semibold hover:bg-red-100 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 transition-colors cursor-pointer"
                        >
                          Requires Edits
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const val = (document.getElementById('mock-review-feedback') as HTMLInputElement)?.value;
                            alert(`Submitted: Approved (Feedback: "${val || ''}")`);
                            setShowcaseReview(false);
                          }}
                          className="rounded-md bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Mark Approved
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Normal Chat Area View */
          <>
            <FileSelector onFilesSelected={handleFileSelect} className="flex-1 flex flex-col min-h-0">
              <div className="flex-grow flex flex-row min-h-0 relative w-full">
                {/* Scrollable messages container */}
                <div
                  ref={scrollContainerRef}
                  className="flex-grow overflow-y-auto px-6 py-4 flex flex-col-reverse min-h-0"
                >
                  <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-4" ref={chatContainerRef}>
                    {messages.map((msg, index) => {
                      const isLastAssistant = msg.role === 'assistant' && index === messages.length - 1 && isStreaming;
                      const artifactContent = renderMessageContent(msg, isLastAssistant);

                      return (
                        <div key={msg.id} id={msg.id} data-message-id={msg.id} className="relative scroll-mt-6">
                          {/* Top Horizontal line */}
                          {index === messages.length - 1 && !isStreaming && (
                            <div className="border-t border-border/10 my-4" />
                          )}

                          <MessageBubble
                            message={msg}
                            onEditSubmit={msg.role === 'user' ? handleMessageEdit : undefined}
                            onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined}
                            onFeedback={msg.role === 'assistant' ? handleFeedback : undefined}
                            isStreaming={isLastAssistant}
                          >
                            {artifactContent}
                          </MessageBubble>

                          {/* Bottom Horizontal line */}
                          {index === messages.length - 1 && !isStreaming && (
                            <div className="border-t border-border/10 my-4" />
                          )}
                        </div>
                      );
                    })}

                    {showThinking && isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                      <div className="flex items-center gap-3 pl-2">
                        <ThinkingIndicatorPrimitive variant="dots" statusText={thinkingStatus} />
                      </div>
                    )}

                    {streamError && (
                      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <span>⚠️</span>
                        <span>{streamError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Right Side Wall Conversation Outline Sidebar */}
                {showOutlineSidebar && (
                  <aside 
                    onMouseEnter={() => setIsOutlineHovered(true)}
                    onMouseLeave={() => setIsOutlineHovered(false)}
                    className={cn(
                      "border-l border-border/80 bg-card/25 overflow-y-auto shrink-0 hidden lg:block sticky top-0 h-full scrollbar-none transition-all duration-300 ease-in-out",
                      isOutlineHovered ? "w-80 p-4" : "w-14 p-2 py-6"
                    )}
                  >
                    <ConversationOutline
                      title="Conversation Outline"
                      items={outlineItems}
                      activeId={activeOutlineId}
                      isHovered={isOutlineHovered}
                      onSelect={(id: any) => {
                        setActiveOutlineId(id);
                      }}
                    />
                  </aside>
                )}
              </div>
            </FileSelector>

            {/* Input panel */}
            <footer className="px-6 py-4 border-t border-border/50 bg-card/10 backdrop-blur-md shrink-0">
              <div className="max-w-3xl mx-auto flex flex-col gap-2">
                {/* File attachment preview grid */}
                <FilePreview files={attachments} onRemove={handleRemoveFile} />

                {/* Prompt compose box styled as unified card input */}
                <div className="flex flex-col border border-border bg-muted/15 focus-within:ring-1 focus-within:ring-ring rounded-xl transition-all p-1.5 gap-1.5 relative">
                  <Textarea
                    value={inputText}
                    onChange={(e: any) => setInputText(e.target.value)}
                    onEnterPress={handleSend}
                    placeholder={
                      isStreaming 
                        ? "Response streaming... Click stop to abort." 
                        : isTranscribing 
                          ? "Transcribing voice query..." 
                          : "Ask anything... (Enter to submit, Shift+Enter for new line)"
                    }
                    disabled={isStreaming}
                    className="text-base text-foreground bg-transparent min-h-[50px] p-2 resize-none"
                    maxHeight={120}
                  />

                  {/* Bottom toolbar */}
                  <div className="flex items-center justify-between px-1.5 pb-0.5 pt-1 border-t border-border/10">
                    <div className="flex items-center gap-1.5">
                      <AttachmentMenu onFilesSelected={handleFileSelect} />
                      
                      {/* Web Search Toggle (Globe icon) */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextSearch = !isSearchEnabled;
                          setIsSearchEnabled(nextSearch);
                          saveFirecrawlConfig({ isSearchEnabled: nextSearch });
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isSearchEnabled
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-transparent border-border/40 text-muted-foreground hover:text-foreground'
                        }`}
                        title={isSearchEnabled ? "Web Search: ON" : "Web Search: OFF"}
                      >
                        <Globe size={13} />
                      </button>

                      {/* Clickable Model Selector */}
                      <div className="relative" ref={modelDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border/40 hover:border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground select-none cursor-pointer transition-colors"
                        >
                          <Cpu size={12} className="text-primary shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {playgroundConfig.provider === 'zaby'
                              ? (playgroundConfig.authMode === 'token' 
                                  ? 'Zaby Token' 
                                  : `Zaby: ${playgroundConfig.deploymentId || 'No Deployment'}`)
                              : `OpenAI: ${playgroundConfig.openaiModel}`}
                          </span>
                        </button>

                        <AnimatePresence>
                          {isModelDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              transition={{ duration: 0.1 }}
                              className="absolute bottom-full left-0 mb-1 w-56 rounded-lg border border-border bg-card p-1 shadow-md z-30 flex flex-col text-left"
                            >
                              <div className="px-2 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 leading-none mb-1 select-none">
                                OpenAI Models
                              </div>
                              {AVAILABLE_MODELS.map((model) => (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...playgroundConfig,
                                      provider: 'openai' as const,
                                      openaiModel: model.id,
                                    };
                                    setPlaygroundConfig(updated);
                                    savePlaygroundConfig(updated);
                                    setIsModelDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 text-[10px] rounded hover:bg-muted transition-colors cursor-pointer text-left ${
                                    playgroundConfig.provider === 'openai' && playgroundConfig.openaiModel === model.id
                                      ? 'text-primary font-bold bg-muted/40'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <span>{model.label}</span>
                                  {playgroundConfig.provider === 'openai' && playgroundConfig.openaiModel === model.id && (
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                  )}
                                </button>
                              ))}

                              <div className="px-2 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-t border-b border-border/40 leading-none mt-1.5 mb-1 select-none">
                                Zaby OS
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = {
                                    ...playgroundConfig,
                                    provider: 'zaby' as const,
                                  };
                                  setPlaygroundConfig(updated);
                                  savePlaygroundConfig(updated);
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1.5 text-[10px] rounded hover:bg-muted transition-colors cursor-pointer text-left ${
                                  playgroundConfig.provider === 'zaby'
                                    ? 'text-primary font-bold bg-muted/40'
                                    : 'text-muted-foreground hover:text-foreground'
                                  }`}
                              >
                                <span>Zaby Agentic OS runtime</span>
                                {playgroundConfig.provider === 'zaby' && (
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                )}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <VoiceInput
                        onRecordingComplete={handleRecordingComplete}
                        onTranscriptionStart={handleTranscriptionStart}
                        disabled={isStreaming}
                      />
                      <SendButton
                        isStreaming={isStreaming}
                        onClick={isStreaming ? handleStopStreaming : handleSend}
                        disabled={!isStreaming && !inputText.trim() && attachments.length === 0}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-center text-muted-foreground/60 leading-normal">
                  Powered by {playgroundConfig.provider === 'zaby' ? 'Zaby Agentic OS' : 'OpenAI'} • Artifacts rendered with AIUI React Primitives
                </div>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Real-time PDF previewer panel (right-side sliding drawer) */}
      <AnimatePresence>
        {activePdfUrl && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 480, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="h-full border-l border-border bg-card flex flex-col z-20 shrink-0 text-left relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 shrink-0 select-none">
              <span className="text-xs font-bold text-foreground">PDF Document Previewer</span>
              <button
                type="button"
                onClick={() => setActivePdfUrl(null)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border/40"
              >
                <X size={14} />
              </button>
            </div>
            {/* PDF iframe viewport */}
            <div className="flex-1 bg-white relative">
              <iframe
                src={activePdfUrl}
                title="PDF Document Viewport"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
