import React, { useState } from 'react';
import {
  X,
  Download,
  FileImage,
  FileCode,
  FileText,
  FileJson,
  Sparkles,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { exportToPNG, exportToSVG, exportToPDF, exportToJSON } from '../engine/exportUtils';
import { isApexPlan } from '../utils/planLimits';

export default function ExportModal({
  isOpen,
  onClose,
  boardData,
  elements,
  currentUser,
  isOwner = false,
  isDark = true
}) {
  const [format, setFormat] = useState('png'); // 'png' | 'svg' | 'pdf' | 'json'
  const [is4K, setIs4K] = useState(false);
  const [isDarkBg, setIsDarkBg] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const userIsOwner = isOwner || (boardData && currentUser && boardData.ownerId === currentUser.uid);
  const allowGuestExport = boardData?.allowGuestExport !== undefined ? boardData.allowGuestExport : true;
  const canExport = userIsOwner || allowGuestExport;

  if (!canExport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in">
        <div className={`w-full max-w-sm ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 shadow-2xl text-center space-y-4`}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
            <Download size={24} />
          </div>
          <div>
            <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Export Restricted</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1.5 leading-relaxed`}>
              The room host has restricted canvas downloads and exports to host-only for this FlowSpace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  const isApex = isApexPlan(boardData?.ownerPlan || currentUser?.plan);

  const handleExport = async () => {
    setIsExporting(true);
    const safeTitle = (boardData?.title || 'TaskBandhu-FlowSpace').replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      if (format === 'png') {
        exportToPNG({
          elements,
          isApex,
          is4K: isApex && is4K,
          isDark: isDarkBg,
          filename: `${safeTitle}.png`
        });
      } else if (format === 'svg') {
        exportToSVG({
          elements,
          isApex,
          isDark: isDarkBg,
          filename: `${safeTitle}.svg`
        });
      } else if (format === 'pdf') {
        exportToPDF({
          elements,
          isApex,
          isDark: isDarkBg,
          filename: `${safeTitle}.pdf`
        });
      } else if (format === 'json') {
        exportToJSON({
          boardData,
          elements,
          filename: `${safeTitle}.json`
        });
      }
    } catch (e) {
      console.error('Export failed:', e);
    }

    setIsExporting(false);
    onClose();
  };

  const formats = [
    { id: 'png', name: 'PNG Image', desc: 'Standard & 4K Ultra HD', icon: FileImage, apexReq: false },
    { id: 'svg', name: 'Vector SVG', desc: 'Infinite crisp scalability', icon: FileCode, apexReq: false },
    { id: 'pdf', name: 'PDF Document', desc: 'Ready for print & presentation', icon: FileText, apexReq: false },
    { id: 'json', name: 'JSON Backup', desc: 'Full editable canvas data', icon: FileJson, apexReq: false }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className={`w-full max-w-md ${isDark ? 'bg-slate-900 border-white/[0.1] text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl shadow-2xl overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-5 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Download size={20} />
            </div>
            <div>
              <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Export FlowSpace</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Download your canvas in multiple high-res formats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'} rounded-xl transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select Format</span>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => {
                const Icon = f.icon;
                const isSelected = format === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm'
                        : isDark
                          ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-slate-300'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : (isDark ? 'text-slate-400' : 'text-slate-500')} />
                    <div>
                      <p className={`text-xs font-extrabold leading-tight ${isSelected ? (isDark ? 'text-white' : 'text-indigo-950') : (isDark ? 'text-slate-200' : 'text-slate-900')}`}>{f.name}</p>
                      <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Toggle */}
          <div className={`p-3 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'} border rounded-2xl flex items-center justify-between`}>
            <span className={`text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Background Tone</span>
            <div className={`flex items-center gap-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200/80'} p-1 rounded-xl`}>
              <button
                onClick={() => setIsDarkBg(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isDarkBg ? 'bg-indigo-600 text-white shadow-xs' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon size={12} />
                <span>Dark</span>
              </button>
              <button
                onClick={() => setIsDarkBg(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  !isDarkBg ? 'bg-indigo-600 text-white shadow-xs' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun size={12} />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* 4K Ultra HD Toggle (Apex Prestige) */}
          {format === 'png' && (
            <div className={`p-3 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'} border rounded-2xl flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={isApex ? 'text-amber-500' : 'text-slate-400'} />
                <div>
                  <p className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
                    <span>Ultra HD 4K Resolution</span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Apex
                    </span>
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>3x supersampled high resolution render</p>
                </div>
              </div>

              {isApex ? (
                <button
                  onClick={() => setIs4K(prev => !prev)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${is4K ? 'bg-amber-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${is4K ? 'left-5' : 'left-1'}`} />
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold">Apex Exclusive</span>
              )}
            </div>
          )}

          {/* Watermark Notice */}
          {!isApex && (
            <p className="text-[11px] text-slate-400 italic text-center">
              ✦ Exports will include a subtle "Made with Task Bandhu FlowSpace" watermark.
            </p>
          )}

          {/* Download CTA */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Download size={15} />
            <span>{isExporting ? 'Generating File...' : `Download ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

