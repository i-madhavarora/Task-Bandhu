import React from 'react';
import { Trash2, Copy, Layers, Eye, Pipette } from 'lucide-react';

const PALETTE = [
  '#ffffff', '#e2e8f0', '#94a3b8', '#475569', '#1e293b', '#000000',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#14b8a6', '#059669', '#78350f'
];

const STICKY_COLORS = [
  { bg: '#fef08a', text: '#1c1917', name: 'Canary Yellow' },
  { bg: '#fed7aa', text: '#1c1917', name: 'Peach Warm' },
  { bg: '#fbcfe8', text: '#1c1917', name: 'Blush Pink' },
  { bg: '#bae6fd', text: '#1c1917', name: 'Sky Cyan' },
  { bg: '#bbf7d0', text: '#1c1917', name: 'Mint Green' },
  { bg: '#e9d5ff', text: '#1c1917', name: 'Lavender Purple' },
  { bg: '#fde047', text: '#1c1917', name: 'Golden Glow' },
  { bg: '#fecdd3', text: '#1c1917', name: 'Coral Rose' },
  { bg: '#e2e8f0', text: '#0f172a', name: 'Cool Slate' },
  { bg: '#1e293b', text: '#f8fafc', name: 'Dark Obsidian' }
];

export default function StylePicker({
  activeTool,
  currentStyle,
  onStyleChange,
  selectedElement,
  onDeleteSelected,
  onDuplicateSelected,
  isDark = true
}) {
  const isStrokeTool = activeTool === 'pen' || activeTool === 'highlighter';
  const isShapeTool = ['rect', 'circle', 'arrow', 'line', 'diamond', 'star'].includes(activeTool) || (selectedElement && ['rect', 'circle', 'arrow', 'line', 'diamond', 'star'].includes(selectedElement.type));
  const isSticky = activeTool === 'sticky' || selectedElement?.type === 'sticky';
  const isText = activeTool === 'text' || selectedElement?.type === 'text';

  // Only render if a customizable tool is active or an element is selected
  if (!isStrokeTool && !isShapeTool && !isSticky && !isText && !selectedElement) {
    return null;
  }

  const bgClass = isDark
    ? 'bg-slate-900/95 border-white/[0.12] text-slate-100'
    : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl';

  const currentFill = selectedElement?.fill || currentStyle.fill || 'transparent';
  const activeColor = selectedElement?.color || currentStyle.color || '#6366f1';

  const isSemi = currentFill !== 'transparent' && (
    currentFill.endsWith('33') ||
    currentFill.endsWith('40') ||
    currentFill.includes('0.2') ||
    currentFill.includes('0.25') ||
    currentFill.includes('rgba')
  );
  const isSolid = currentFill !== 'transparent' && !isSemi;
  const isOutline = currentFill === 'transparent' || !currentFill;

  return (
    <div
      className={`fixed top-18 left-4 z-20 flex flex-col gap-2.5 p-3.5 rounded-3xl border shadow-2xl backdrop-blur-xl text-xs select-none w-64 animate-in fade-in slide-in-from-left-4 max-h-[82vh] overflow-y-auto ${bgClass}`}
    >
      {/* Title / Tool Name */}
      <div className="flex items-center justify-between border-b border-white/[0.08] dark:border-white/[0.08] pb-2">
        <div>
          <span className="font-black text-xs capitalize flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>{selectedElement ? `${selectedElement.type} Selected` : `${activeTool} Style`}</span>
          </span>
          {selectedElement && (
            <span className="text-[10px] text-slate-400 font-medium">Click handles to resize</span>
          )}
        </div>

        {selectedElement && (
          <button
            onClick={onDuplicateSelected}
            className="p-1.5 hover:bg-white/[0.08] dark:hover:bg-white/[0.08] text-slate-400 hover:text-white rounded-lg transition-all"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={13} />
          </button>
        )}
      </div>

      {/* Sticky Note Colors */}
      {isSticky ? (
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Note Theme</span>
          <div className="grid grid-cols-5 gap-1.5">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => onStyleChange({ color: c.bg, textColor: c.text })}
                style={{ backgroundColor: c.bg }}
                className={`w-8 h-8 rounded-xl border transition-all ${
                  (currentStyle.color === c.bg || selectedElement?.color === c.bg)
                    ? 'border-indigo-500 scale-110 shadow-sm ring-2 ring-indigo-400/50'
                    : 'border-white/20 hover:scale-105'
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Regular Color Palette */
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Color Palette</span>
            <label className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity" title="Pick Custom Color">
              <input
                type="color"
                value={activeColor.startsWith('#') && activeColor.length === 7 ? activeColor : '#6366f1'}
                onChange={(e) => onStyleChange({ color: e.target.value })}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="text-[10px] font-bold text-indigo-400">Custom</span>
            </label>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {PALETTE.map((hex) => (
              <button
                key={hex}
                onClick={() => onStyleChange({ color: hex })}
                style={{ backgroundColor: hex }}
                className={`h-6 rounded-lg border transition-all ${
                  (currentStyle.color === hex || selectedElement?.color === hex)
                    ? 'border-indigo-500 scale-110 shadow-sm ring-2 ring-indigo-400/50 z-10'
                    : 'border-white/20 hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke Width (Pen & Shapes) */}
      {(isStrokeTool || isShapeTool) && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Thickness</span>
          <div className="grid grid-cols-4 gap-1">
            {[2, 4, 8, 16].map((w) => (
              <button
                key={w}
                onClick={() => onStyleChange({ strokeWidth: w })}
                className={`py-1.5 rounded-xl text-center font-bold text-[11px] transition-all ${
                  (currentStyle.strokeWidth === w || selectedElement?.strokeWidth === w)
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark ? 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shape Fill Style */}
      {isShapeTool && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Fill Style</span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'transparent', label: 'Outline', active: isOutline },
              { id: 'semi', label: 'Tinted', active: isSemi },
              { id: 'solid', label: 'Solid', active: isSolid }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  let fillVal = 'transparent';
                  if (f.id === 'semi') fillVal = `${activeColor.slice(0, 7)}33`;
                  else if (f.id === 'solid') fillVal = activeColor.slice(0, 7);
                  onStyleChange({ fill: fillVal });
                }}
                className={`py-1.5 rounded-xl text-center font-bold text-[11px] transition-all ${
                  f.active
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : isDark ? 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Size (for Text tool) */}
      {isText && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Font Size</span>
          <div className="grid grid-cols-4 gap-1">
            {[16, 24, 32, 48].map((s) => (
              <button
                key={s}
                onClick={() => onStyleChange({ fontSize: s })}
                className={`py-1.5 rounded-xl text-center font-bold text-[11px] transition-all ${
                  (currentStyle.fontSize === s || selectedElement?.fontSize === s)
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark ? 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Delete Element Button for selected item */}
      {selectedElement && (
        <div className="pt-2 border-t border-white/[0.08] dark:border-white/[0.08]">
          <button
            onClick={onDeleteSelected}
            className="w-full py-2.5 px-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 flex items-center justify-center gap-2 font-black transition-all text-xs active:scale-[0.98]"
            title="Delete Selected Item (Del)"
          >
            <Trash2 size={14} />
            <span>Delete Selected Element</span>
          </button>
        </div>
      )}
    </div>
  );
}
