// Geometry & hit testing utilities for Task Bandhu FlowSpace

export function getDistance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Chaikin's algorithm for natural freehand stroke smoothing
export function smoothPoints(points, iterations = 2) {
  if (points.length <= 2) return points;
  let smoothed = [...points];

  for (let it = 0; it < iterations; it++) {
    const next = [smoothed[0]];
    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[i];
      const p1 = smoothed[i + 1];
      const q = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y
      };
      const r = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y
      };
      next.push(q, r);
    }
    next.push(smoothed[smoothed.length - 1]);
    smoothed = next;
  }
  return smoothed;
}

export function getElementBounds(elem) {
  if (elem.type === 'stroke' || elem.type === 'pen' || elem.type === 'highlighter') {
    if (!elem.points || elem.points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elem.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const padding = (elem.strokeWidth || 4) / 2;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      width: Math.max(1, maxX - minX + padding * 2),
      height: Math.max(1, maxY - minY + padding * 2)
    };
  }

  // Rect, Circle, Sticky, Text, Image
  const x = elem.x ?? Math.min(elem.startX ?? 0, elem.endX ?? 0);
  const y = elem.y ?? Math.min(elem.startY ?? 0, elem.endY ?? 0);
  const width = elem.width ?? Math.abs((elem.endX ?? 0) - (elem.startX ?? 0));
  const height = elem.height ?? Math.abs((elem.endY ?? 0) - (elem.startY ?? 0));

  return {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height,
    width: Math.max(1, width),
    height: Math.max(1, height)
  };
}

export function getResizeHandles(bounds) {
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midY = (bounds.minY + bounds.maxY) / 2;
  return [
    { id: 'tl', x: bounds.minX - 4, y: bounds.minY - 4, cursor: 'nwse-resize' },
    { id: 'tr', x: bounds.maxX + 4, y: bounds.minY - 4, cursor: 'nesw-resize' },
    { id: 'bl', x: bounds.minX - 4, y: bounds.maxY + 4, cursor: 'nesw-resize' },
    { id: 'br', x: bounds.maxX + 4, y: bounds.maxY + 4, cursor: 'nwse-resize' },
    { id: 't', x: midX, y: bounds.minY - 4, cursor: 'ns-resize' },
    { id: 'b', x: midX, y: bounds.maxY + 4, cursor: 'ns-resize' },
    { id: 'l', x: bounds.minX - 4, y: midY, cursor: 'ew-resize' },
    { id: 'r', x: bounds.maxX + 4, y: midY, cursor: 'ew-resize' }
  ];
}

export function hitTestHandle(px, py, bounds, threshold = 12) {
  const handles = getResizeHandles(bounds);
  for (const h of handles) {
    if (Math.hypot(px - h.x, py - h.y) <= threshold) {
      return h;
    }
  }
  return null;
}

export function isPointInBounds(px, py, bounds, threshold = 6) {
  return (
    px >= bounds.minX - threshold &&
    px <= bounds.maxX + threshold &&
    py >= bounds.minY - threshold &&
    py <= bounds.maxY + threshold
  );
}

// Distance from point to line segment
export function distToSegment(p, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return getDistance(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return getDistance(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  });
}

export function isPointNearStroke(px, py, points, threshold = 8) {
  const p = { x: px, y: py };
  for (let i = 0; i < points.length - 1; i++) {
    if (distToSegment(p, points[i], points[i + 1]) <= threshold) {
      return true;
    }
  }
  return false;
}

// Resize an element from a given handle
export function resizeElement(elem, handleId, dx, dy) {
  const minSize = 24;
  let updated = { ...elem };

  // For freehand pen, highlighter, and stroke paths with points
  if (elem.points && elem.points.length > 0) {
    const bounds = getElementBounds(elem);
    const oldWidth = Math.max(1, bounds.width);
    const oldHeight = Math.max(1, bounds.height);

    let newMinX = bounds.minX;
    let newMaxX = bounds.maxX;
    let newMinY = bounds.minY;
    let newMaxY = bounds.maxY;

    if (handleId.includes('r')) newMaxX = Math.max(bounds.minX + minSize, bounds.maxX + dx);
    if (handleId.includes('l')) newMinX = Math.min(bounds.maxX - minSize, bounds.minX + dx);
    if (handleId.includes('b')) newMaxY = Math.max(bounds.minY + minSize, bounds.maxY + dy);
    if (handleId.includes('t')) newMinY = Math.min(bounds.maxY - minSize, bounds.minY + dy);

    const newWidth = Math.max(minSize, newMaxX - newMinX);
    const newHeight = Math.max(minSize, newMaxY - newMinY);
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;

    const scaledPoints = elem.points.map(p => ({
      ...p,
      x: newMinX + (p.x - bounds.minX) * scaleX,
      y: newMinY + (p.y - bounds.minY) * scaleY
    }));

    updated.points = scaledPoints;
    return updated;
  }

  // For shapes with startX / endX
  if (elem.startX !== undefined && elem.endX !== undefined) {
    const left = Math.min(elem.startX, elem.endX);
    const right = Math.max(elem.startX, elem.endX);
    const top = Math.min(elem.startY, elem.endY);
    const bottom = Math.max(elem.startY, elem.endY);

    let newLeft = left;
    let newRight = right;
    let newTop = top;
    let newBottom = bottom;

    if (handleId.includes('l')) newLeft = Math.min(left + dx, right - minSize);
    if (handleId.includes('r')) newRight = Math.max(right + dx, left + minSize);
    if (handleId.includes('t')) newTop = Math.min(top + dy, bottom - minSize);
    if (handleId.includes('b')) newBottom = Math.max(bottom + dy, top + minSize);

    updated.startX = newLeft;
    updated.startY = newTop;
    updated.endX = newRight;
    updated.endY = newBottom;
    return updated;
  }

  // For sticky, text, image, rect with x, y, width, height
  let x = elem.x ?? 0;
  let y = elem.y ?? 0;
  let width = elem.width ?? 180;
  let height = elem.height ?? 160;

  if (handleId.includes('r')) {
    width = Math.max(minSize, width + dx);
  }
  if (handleId.includes('l')) {
    const nextWidth = Math.max(minSize, width - dx);
    x += (width - nextWidth);
    width = nextWidth;
  }
  if (handleId.includes('b')) {
    height = Math.max(minSize, height + dy);
  }
  if (handleId.includes('t')) {
    const nextHeight = Math.max(minSize, height - dy);
    y += (height - nextHeight);
    height = nextHeight;
  }

  updated.x = x;
  updated.y = y;
  updated.width = width;
  updated.height = height;

  if (elem.type === 'text') {
    // Proportional font sizing on resize
    const ratio = width / (elem.width || width);
    if (ratio > 0.5 && ratio < 3) {
      updated.fontSize = Math.round(Math.max(12, Math.min(72, (elem.fontSize || 20) * ratio)));
    }
  }

  return updated;
}
