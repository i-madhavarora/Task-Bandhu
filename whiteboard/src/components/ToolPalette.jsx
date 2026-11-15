import React, { useState } from 'react';
import {
  MousePointer,
  Hand,
  PenTool,
  Highlighter,
  Eraser,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  Diamond,
  Star,
  StickyNote,
  Type,
  Flame,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Lock
} from 'lucide-react';

export default function ToolPalette({
  activeTool,
  setActiveTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUploadImage,
  readOnly = false,
  isDark = true
}) {
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  const shapes = [
    { id: 'rect', label: 'Rectangle (R)', icon: Square },
    { id: 'circle', label: 'Circle (C)', icon: Circle },
    { id: 'arrow', label: 'Arrow (A)', icon: ArrowUpRight },
    { id: 'line', label: 'Line (L)', icon: Minus },
    { id: 'diamond', label: 'Diamond', icon: Diamond },
    { id: 'star', label: 'Star', icon: Star }
  ];

  const handleShapeSelect = (shapeId) => {
    setActiveTool(shapeId);
    setShowShapesMenu(false);
  };

  const isShapeActive = shapes.some(s => s.id === activeTool);

  const dockBg = isDark
    ? 'bg-slate-900/95 border-white/[0.1] text-slate-300'
    : 'bg-white/95 border-slate-200 text-slate-700 shadow-xl';

  const idleButton = isDark
    ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100';

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 max-w-[96vw] select-none">
      {/* Main Tool Bar */}
      <div className={`flex items-center gap-1 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl ${dockBg}`}>
        {/* Select */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === 'select'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : idleButton
          }`}
          title="Select & Move (V)"
        >
          <MousePointer size={17} />
        </button>

        {/* Pan Hand */}
        <button
          onClick={() => setActiveTool('pan')}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === 'pan'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : idleButton
          }`}
          title="Pan / Hand (H or hold Spacebar)"
        >
          <Hand size={17} />
        </button>

        <div className={`w-px h-6 mx-0.5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

        {readOnly && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black shadow-xs">
            <Lock size={13} />
            <span>View-Only Mode</span>
          </div>
        )}

        {!readOnly && (
          <>
            {/* Freehand Pen */}
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'pen'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : idleButton
              }`}
              title="Smooth Pen (P)"
            >
              <PenTool size={17} />
            </button>

            {/* Highlighter */}
            <button
              onClick={() => setActiveTool('highlighter')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'highlighter'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : idleButton
              }`}
              title="Highlighter (M)"
            >
              <Highlighter size={17} />
            </button>

            {/* Eraser */}
            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : idleButton
              }`}
              title="Stroke Eraser (E)"
            >
              <Eraser size={17} />
            </button>

            {/* Shapes Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShapesMenu(prev => !prev)}
                className={`p-2.5 rounded-xl transition-all ${
                  isShapeActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : idleButton
                }`}
                title="Geometric Shapes (R)"
              >
                <Square size={17} />
              </button>

              {showShapesMenu && (
                <div className={`absolute bottom-14 left-1/2 -translate-x-1/2 p-2 border rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[150px] animate-in fade-in zoom-in-95 ${
                  isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
                }`}>
                  {shapes.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleShapeSelect(s.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                          activeTool === s.id
                            ? 'bg-indigo-600 text-white'
                            : isDark ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={15} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky Note */}
            <button
              onClick={() => setActiveTool('sticky')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'sticky'
                  ? 'bg-yellow-500 text-slate-950 font-black shadow-md shadow-yellow-500/30'
                  : idleButton
              }`}
              title="Post-it Sticky Note (S)"
            >
              <StickyNote size={17} />
            </button>

            {/* Text Box */}
            <button
              onClick={() => setActiveTool('text')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'text'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : idleButton
              }`}
              title="Rich Text (T)"
            >
              <Type size={17} />
            </button>

            {/* Image Upload */}
            <label
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${idleButton}`}
              title="Insert Image (or paste with Ctrl+V)"
            >
              <ImageIcon size={17} />
              <input
                type="file"
                accept="image/*"
                onChange={onUploadImage}
                className="hidden"
              />
            </label>

            {/* Laser Pointer (Only available for editors/presenters when unlocked) */}
            <button
              onClick={() => setActiveTool('laser')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'laser'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40 animate-pulse'
                  : idleButton
              }`}
              title="Laser Pointer (L) - Fading live presentation trail"
            >
              <Flame size={17} />
            </button>
          </>
        )}

        {!readOnly && (
          <>
            <div className={`w-px h-6 mx-0.5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Undo / Redo */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2.5 rounded-xl transition-all ${
                canUndo ? idleButton : 'text-slate-400 opacity-40 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2.5 rounded-xl transition-all ${
                canRedo ? idleButton : 'text-slate-400 opacity-40 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>

            {/* Clear All */}
            <button
              onClick={onClearCanvas}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              title="Clear entire canvas"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>

      {/* Zoom Widget */}
      <div className={`flex items-center gap-1 p-1 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-bold ${dockBg}`}>
        <button
          onClick={onZoomOut}
          className={`p-2 rounded-xl transition-all ${idleButton}`}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={onResetZoom}
          className="px-2 py-1 font-mono text-[11px] hover:text-indigo-500"
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          className={`p-2 rounded-xl transition-all ${idleButton}`}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
      </div>
    </div>
  );
}
