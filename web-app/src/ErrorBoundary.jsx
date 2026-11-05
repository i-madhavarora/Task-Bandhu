import { Component } from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
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
            <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">
              {isOffline
                ? "Check your internet connection. We've securely saved your tasks to this device."
                : "Task Bandhu ran into a minor rendering issue while organizing your workspace. A quick refresh should fix it."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <RefreshCw size={20} /> Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
