// Utility to track and manage boards that the user joined (hosted by others)

const getStorageKey = (uid) => `tb_joined_boards_${uid}`;

export function getLocalJoinedBoards(uid) {
  if (!uid) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveJoinedBoardLocally(uid, board) {
  if (!uid || !board || board.ownerId === uid) return;
  try {
    const list = getLocalJoinedBoards(uid);
    const updated = [
      {
        id: board.id,
        title: board.title || 'Untitled FlowSpace',
        roomCode: board.roomCode || '',
        ownerName: board.ownerName || 'Host',
        ownerId: board.ownerId,
        joinedAt: Date.now(),
        background: board.background || 'dots'
      },
      ...list.filter(b => b.id !== board.id)
    ].slice(0, 30);
    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save joined board:', e);
    return [];
  }
}

export function removeJoinedBoardLocally(uid, boardId) {
  if (!uid || !boardId) return [];
  try {
    const list = getLocalJoinedBoards(uid);
    const updated = list.filter(b => b.id !== boardId);
    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
