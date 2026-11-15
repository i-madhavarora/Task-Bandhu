// Real-time cursor presence & laser pointer synchronization
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { getRandomColor } from '../utils/planLimits';

export function usePresence(boardId, currentUser, isOwner = false, canEdit = true) {
  const [presenceList, setPresenceList] = useState([]);
  const userColorRef = useRef(getRandomColor(currentUser?.uid || 'guest'));
  const lastUpdateRef = useRef(0);
  const isOwnerRef = useRef(isOwner);
  const canEditRef = useRef(canEdit);

  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  useEffect(() => {
    canEditRef.current = canEdit;
  }, [canEdit]);

  // If editing permissions revoked (e.g. Host set to viewer or locked canvas), immediately clear cursor
  useEffect(() => {
    if (!canEdit && boardId && currentUser) {
      const selfDoc = doc(db, 'whiteboards', boardId, 'presence', currentUser.uid);
      setDoc(selfDoc, {
        cursor: null,
        laserTrail: [],
        canEdit: false
      }, { merge: true }).catch(() => {});
    }
  }, [canEdit, boardId, currentUser?.uid]);

  // Subscribe to live presences
  useEffect(() => {
    if (!boardId || !currentUser) return;
    const presenceRef = collection(db, 'whiteboards', boardId, 'presence');
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const presences = [];
      const now = Date.now();
      snapshot.forEach((d) => {
        const data = d.data();
        // Ignore self and stale presences older than 45 seconds
        if (d.id !== currentUser.uid && now - (data.lastPing || 0) < 45000) {
          presences.push({ uid: d.id, ...data });
        }
      });
      setPresenceList(presences);
    });

    // Initial ping & periodic heartbeat (every 6s)
    const sendHeartbeat = () => {
      const now = Date.now();
      const selfDoc = doc(db, 'whiteboards', boardId, 'presence', currentUser.uid);
      setDoc(selfDoc, {
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Member',
        color: userColorRef.current,
        isOwner: Boolean(isOwnerRef.current),
        canEdit: Boolean(canEditRef.current),
        lastPing: now
      }, { merge: true }).catch(() => {});

      if (isOwnerRef.current) {
        const boardRef = doc(db, 'whiteboards', boardId);
        updateDoc(boardRef, {
          ownerActive: true,
          ownerLastActive: now
        }).catch(() => {});
      }
    };

    sendHeartbeat();
    const heartbeatTimer = setInterval(sendHeartbeat, 6000);

    // Cleanup self on unmount or beforeunload
    const handleUnload = () => {
      try {
        const selfDoc = doc(db, 'whiteboards', boardId, 'presence', currentUser.uid);
        deleteDoc(selfDoc);
        if (isOwnerRef.current) {
          const boardRef = doc(db, 'whiteboards', boardId);
          updateDoc(boardRef, {
            ownerActive: false,
            ownerLastActive: 0
          }).catch(() => {});
        }
      } catch (e) {
        // Ignored
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeatTimer);
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [boardId, currentUser?.uid]);

  // Update self presence (throttled to 50ms for 20fps smooth cursor movement)
  // Only broadcast cursor if user has write/edit permissions
  const updatePresence = useCallback((cursorPos, laserTrail = null) => {
    if (!boardId || !currentUser) return;
    const now = Date.now();
    if (now - lastUpdateRef.current < 45 && !laserTrail && cursorPos) return;
    lastUpdateRef.current = now;

    const selfRef = doc(db, 'whiteboards', boardId, 'presence', currentUser.uid);
    // If not permitted to edit, do not broadcast cursor
    const finalCursor = canEditRef.current ? cursorPos : null;
    const finalLaser = canEditRef.current ? (laserTrail || []) : [];

    setDoc(selfRef, {
      cursor: finalCursor,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Member',
      color: userColorRef.current,
      laserTrail: finalLaser,
      isOwner: Boolean(isOwnerRef.current),
      canEdit: Boolean(canEditRef.current),
      lastPing: now
    }, { merge: true }).catch(() => {});
  }, [boardId, currentUser]);

  return {
    presenceList,
    userColor: userColorRef.current,
    updatePresence
  };
}

