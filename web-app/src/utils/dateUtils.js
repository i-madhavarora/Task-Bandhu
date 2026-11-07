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
  let year, month, day;

  if (typeof deadline === 'string') {
    const trimmed = deadline.trim();
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        } else if (parts[2].length === 4) {
          year = parseInt(parts[2], 10);
          month = parseInt(parts[0], 10) - 1;
          day = parseInt(parts[1], 10);
        }
      }
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          year = parseInt(parts[2], 10);
          month = parseInt(parts[0], 10) - 1;
          day = parseInt(parts[1], 10);
        } else if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        }
      }
    }
  }

  let d;
  if (year !== undefined && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
    d = new Date(year, month, day);
  } else {
    d = new Date(deadline);
    if (isNaN(d.getTime())) return null;
  }

  if (endTime && typeof endTime === 'string' && endTime.trim() !== '') {
    const isPM = endTime.toLowerCase().includes('pm');
    const isAM = endTime.toLowerCase().includes('am');
    const clean = endTime.replace(/[^\d:]/g, '').trim();
    const [hStr, mStr] = clean.split(':');
    let hours = parseInt(hStr || '23', 10);
    const minutes = parseInt(mStr || '59', 10);
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    d.setHours(hours, minutes, 59, 999);
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
  const due = parseTaskDeadline(task.deadline, task.endTime);
  if (!due) return false;
  if (due.getTime() < Date.now()) return false;

  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
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

