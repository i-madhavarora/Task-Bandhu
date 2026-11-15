// Undo / Redo history management for Task Bandhu Whiteboard
import { useState, useCallback } from 'react';

export function useCanvasHistory(maxSteps = 50) {
  const [history, setHistory] = useState([]);
  const [stepIndex, setStepIndex] = useState(-1);

  const pushState = useCallback((action) => {
    // action: { type: 'add' | 'modify' | 'delete', element, prevElement }
    setHistory(prev => {
      const upToCurrent = prev.slice(0, stepIndex + 1);
      const newHistory = [...upToCurrent, action];
      if (newHistory.length > maxSteps) {
        newHistory.shift();
      }
      return newHistory;
    });
    setStepIndex(prev => Math.min(prev + 1, maxSteps - 1));
  }, [stepIndex, maxSteps]);

  const canUndo = stepIndex >= 0;
  const canRedo = stepIndex < history.length - 1;

  const getUndoAction = useCallback(() => {
    if (!canUndo) return null;
    const action = history[stepIndex];
    setStepIndex(prev => prev - 1);
    return action;
  }, [canUndo, history, stepIndex]);

  const getRedoAction = useCallback(() => {
    if (!canRedo) return null;
    const nextIndex = stepIndex + 1;
    const action = history[nextIndex];
    setStepIndex(nextIndex);
    return action;
  }, [canRedo, history, stepIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setStepIndex(-1);
  }, []);

  return {
    pushState,
    canUndo,
    canRedo,
    getUndoAction,
    getRedoAction,
    clearHistory
  };
}

