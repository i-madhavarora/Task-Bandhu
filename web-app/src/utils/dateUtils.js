/**
 * Task Bandhu Date & Timezone Engine
 * Evaluates deadlines with exact local time and end-of-day offsets.
 */

export function getLocalTodayStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseTaskDeadline(deadline, endTime) {
  if (!deadline) return null;
  let d = null;

  if (typeof deadline === 'string') {
    const trimmed = deadline.trim();
    // 1. ISO format (e.g. 2026-11-06T12:00:00Z)
    if (trimmed.includes('T')) {
      const parsedIso = new Date(trimmed);
      if (!isNaN(parsedIso.getTime())) d = parsedIso;
    }
    // 2. YYYY-MM-DD standard format
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      const [y, m, day] = trimmed.split('-').map(Number);
      d = new Date(y, m - 1, day);
    }
    // 3. DD-MM-YYYY format
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
      const [p1, p2, y] = trimmed.split('-').map(Number);
      if (p1 > 12) {
        d = new Date(y, p2 - 1, p1);
      } else {
        d = new Date(y, p1 - 1, p2);
      }
    }
    // 4. MM/DD/YYYY or DD/MM/YYYY format
    else if (trimmed.includes('/')) {
      const parts = trimmed.split('/').map(Number);
      if (parts.length === 3) {
        if (String(parts[2]).length === 4) {
          const [p1, p2, y] = parts;
          if (p1 > 12) {
            d = new Date(y, p2 - 1, p1);
          } else {
            d = new Date(y, p1 - 1, p2);
          }
        } else if (String(parts[0]).length === 4) {
          d = new Date(parts[0], parts[1] - 1, parts[2]);
        }
      }
    }
  }

  if (!d || isNaN(d.getTime())) {
    d = new Date(deadline);
    if (isNaN(d.getTime())) return null;
  }

  // Exact time processing
  if (endTime && typeof endTime === 'string' && endTime.trim() !== '') {
    const isPM = endTime.toLowerCase().includes('pm');
    const isAM = endTime.toLowerCase().includes('am');
    const clean = endTime.replace(/[^\d:]/g, '').trim();
    const [hStr, mStr] = clean.split(':');
    let hours = parseInt(hStr || '23', 10);
    const minutes = parseInt(mStr || '59', 10);
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    d.setHours(hours, minutes, 0, 0);
  } else {
    // Default to the end of the day in local time
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

export function isTaskOverdue(task) {
  if (!task || !task.deadline || task.status === 'Completed') return false;
  const due = parseTaskDeadline(task.deadline, task.endTime);
  if (!due) return false;
  return due.getTime() < Date.now();
}

export function isTaskDueToday(task) {
  if (!task || !task.deadline || task.status === 'Completed') return false;
  if (isTaskOverdue(task)) return false;

  const due = parseTaskDeadline(task.deadline, task.endTime);
  if (!due) return false;

  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function isTaskDueTomorrow(task) {
  if (!task || !task.deadline || task.status === 'Completed') return false;
  if (isTaskOverdue(task) || isTaskDueToday(task)) return false;

  const due = parseTaskDeadline(task.deadline, task.endTime);
  if (!due) return false;
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return (
    due.getFullYear() === tomorrow.getFullYear() &&
    due.getMonth() === tomorrow.getMonth() &&
    due.getDate() === tomorrow.getDate()
  );
}

export function getTaskDueBucket(task) {
  if (!task || !task.deadline) return 'no_date';
  if (isTaskOverdue(task)) return 'overdue';
  if (isTaskDueToday(task)) return 'today';
  if (isTaskDueTomorrow(task)) return 'tomorrow';

  const due = parseTaskDeadline(task.deadline, task.endTime);
  if (!due) return 'no_date';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDateOnly - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 'this_week';
  return 'later';
}

export function formatDeadlineDisplay(deadline, endTime) {
  if (!deadline) return '';
  const due = parseTaskDeadline(deadline, endTime);
  if (!due) return deadline;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDateOnly - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Overdue';
  } else if (diffDays === 0) {
    return endTime ? `Today at ${endTime}` : 'Due Today';
  } else if (diffDays === 1) {
    return endTime ? `Tomorrow at ${endTime}` : 'Due Tomorrow';
  }
  return due.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
