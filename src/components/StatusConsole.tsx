import React, { useEffect, useRef, useState } from 'react';
import { Terminal, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { FFmpegStatus, InitProgress, LogEntry, RenderProgress } from '../types';

interface StatusConsoleProps {
  status: FFmpegStatus;
  progress: RenderProgress;
  initProgress?: InitProgress;
  logs: LogEntry[];
  errorMessage?: string | null;
  onRetryInit?: () => void;
}

export const StatusConsole: React.FC<StatusConsoleProps> = ({
  status,
  progress,
  initProgress,
  logs,
  errorMessage,
  onRetryInit,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {initProgress && initProgress.percentage > 0
              ? `Downloading WASM Core (${initProgress.percentage}%)`
              : 'Loading FFmpeg WASM Core...'}
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Engine Ready (Single-threaded)
          </span>
        );
      case 'encoding':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-950/70 text-sky-300 border border-sky-800/60">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Rendering Video... {progress.percentage}%
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Rendering Complete
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/70 text-rose-300 border border-rose-800/60">
            <AlertCircle className="w-3.5 h-3.5" />
            Engine Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Engine Idle
          </span>
        );
    }
  };

  return (
    <div id="status-console-card" className="rounded-xl border border-slate-700 bg-slate-900/90 overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold text-slate-200">Engine & Compilation Status</span>
          <div>{getStatusBadge()}</div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              id="btn-copy-logs"
              type="button"
              onClick={handleCopyLogs}
              title="Copy log text"
              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 rounded hover:bg-slate-800 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          <button
            id="btn-toggle-logs"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* WASM Core Download Progress (Visible during initial download) */}
      {status === 'loading' && initProgress && (
        <div id="init-progress-container" className="px-4 pt-3 pb-2 bg-slate-900 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-xs font-medium text-amber-200 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              {initProgress.message || 'Downloading FFmpeg WASM Core...'}
            </span>
            <span id="init-percentage-text" className="font-mono text-amber-400 font-bold">
              {initProgress.percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              id="init-progress-bar"
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-150 rounded-full"
              style={{ width: `${Math.max(4, initProgress.percentage)}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress Bar (Visible during encoding or when progress > 0) */}
      {(status === 'encoding' || (progress.percentage > 0 && status !== 'ready')) && (
        <div id="render-progress-container" className="px-4 pt-3 pb-1 bg-slate-900">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              Encoding H.264 Video Stream...
            </span>
            <span id="render-percentage-text" className="font-mono text-sky-400 font-bold">
              {progress.percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              id="render-progress-bar"
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-200 rounded-full"
              style={{ width: `${Math.max(3, progress.percentage)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div id="status-error-banner" className="m-3 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
            {onRetryInit && (
              <button
                id="btn-retry-init"
                type="button"
                onClick={onRetryInit}
                className="mt-2 px-2.5 py-1 bg-rose-900/80 hover:bg-rose-850 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Retry Initialization
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Log text area */}
      {isExpanded && (
        <div
          id="status-log-textarea"
          ref={logsEndRef}
          className="p-3.5 max-h-44 min-h-[100px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 select-text"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">
              {status === 'loading'
                ? 'Fetching single-threaded WASM core directly from unpkg CDN...'
                : 'Engine logs and progress notifications will stream here...'}
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`py-0.5 ${
                  log.type === 'error'
                    ? 'text-rose-400'
                    : log.type === 'success'
                    ? 'text-emerald-400 font-semibold'
                    : log.type === 'info'
                    ? 'text-sky-300'
                    : 'text-slate-400'
                }`}
              >
                <span className="text-slate-600 mr-2 select-none">[{log.timestamp}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
