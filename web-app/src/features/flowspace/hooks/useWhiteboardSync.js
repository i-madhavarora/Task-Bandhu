// Real-time Firestore synchronization for Task Bandhu Whiteboard
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export function useWhiteboardSync(boardId, currentUser) {
  const [boardData, setBoardData] = useState(null);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const elementsMapRef = useRef(new Map());
  const activeBoardIdRef = useRef(boardId);

  // Keep track of active boardId synchronously to reject stale writes
  if (activeBoardIdRef.current !== boardId) {
    activeBoardIdRef.current = boardId;
    elementsMapRef.current.clear();
  }

  // Subscribe to board metadata
  useEffect(() => {
    setBoardData(null);
    setError(null);
    if (!boardId) return;
    const boardRef = doc(db, 'whiteboards', boardId);
    const unsubscribe = onSnapshot(
      boardRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBoardData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Whiteboard not found or has been deleted');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching whiteboard metadata:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [boardId]);

  // Subscribe to elements subcollection with real-time syncing
  useEffect(() => {
    // Immediately clear stale elements when boardId changes
    elementsMapRef.current.clear();
    setElements([]);
    if (!boardId) return;

    const elementsRef = collection(db, 'whiteboards', boardId, 'elements');
    const unsubscribe = onSnapshot(
      elementsRef,
      (snapshot) => {
        const newMap = new Map();
        snapshot.forEach((docSnap) => {
          newMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
        elementsMapRef.current = newMap;

        // Convert map to sorted array based on zIndex or createdAt
        const list = Array.from(newMap.values()).sort(
          (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
        );
        setElements(list);
      },
      (err) => {
        console.error('Error listening to whiteboard elements:', err);
      }
    );

    return () => {
      unsubscribe();
      elementsMapRef.current.clear();
      setElements([]);
    };
  }, [boardId]);

  // Save or update an element
  const saveElement = useCallback(async (elem) => {
    if (!boardId || boardId !== activeBoardIdRef.current) return;
    // Authority verification: Non-owners with viewer role or during lock cannot make any changes
    const isOwner = currentUser && boardData && boardData.ownerId === currentUser.uid;
    const memberRole = boardData?.members?.[currentUser?.uid]?.role;
    if (!isOwner && (boardData?.isLocked || memberRole === 'viewer')) {
      console.warn('Action rejected: Viewer cannot make changes without host permission.');
      return;
    }
    const elemId = elem.id || `elem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const elemWithId = {
      ...elem,
      id: elemId,
      updatedBy: currentUser?.uid || 'anonymous',
      updatedAt: Date.now()
    };

    // Optimistic local update
    elementsMapRef.current.set(elemId, elemWithId);
    setElements(Array.from(elementsMapRef.current.values()));

    try {
      const elemRef = doc(db, 'whiteboards', boardId, 'elements', elemId);
      const cleaned = JSON.parse(JSON.stringify(elemWithId));
      await setDoc(elemRef, cleaned);
    } catch (err) {
      console.error('Failed to sync element to Firestore:', err);
    }
  }, [boardId, currentUser, boardData]);

  // Delete an element
  const removeElement = useCallback(async (elemId) => {
    if (!boardId || !elemId) return;
    const isOwner = currentUser && boardData && boardData.ownerId === currentUser.uid;
    const memberRole = boardData?.members?.[currentUser?.uid]?.role;
    if (!isOwner && (boardData?.isLocked || memberRole === 'viewer')) {
      console.warn('Action rejected: Viewer cannot make changes without host permission.');
      return;
    }
    elementsMapRef.current.delete(elemId);
    setElements(Array.from(elementsMapRef.current.values()));

    try {
      const elemRef = doc(db, 'whiteboards', boardId, 'elements', elemId);
      await deleteDoc(elemRef);
    } catch (err) {
      console.error('Failed to delete element from Firestore:', err);
    }
  }, [boardId, currentUser, boardData]);

  // Clear all elements (Owner only)
  const clearAllElements = useCallback(async () => {
    if (!boardId) return;
    const isOwner = currentUser && boardData && boardData.ownerId === currentUser.uid;
    if (!isOwner) {
      console.warn('Only the owner has authority to clear the canvas.');
      return;
    }
    const batch = writeBatch(db);
    elementsMapRef.current.forEach((_, id) => {
      const ref = doc(db, 'whiteboards', boardId, 'elements', id);
      batch.delete(ref);
    });
    elementsMapRef.current.clear();
    setElements([]);
    try {
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear canvas:', err);
    }
  }, [boardId]);

  // Update board metadata (title, lock, background, members)
  const updateBoard = useCallback(async (fields) => {
    if (!boardId) return;
    try {
      const boardRef = doc(db, 'whiteboards', boardId);
      await updateDoc(boardRef, {
        ...fields,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to update board metadata:', err);
    }
  }, [boardId]);

  return {
    boardData,
    elements,
    loading,
    error,
    saveElement,
    removeElement,
    clearAllElements,
    updateBoard
  };
}

