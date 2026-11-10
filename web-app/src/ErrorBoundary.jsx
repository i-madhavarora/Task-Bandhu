import { Component } from 'react';
import { WifiOff, AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Task Bandhu caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-100 dark:border-slate-700">
            <div className="bg-blue-50 dark:bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              {isOffline ? <WifiOff size={32} className="text-blue-500" /> : <AlertTriangle size={32} className="text-amber-500" />}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              {isOffline ? "You're Offline" : "Oops! Something hiccuped."}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mb-6 font-medium text-sm">
              {isOffline
                ? "Check your internet connection. We've securely saved your tasks to this device."
                : "Task Bandhu ran into a minor rendering issue while organizing your workspace. A quick refresh should fix it."}
            </p>

            {this.state.error?.message && !isOffline && (
              <details className="mb-6 text-left p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-rose-500 font-mono overflow-auto max-h-28">
                <summary className="cursor-pointer font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Technical Details
                </summary>
                {this.state.error.message}
              </details>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 text-xs"
              >
                <RotateCcw size={16} /> Try Recovering
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs"
              >
                <RefreshCw size={16} /> Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
