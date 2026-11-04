import React from 'react';
import { AlertOctagon } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Caught by Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertOctagon size={32} />
              <h1 className="text-2xl font-bold">System Crash Intercepted</h1>
            </div>
            <p className="text-gray-600 mb-6 font-medium">Task Bandhu encountered a data rendering error. This usually happens when old test data is missing new fields.</p>
            <div className="bg-slate-900 rounded-xl p-4 overflow-auto">
              <p className="text-red-400 font-mono text-sm mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre className="text-gray-400 font-mono text-xs">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}