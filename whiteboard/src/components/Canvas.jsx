import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  renderBackground,
  renderElement,
  renderLaserTrail,
  renderRemoteCursor
} from '../engine/canvasRenderer';
import {
  getElementBounds,
  isPointInBounds,
  isPointNearStroke,
  getResizeHandles,
  hitTestHandle,
  resizeElement
} from '../engine/geometryUtils';
import { compressImageToDataUrl } from '../utils/imageUtils';
import { Trash2, Copy, Sparkles, Check } from 'lucide-react';

export default function Canvas({
  elements,
  onSaveElement,
  onRemoveElement,
  activeTool,
  setActiveTool,
  currentStyle,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  presenceList,
  onUpdatePresence,
  userColor,
  selectedElementId,
  onSelectElement,
  readOnly = false,
  boardBg = 'dots',
  isDark = true,
  boardData = null
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // If user does not have write/edit access, clear their presence cursor immediately
  useEffect(() => {
    if (readOnly && onUpdatePresence) {
      onUpdatePresence(null);
    }
  }, [readOnly, onUpdatePresence]);

  // Resize State
  const [activeHandle, setActiveHandle] = useState(null);
  const [hoveredHandleCursor, setHoveredHandleCursor] = useState(null);

  // Editing inline text / sticky
  const [editingTextElement, setEditingTextElement] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState('');

  // Local laser trail
  const localLaserTrailRef = useRef([]);

  // Screen to World coordinates (Exact 1:1 mapped to viewport)
  const screenToWorld = useCallback((sx, sy) => {
    return {
      x: (sx - pan.x) / zoom,
      y: (sy - pan.y) / zoom
    };
  }, [pan, zoom]);

  // World to Screen coordinates
  const worldToScreen = useCallback((wx, wy) => {
    return {
      x: wx * zoom + pan.x,
      y: wy * zoom + pan.y
    };
  }, [pan, zoom]);

  // Handle Keyboard Shortcuts (Space for Pan, Delete/Backspace to delete selected element)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
      if (e.code === 'Space' && !e.repeat && !isInputActive) {
        setIsSpacePressed(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputActive && selectedElementId) {
        if (readOnly) return;
        onRemoveElement(selectedElementId);
        onSelectElement(null);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementId, onRemoveElement, onSelectElement]);

  // Handle Clipboard Image Paste (Ctrl+V)
  useEffect(() => {
    if (readOnly) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            compressImageToDataUrl(file).then(({ dataUrl, width, height }) => {
              const canvas = canvasRef.current;
              const rect = canvas ? canvas.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
              const center = screenToWorld(rect.width / 2, rect.height / 2);
              const displayWidth = Math.min(420, width);
              const displayHeight = Math.round((height / width) * displayWidth);
              const imgElem = {
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                type: 'image',
                src: dataUrl,
                x: Math.round(center.x - displayWidth / 2),
                y: Math.round(center.y - displayHeight / 2),
                width: displayWidth,
                height: displayHeight,
                zIndex: Date.now()
              };
              onSaveElement(imgElem);
              onSelectElement(imgElem.id);
              if (setActiveTool) setActiveTool('select');
            }).catch(err => {
              console.error('Failed to compress pasted image:', err);
            });
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [readOnly, onSaveElement, onSelectElement, setActiveTool, screenToWorld]);

  // 60FPS Render Loop with exact DPR transform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Reset transform cleanly
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Render Background Grid
      renderBackground(ctx, width, height, pan, zoom, boardBg, isDark);

      // Apply Viewport Transform
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Render Synchronized Elements
      elements.forEach((elem) => {
        renderElement(ctx, elem, elem.id === selectedElementId);
      });

      // Render Current In-Progress Draft
      if (currentDraft) {
        renderElement(ctx, currentDraft, false);
      }

      // Render Local Laser Trail
      if (localLaserTrailRef.current.length > 0) {
        renderLaserTrail(ctx, localLaserTrailRef.current, userColor);
      }

      // Render Remote Collaborators' Laser Trails & Cursors (ONLY for active editors with write/edit access)
      presenceList.forEach((presence) => {
        const isOwnerMember = Boolean(presence.isOwner || (boardData && presence.uid === boardData?.ownerId));
        const memberRole = boardData?.members?.[presence.uid]?.role;
        const isBoardLocked = Boolean(boardData?.isLocked);

        // A user is considered an active editor if they are the room owner,
        // OR the board is not locked and their role is not 'viewer' and presence.canEdit !== false
        const isEditor = isOwnerMember || (!isBoardLocked && memberRole !== 'viewer' && presence.canEdit !== false);

        // When not access to write or edit, don't show cursor (only editor's cursor)
        if (!isEditor) return;

        if (presence.laserTrail && presence.laserTrail.length > 0) {
          renderLaserTrail(ctx, presence.laserTrail, presence.color || '#ec4899');
        }
        if (presence.cursor) {
          renderRemoteCursor(ctx, presence);
        }
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [elements, currentDraft, pan, zoom, presenceList, userColor, selectedElementId, boardBg, isDark]);

  // Precise Canvas Resize Handler (Matches container dimensions without distortion)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const selectedElement = elements.find(e => e.id === selectedElementId);
  const selectedBounds = selectedElement ? getElementBounds(selectedElement) : null;

  // Eraser hit-testing helper: erases any element touched by the eraser brush
  const eraseAtPoint = useCallback((wx, wy) => {
    // Tight, accurate eraser radius
    const eraseRadius = Math.max(5, 8 / zoom);
    const toRemove = [];

    for (const elem of elements) {
      if (elem.type === 'pen' || elem.type === 'stroke' || elem.type === 'highlighter') {
        if (!elem.points || elem.points.length === 0) continue;
        if (elem.points.length === 1) {
          if (Math.hypot(wx - elem.points[0].x, wy - elem.points[0].y) <= eraseRadius + (elem.strokeWidth || 4) / 2) {
            toRemove.push(elem.id);
          }
        } else if (isPointNearStroke(wx, wy, elem.points, eraseRadius + (elem.strokeWidth || 4) / 2)) {
          toRemove.push(elem.id);
        }
      } else {
        const b = getElementBounds(elem);
        if (isPointInBounds(wx, wy, b, 4 / zoom)) {
          toRemove.push(elem.id);
        }
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach(id => onRemoveElement(id));
      if (selectedElementId && toRemove.includes(selectedElementId)) {
        onSelectElement(null);
      }
    }
  }, [elements, zoom, onRemoveElement, selectedElementId, onSelectElement]);

  // Pointer Down
  const handlePointerDown = (e) => {
    if (e.target !== canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    // Broadcast presence cursor (only if permitted to write/edit)
    if (!readOnly && onUpdatePresence) {
      onUpdatePresence(world);
    }

    // Pan mode (Hand tool, Middle click, or Spacebar held)
    if (activeTool === 'pan' || isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: sx - pan.x, y: sy - pan.y });
      return;
    }

    // Presentation locked / Viewer-only: attendees cannot draw or use laser pointer
    if (readOnly) return;

    // Check if clicking on a resize handle of the selected element
    if (selectedElement && selectedBounds) {
      const handle = hitTestHandle(world.x, world.y, selectedBounds, 14 / zoom);
      if (handle) {
        setIsDrawing(true);
        setActiveHandle(handle.id);
        setDragStart({ x: world.x, y: world.y, element: { ...selectedElement } });
        return;
      }
    }

    // Laser Pointer Tool (Only available when presentation is not locked / user has editor role)
    if (activeTool === 'laser') {
      setIsDrawing(true);
      const point = { x: world.x, y: world.y, timestamp: Date.now() };
      localLaserTrailRef.current = [point];
      onUpdatePresence(world, localLaserTrailRef.current);
      return;
    }

    // Eraser Tool
    if (activeTool === 'eraser') {
      setIsDrawing(true);
      eraseAtPoint(world.x, world.y);
      return;
    }

    // Select Tool
    if (activeTool === 'select') {
      let hitElement = null;
      // Hit-test in reverse order (topmost first)
      for (let i = elements.length - 1; i >= 0; i--) {
        const elem = elements[i];
        if (elem.type === 'stroke' || elem.type === 'pen' || elem.type === 'highlighter') {
          if (!elem.points || elem.points.length === 0) continue;
          if (elem.points.length === 1) {
            if (Math.hypot(world.x - elem.points[0].x, world.y - elem.points[0].y) <= (elem.strokeWidth || 4) / 2 + 8) {
              hitElement = elem;
              break;
            }
          } else if (isPointNearStroke(world.x, world.y, elem.points, (elem.strokeWidth || 4) / 2 + 8)) {
            hitElement = elem;
            break;
          }
        } else {
          const b = getElementBounds(elem);
          if (isPointInBounds(world.x, world.y, b)) {
            hitElement = elem;
            break;
          }
        }
      }

      if (hitElement) {
        onSelectElement(hitElement.id);
        setIsDrawing(true);
        setActiveHandle(null);
        setDragStart({ x: world.x, y: world.y, element: { ...hitElement } });
      } else {
        onSelectElement(null);
      }
      return;
    }

    // Freehand Pen / Highlighter
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setIsDrawing(true);
      const draft = {
        id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: activeTool,
        points: [{ x: world.x, y: world.y }],
        color: currentStyle.color || (activeTool === 'highlighter' ? '#facc15' : '#6366f1'),
        strokeWidth: currentStyle.strokeWidth || (activeTool === 'highlighter' ? 24 : 4),
        zIndex: Date.now()
      };
      setCurrentDraft(draft);
      return;
    }

    // Shapes
    if (['rect', 'circle', 'arrow', 'line', 'diamond', 'star'].includes(activeTool)) {
      setIsDrawing(true);
      const draft = {
        id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: activeTool,
        startX: world.x,
        startY: world.y,
        endX: world.x,
        endY: world.y,
        color: currentStyle.color || '#6366f1',
        strokeWidth: currentStyle.strokeWidth || 3,
        fill: currentStyle.fill || 'transparent',
        zIndex: Date.now()
      };
      setCurrentDraft(draft);
      return;
    }

    // Sticky Note Click: Add, select immediately, switch to select mode, open text editor
    if (activeTool === 'sticky') {
      const stickyElem = {
        id: `sticky_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'sticky',
        x: world.x - 90,
        y: world.y - 80,
        width: 180,
        height: 160,
        text: '',
        color: currentStyle.color && currentStyle.color.startsWith('#') ? currentStyle.color : '#fef08a',
        textColor: currentStyle.textColor || '#1c1917',
        fontSize: 16,
        zIndex: Date.now()
      };
      onSaveElement(stickyElem);
      onSelectElement(stickyElem.id);
      setEditingTextElement(stickyElem);
      setEditingTextValue('');
      if (setActiveTool) setActiveTool('select');
      return;
    }

    // Rich Text Click: Add, select immediately, switch to select mode, open text editor
    if (activeTool === 'text') {
      const textElem = {
        id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'text',
        x: world.x,
        y: world.y,
        text: '',
        color: currentStyle.color || (isDark ? '#e2e8f0' : '#0f172a'),
        fontSize: currentStyle.fontSize || 22,
        bold: false,
        italic: false,
        zIndex: Date.now()
      };
      onSaveElement(textElem);
      onSelectElement(textElem.id);
      setEditingTextElement(textElem);
      setEditingTextValue('');
      if (setActiveTool) setActiveTool('select');
    }
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    // Pan Move
    if (isPanning) {
      onPanChange({
        x: sx - panStart.x,
        y: sy - panStart.y
      });
      return;
    }

    // Update presence (only if permitted to write/edit)
    if (!readOnly && onUpdatePresence) {
      if (activeTool === 'laser' && isDrawing) {
        const point = { x: world.x, y: world.y, timestamp: Date.now() };
        localLaserTrailRef.current.push(point);
        onUpdatePresence(world, localLaserTrailRef.current);
      } else {
        onUpdatePresence(world);
      }
    }

    // Hover handle cursor check when in select mode
    if (activeTool === 'select' && selectedElement && selectedBounds && !isDrawing) {
      const handle = hitTestHandle(world.x, world.y, selectedBounds, 12 / zoom);
      setHoveredHandleCursor(handle ? handle.cursor : null);
    } else if (hoveredHandleCursor) {
      setHoveredHandleCursor(null);
    }

    if (!isDrawing) return;

    // Eraser in action while dragging
    if (activeTool === 'eraser') {
      eraseAtPoint(world.x, world.y);
      return;
    }

    // Resizing Selected Element
    if (activeHandle && dragStart) {
      const dx = world.x - dragStart.x;
      const dy = world.y - dragStart.y;
      const resized = resizeElement(dragStart.element, activeHandle, dx, dy);
      setCurrentDraft(resized);
      return;
    }

    // Drag / Move Selected Element
    if (activeTool === 'select' && dragStart && !activeHandle) {
      const dx = world.x - dragStart.x;
      const dy = world.y - dragStart.y;
      const original = dragStart.element;

      let updated = { ...original };
      if (original.type === 'stroke' || original.type === 'pen' || original.type === 'highlighter') {
        updated.points = original.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
      } else if (original.startX !== undefined) {
        updated.startX = original.startX + dx;
        updated.startY = original.startY + dy;
        updated.endX = original.endX + dx;
        updated.endY = original.endY + dy;
      } else {
        updated.x = original.x + dx;
        updated.y = original.y + dy;
      }

      setCurrentDraft(updated);
      return;
    }

    // Draw Pen / Highlighter
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentDraft(prev => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, { x: world.x, y: world.y }]
        };
      });
      return;
    }

    // Draw Shapes
    if (currentDraft && currentDraft.startX !== undefined) {
      setCurrentDraft(prev => ({
        ...prev,
        endX: world.x,
        endY: world.y
      }));
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (activeTool === 'laser') {
      setIsDrawing(false);
      setTimeout(() => {
        localLaserTrailRef.current = [];
      }, 1500);
      return;
    }

    if (activeTool === 'eraser') {
      setIsDrawing(false);
      return;
    }

    if (isDrawing && currentDraft) {
      onSaveElement(currentDraft);
      if (['rect', 'circle', 'arrow', 'line', 'diamond', 'star'].includes(currentDraft.type)) {
        onSelectElement(currentDraft.id);
      }
      setCurrentDraft(null);
    }

    setIsDrawing(false);
    setDragStart(null);
    setActiveHandle(null);
  };

  // Mouse Wheel (Pinch & Zoom centered at mouse cursor)
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.ctrlKey ? Math.exp(-e.deltaY * 0.01) : (e.deltaY < 0 ? 1.08 : 0.92);
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    onZoomChange(newZoom);
    onPanChange({ x: newPanX, y: newPanY });
  };

  // Double Click: edit sticky note or text
  const handleDoubleClick = (e) => {
    if (readOnly) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    for (let i = elements.length - 1; i >= 0; i--) {
      const elem = elements[i];
      if (elem.type === 'sticky' || elem.type === 'text') {
        const b = getElementBounds(elem);
        if (isPointInBounds(world.x, world.y, b)) {
          setEditingTextElement(elem);
          setEditingTextValue(elem.text || '');
          break;
        }
      }
    }
  };

  const handleFinishEditing = () => {
    if (editingTextElement) {
      onSaveElement({
        ...editingTextElement,
        text: editingTextValue
      });
      setEditingTextElement(null);
      setEditingTextValue('');
    }
  };

  // Floating Action Toolbar Position above selected element
  const floatingToolbarPos = selectedBounds
    ? {
        x: Math.max(20, Math.min(window.innerWidth - 220, worldToScreen(selectedBounds.minX, selectedBounds.minY).x)),
        y: Math.max(70, worldToScreen(selectedBounds.minX, selectedBounds.minY).y - 48)
      }
    : null;

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: hoveredHandleCursor
            ? hoveredHandleCursor
            : isPanning || activeTool === 'pan' || isSpacePressed
            ? 'grab'
            : activeTool === 'laser'
            ? 'crosshair'
            : activeTool === 'eraser'
            ? 'crosshair'
            : activeTool === 'select'
            ? 'default'
            : 'crosshair'
        }}
        className="w-full h-full block touch-none"
      />

      {/* Floating Action Bar above Selected Element */}
      {selectedElement && floatingToolbarPos && !editingTextElement && !readOnly && (
        <div
          className="absolute z-30 flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/95 dark:bg-[#0c121e]/95 border border-white/20 shadow-2xl backdrop-blur-md animate-in fade-in"
          style={{
            left: `${floatingToolbarPos.x}px`,
            top: `${floatingToolbarPos.y}px`
          }}
        >
          {/* Dimensions Badge */}
          <span className="text-[10px] font-mono font-bold text-slate-300 px-2 py-1 bg-white/[0.06] rounded-xl">
            {Math.round(selectedBounds.width)} × {Math.round(selectedBounds.height)} px
          </span>

          {/* Duplicate */}
          <button
            onClick={() => {
              const duplicated = {
                ...selectedElement,
                id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                x: (selectedElement.x ?? selectedElement.startX ?? 0) + 20,
                y: (selectedElement.y ?? selectedElement.startY ?? 0) + 20,
                zIndex: Date.now()
              };
              onSaveElement(duplicated);
              onSelectElement(duplicated.id);
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={13} />
          </button>

          {/* Delete Element */}
          <button
            onClick={() => {
              onRemoveElement(selectedElementId);
              onSelectElement(null);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl transition-all"
            title="Delete Selected (Del)"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Floating Inline Text Editor for Text/Sticky */}
      {editingTextElement && (
        <div
          className="absolute z-40 shadow-2xl rounded-2xl border-2 border-indigo-500 p-2.5 animate-in fade-in"
          style={{
            left: `${worldToScreen(editingTextElement.x, editingTextElement.y).x}px`,
            top: `${worldToScreen(editingTextElement.x, editingTextElement.y).y}px`,
            width: editingTextElement.type === 'sticky'
              ? `${Math.max(200, (editingTextElement.width || 180) * zoom)}px`
              : '280px',
            backgroundColor: editingTextElement.type === 'sticky'
              ? (editingTextElement.color || '#fef08a')
              : (isDark ? '#0f172a' : '#ffffff')
          }}
        >
          <textarea
            value={editingTextValue}
            maxLength={1000}
            onChange={(e) => setEditingTextValue(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleFinishEditing();
              }
            }}
            placeholder={editingTextElement.type === 'sticky' ? 'Type your note here...' : 'Type text...'}
            autoFocus
            rows={editingTextElement.type === 'sticky' ? 5 : 3}
            className={`w-full bg-transparent p-2 rounded-xl outline-none resize-none font-medium leading-relaxed ${
              editingTextElement.type === 'sticky'
                ? 'text-slate-900 placeholder:text-slate-600 text-base font-bold'
                : isDark ? 'text-white placeholder:text-slate-500 text-sm' : 'text-slate-900 placeholder:text-slate-400 text-sm'
            }`}
          />
          <div className="flex justify-between items-center pt-1.5 border-t border-black/10 dark:border-white/10">
            <span className="text-[10px] text-slate-500 font-medium">Ctrl+Enter to save</span>
            <button
              onClick={handleFinishEditing}
              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <Check size={12} />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
