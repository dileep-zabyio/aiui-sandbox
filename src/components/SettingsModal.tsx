/**
 * SettingsModal — Zaby OS & OpenAI & Firecrawl Web Search configuration.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Key, Cpu, Globe, Terminal } from 'lucide-react';
import { getStoredPlaygroundConfig, savePlaygroundConfig, testZabyConnection, type PlaygroundConfig } from '../services/zaby';
import { testConnection as testOpenAIConnection } from '../services/openai';
import { getStoredFirecrawlConfig, saveFirecrawlConfig, testFirecrawlConnection } from '../services/firecrawl';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange?: (config: PlaygroundConfig) => void;
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

export function SettingsModal({ isOpen, onClose, onConfigChange }: SettingsModalProps) {
  const [provider, setProvider] = useState<'zaby' | 'openai'>('zaby');
  
  // Zaby settings
  const [apiOrigin, setApiOrigin] = useState('https://genapi.zaby.io');
  const [authMode, setAuthMode] = useState<'token' | 'mint'>('token');
  const [runtimeToken, setRuntimeToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [externalAppId, setExternalAppId] = useState('');
  const [deploymentId, setDeploymentId] = useState('');
  const [externalUserId, setExternalUserId] = useState('playground-user');

  // OpenAI settings
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);

  // Firecrawl settings
  const [firecrawlApiKey, setFirecrawlApiKey] = useState('fc-9ce6209229fa4d94baf4dd3508704790');
  const [firecrawlBaseUrl, setFirecrawlBaseUrl] = useState('https://fc.zaby.io');

  const [showKey, setShowKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showFirecrawlKey, setShowFirecrawlKey] = useState(false);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const [testSearchStatus, setTestSearchStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testSearchError, setTestSearchError] = useState('');

  // Load stored config on open
  useEffect(() => {
    if (isOpen) {
      const config = getStoredPlaygroundConfig();
      setProvider(config.provider);
      setApiOrigin(config.apiOrigin);
      setAuthMode(config.authMode);
      setRuntimeToken(config.runtimeToken);
      setApiKey(config.apiKey);
      setExternalAppId(config.externalAppId);
      setDeploymentId(config.deploymentId);
      setExternalUserId(config.externalUserId);
      setOpenaiApiKey(config.openaiApiKey);
      setOpenaiModel(config.openaiModel);
      setOpenaiTemperature(config.openaiTemperature);

      const fcConfig = getStoredFirecrawlConfig();
      setFirecrawlApiKey(fcConfig.apiKey);
      setFirecrawlBaseUrl(fcConfig.baseUrl);

      setTestStatus('idle');
      setTestError('');
      setTestSearchStatus('idle');
      setTestSearchError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const config: PlaygroundConfig = {
      provider,
      apiOrigin,
      authMode,
      runtimeToken,
      apiKey,
      externalAppId,
      deploymentId,
      externalUserId,
      openaiApiKey,
      openaiModel,
      openaiTemperature,
    };
    savePlaygroundConfig(config);
    saveFirecrawlConfig({
      apiKey: firecrawlApiKey,
      baseUrl: firecrawlBaseUrl,
    });
    onConfigChange?.(config);
    onClose();
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestError('');

    const config: PlaygroundConfig = {
      provider,
      apiOrigin,
      authMode,
      runtimeToken,
      apiKey,
      externalAppId,
      deploymentId,
      externalUserId,
      openaiApiKey,
      openaiModel,
      openaiTemperature,
    };

    if (provider === 'zaby') {
      const result = await testZabyConnection(config);
      if (result.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setTestError(result.error ?? 'Connection failed');
      }
    } else {
      if (!openaiApiKey.trim()) {
        setTestStatus('error');
        setTestError('Please enter an OpenAI API key first');
        return;
      }
      const result = await testOpenAIConnection(openaiApiKey.trim());
      if (result.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setTestError(result.error ?? 'Connection failed');
      }
    }
  };

  const handleTestSearch = async () => {
    setTestSearchStatus('testing');
    setTestSearchError('');

    const result = await testFirecrawlConnection(firecrawlApiKey, firecrawlBaseUrl);
    if (result.ok) {
      setTestSearchStatus('success');
    } else {
      setTestSearchStatus('error');
      setTestSearchError(result.error ?? 'Connection failed');
    }
  };

  const isSaveDisabled = 
    provider === 'zaby'
      ? (authMode === 'token' 
          ? !runtimeToken.trim()
          : !apiKey.trim() || !externalAppId.trim() || !deploymentId.trim())
      : !openaiApiKey.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/20">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Playground Settings</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Configure your active model provider and connection tokens</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-transparent hover:border-border/40"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {/* Active Provider Toggle */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Active AI Gateway
                  </label>
                  <div className="flex gap-2 p-1 bg-muted/40 border border-border/40 rounded-lg">
                    <button
                      type="button"
                      onClick={() => { setProvider('zaby'); setTestStatus('idle'); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        provider === 'zaby'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Zaby Agentic OS
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProvider('openai'); setTestStatus('idle'); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        provider === 'openai'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      OpenAI Direct
                    </button>
                  </div>
                </div>

                {provider === 'zaby' ? (
                  /* Zaby Provider Form */
                  <div className="flex flex-col gap-4">
                    {/* API Origin */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Globe size={12} className="text-primary" /> API Origin Gateway
                      </label>
                      <input
                        type="text"
                        value={apiOrigin}
                        onChange={(e) => { setApiOrigin(e.target.value); setTestStatus('idle'); }}
                        placeholder="https://genapi.zaby.io"
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                      />
                    </div>

                    {/* Auth Mode Toggle */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Authentication Strategy
                      </label>
                      <div className="flex gap-2 p-1 bg-muted/40 border border-border/40 rounded-lg">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('token'); setTestStatus('idle'); }}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            authMode === 'token'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Runtime Token
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('mint'); setTestStatus('idle'); }}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            authMode === 'mint'
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          API Key (Auto-Mint)
                        </button>
                      </div>
                    </div>

                    {/* Conditional Fields based on Auth Mode */}
                    {authMode === 'token' ? (
                      <div className="flex flex-col gap-3 p-3.5 rounded-lg border border-border/50 bg-muted/10">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <Key size={12} className="text-primary" /> Disposable Runtime Token
                          </label>
                          <div className="relative">
                            <input
                              type={showToken ? 'text' : 'password'}
                              value={runtimeToken}
                              onChange={(e) => { setRuntimeToken(e.target.value); setTestStatus('idle'); }}
                              placeholder="zaby_rt_..."
                              className="w-full px-3 py-2 pr-10 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/40 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowToken(!showToken)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5 p-3.5 rounded-lg border border-border/50 bg-muted/10">
                        {/* API Key */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <Key size={12} className="text-primary" /> Provisioning API Key
                          </label>
                          <div className="relative">
                            <input
                              type={showKey ? 'text' : 'password'}
                              value={apiKey}
                              onChange={(e) => { setApiKey(e.target.value); setTestStatus('idle'); }}
                              placeholder="zaby_pk_..."
                              className="w-full px-3 py-2 pr-10 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/40 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* External App ID */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <Cpu size={12} className="text-primary" /> External App ID
                          </label>
                          <input
                            type="text"
                            value={externalAppId}
                            onChange={(e) => { setExternalAppId(e.target.value); setTestStatus('idle'); }}
                            placeholder="e.g. app_abc123"
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                          />
                        </div>

                        {/* Agent Deployment ID */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <Cpu size={12} className="text-primary" /> Agent Deployment ID
                          </label>
                          <input
                            type="text"
                            value={deploymentId}
                            onChange={(e) => { setDeploymentId(e.target.value); setTestStatus('idle'); }}
                            placeholder="e.g. dep_xyz789"
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                          />
                        </div>

                        {/* User ID */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            User ID Hash
                          </label>
                          <input
                            type="text"
                            value={externalUserId}
                            onChange={(e) => { setExternalUserId(e.target.value); setTestStatus('idle'); }}
                            placeholder="playground-user"
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* OpenAI Provider Form */
                  <div className="flex flex-col gap-4">
                    {/* OpenAI API Key */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Key size={12} className="text-primary" /> OpenAI API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showOpenaiKey ? 'text' : 'password'}
                          value={openaiApiKey}
                          onChange={(e) => { setOpenaiApiKey(e.target.value); setTestStatus('idle'); }}
                          placeholder="sk-..."
                          className="w-full px-3 py-2 pr-10 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/40 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showOpenaiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Model */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Terminal size={12} className="text-primary" /> OpenAI Model
                      </label>
                      <select
                        value={openaiModel}
                        onChange={(e) => setOpenaiModel(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground cursor-pointer"
                      >
                        {AVAILABLE_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Temperature */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Temperature
                        </label>
                        <span className="text-[11px] font-mono text-muted-foreground">{openaiTemperature.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={openaiTemperature}
                        onChange={(e) => setOpenaiTemperature(parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-muted-foreground/60">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary connection check */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleTest}
                    disabled={testStatus === 'testing' || isSaveDisabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {testStatus === 'testing' && <Loader2 size={12} className="animate-spin" />}
                    Test Connection
                  </button>

                  {testStatus === 'success' && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                      <CheckCircle2 size={13} /> Connection OK
                    </span>
                  )}
                  {testStatus === 'error' && (
                    <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold truncate max-w-[250px]" title={testError}>
                      <XCircle size={13} /> {testError}
                    </span>
                  )}
                </div>

                {/* Web Search (Firecrawl) Settings */}
                <div className="border-t border-border/50 pt-4 mt-2 flex flex-col gap-3.5">
                  <h3 className="text-xs font-bold text-foreground">Web Search Integration (Firecrawl)</h3>
                  
                  {/* Firecrawl API Url */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Globe size={12} className="text-primary" /> Firecrawl Base URL
                    </label>
                    <input
                      type="text"
                      value={firecrawlBaseUrl}
                      onChange={(e) => { setFirecrawlBaseUrl(e.target.value); setTestSearchStatus('idle'); }}
                      placeholder="https://fc.zaby.io"
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
                    />
                  </div>

                  {/* Firecrawl API Key */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Key size={12} className="text-primary" /> Firecrawl API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showFirecrawlKey ? 'text' : 'password'}
                        value={firecrawlApiKey}
                        onChange={(e) => { setFirecrawlApiKey(e.target.value); setTestSearchStatus('idle'); }}
                        placeholder="fc-..."
                        className="w-full px-3 py-2 pr-10 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/40 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFirecrawlKey(!showFirecrawlKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showFirecrawlKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Test Firecrawl Connection */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={handleTestSearch}
                      disabled={testSearchStatus === 'testing' || !firecrawlApiKey.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {testSearchStatus === 'testing' && <Loader2 size={12} className="animate-spin" />}
                      Test Web Search
                    </button>

                    {testSearchStatus === 'success' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                        <CheckCircle2 size={13} /> Connection OK
                      </span>
                    )}
                    {testSearchStatus === 'error' && (
                      <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold truncate max-w-[250px]" title={testSearchError}>
                        <XCircle size={13} /> {testSearchError}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/50 bg-muted/10">
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  className="px-4.5 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
