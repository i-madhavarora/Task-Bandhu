// High-performance 60fps canvas renderer for Task Bandhu Whiteboard
import { smoothPoints, getElementBounds } from './geometryUtils';

const imageCache = new Map();

function getCachedImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const img = new Image();
  img.src = src;
  img.onload = () => { imageCache.set(src, img); };
  imageCache.set(src, img);
  return img;
}

export function renderBackground(ctx, width, height, pan, zoom, style = 'dots', isDark = true) {
  ctx.save();
  // Clear
  ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  const viewLeft = -pan.x / zoom;
  const viewTop = -pan.y / zoom;
  const viewRight = viewLeft + width / zoom;
  const viewBottom = viewTop + height / zoom;

  const gridSize = 32;
  const startX = Math.floor(viewLeft / gridSize) * gridSize;
  const startY = Math.floor(viewTop / gridSize) * gridSize;

  if (style === 'dots') {
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)';
    const dotRadius = Math.max(1, 1.2 / zoom);
    for (let x = startX; x <= viewRight; x += gridSize) {
      for (let y = startY; y <= viewBottom; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (style === 'grid') {
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= viewRight; x += gridSize) {
      ctx.moveTo(x, viewTop);
      ctx.lineTo(x, viewBottom);
    }
    for (let y = startY; y <= viewBottom; y += gridSize) {
      ctx.moveTo(viewLeft, y);
      ctx.lineTo(viewRight, y);
    }
    ctx.stroke();
  } else if (style === 'lines') {
    ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let y = startY; y <= viewBottom; y += gridSize) {
      ctx.moveTo(viewLeft, y);
      ctx.lineTo(viewRight, y);
    }
    ctx.stroke();
  } else if (style === 'isometric') {
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.05)';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    const isoSize = gridSize * 1.5;
    for (let x = startX - (viewBottom - viewTop); x <= viewRight; x += isoSize) {
      ctx.moveTo(x, viewTop);
      ctx.lineTo(x + (viewBottom - viewTop) * 0.577, viewBottom);
      ctx.moveTo(x, viewBottom);
      ctx.lineTo(x + (viewBottom - viewTop) * 0.577, viewTop);
    }
    ctx.stroke();
  }

  ctx.restore();
}

export function renderElement(ctx, elem, isSelected = false) {
  ctx.save();

  if (elem.type === 'stroke' || elem.type === 'pen') {
    if (!elem.points || elem.points.length === 0) {
      ctx.restore();
      return;
    }
    if (elem.points.length === 1) {
      ctx.fillStyle = elem.color || '#6366f1';
      ctx.beginPath();
      ctx.arc(elem.points[0].x, elem.points[0].y, Math.max(2, (elem.strokeWidth || 4) / 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    const smoothed = elem.points.length > 3 ? smoothPoints(elem.points) : elem.points;
    ctx.strokeStyle = elem.color || '#6366f1';
    ctx.lineWidth = elem.strokeWidth || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);
    for (let i = 1; i < smoothed.length - 1; i++) {
      const xc = (smoothed[i].x + smoothed[i + 1].x) / 2;
      const yc = (smoothed[i].y + smoothed[i + 1].y) / 2;
      ctx.quadraticCurveTo(smoothed[i].x, smoothed[i].y, xc, yc);
    }
    ctx.lineTo(smoothed[smoothed.length - 1].x, smoothed[smoothed.length - 1].y);
    ctx.stroke();
  } else if (elem.type === 'highlighter') {
    if (!elem.points || elem.points.length < 2) {
      ctx.restore();
      return;
    }
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = elem.color || '#facc15';
    ctx.lineWidth = elem.strokeWidth || 20;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(elem.points[0].x, elem.points[0].y);
    for (let i = 1; i < elem.points.length; i++) {
      ctx.lineTo(elem.points[i].x, elem.points[i].y);
    }
    ctx.stroke();
  } else if (elem.type === 'rect') {
    const x = Math.min(elem.startX, elem.endX);
    const y = Math.min(elem.startY, elem.endY);
    const w = Math.abs(elem.endX - elem.startX);
    const h = Math.abs(elem.endY - elem.startY);
    const radius = Math.min(12, Math.min(w, h) / 4);

    ctx.lineWidth = elem.strokeWidth || 3;
    ctx.strokeStyle = elem.color || '#6366f1';
    if (elem.fill && elem.fill !== 'transparent') {
      ctx.fillStyle = elem.fill;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();
  } else if (elem.type === 'circle') {
    const startX = elem.startX;
    const startY = elem.startY;
    const endX = elem.endX;
    const endY = elem.endY;
    const cx = (startX + endX) / 2;
    const cy = (startY + endY) / 2;
    const rx = Math.abs(endX - startX) / 2;
    const ry = Math.abs(endY - startY) / 2;

    ctx.lineWidth = elem.strokeWidth || 3;
    ctx.strokeStyle = elem.color || '#6366f1';
    if (elem.fill && elem.fill !== 'transparent') {
      ctx.fillStyle = elem.fill;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (elem.type === 'arrow' || elem.type === 'line') {
    ctx.lineWidth = elem.strokeWidth || 3;
    ctx.strokeStyle = elem.color || '#6366f1';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(elem.startX, elem.startY);
    ctx.lineTo(elem.endX, elem.endY);
    ctx.stroke();

    if (elem.type === 'arrow') {
      const angle = Math.atan2(elem.endY - elem.startY, elem.endX - elem.startX);
      const headLength = Math.max(12, (elem.strokeWidth || 3) * 3);
      ctx.fillStyle = elem.color || '#6366f1';
      ctx.beginPath();
      ctx.moveTo(elem.endX, elem.endY);
      ctx.lineTo(
        elem.endX - headLength * Math.cos(angle - Math.PI / 6),
        elem.endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        elem.endX - headLength * Math.cos(angle + Math.PI / 6),
        elem.endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
  } else if (elem.type === 'diamond') {
    const minX = Math.min(elem.startX, elem.endX);
    const minY = Math.min(elem.startY, elem.endY);
    const w = Math.abs(elem.endX - elem.startX);
    const h = Math.abs(elem.endY - elem.startY);
    const cx = minX + w / 2;
    const cy = minY + h / 2;

    ctx.lineWidth = elem.strokeWidth || 3;
    ctx.strokeStyle = elem.color || '#6366f1';
    ctx.beginPath();
    ctx.moveTo(cx, minY);
    ctx.lineTo(minX + w, cy);
    ctx.lineTo(cx, minY + h);
    ctx.lineTo(minX, cy);
    ctx.closePath();
    if (elem.fill && elem.fill !== 'transparent') {
      ctx.fillStyle = elem.fill;
      ctx.fill();
    }
    ctx.stroke();
  } else if (elem.type === 'star') {
    const minX = Math.min(elem.startX, elem.endX);
    const minY = Math.min(elem.startY, elem.endY);
    const w = Math.abs(elem.endX - elem.startX);
    const h = Math.abs(elem.endY - elem.startY);
    const cx = minX + w / 2;
    const cy = minY + h / 2;
    const rOuter = Math.min(w, h) / 2;
    const rInner = rOuter / 2;
    const points = 5;

    ctx.lineWidth = elem.strokeWidth || 3;
    ctx.strokeStyle = elem.color || '#6366f1';
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (elem.fill && elem.fill !== 'transparent') {
      ctx.fillStyle = elem.fill;
      ctx.fill();
    }
    ctx.stroke();
  } else if (elem.type === 'sticky') {
    const x = elem.x;
    const y = elem.y;
    const w = elem.width || 180;
    const h = elem.height || 160;
    const bg = elem.color || '#fef08a'; // Pastel Yellow default

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.restore();

    // Top subtle bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 24, [8, 8, 0, 0]);
    ctx.fill();

    // Sticky Text
    ctx.fillStyle = elem.textColor || '#1c1917';
    ctx.font = `${elem.fontSize || 16}px 'Caveat', cursive, sans-serif`;
    ctx.textBaseline = 'top';

    const text = elem.text || '';
    if (!text.trim()) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Type your note...', x + 14, y + 32);
    } else {
      const lines = text.split('\n');
      let lineY = y + 32;
      const maxLineW = w - 24;

      for (const rawLine of lines) {
        const words = rawLine.split(' ');
        let curLine = '';
        for (const word of words) {
          const testLine = curLine ? `${curLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxLineW && curLine) {
            ctx.fillText(curLine, x + 14, lineY);
            lineY += 22;
            curLine = word;
          } else {
            curLine = testLine;
          }
        }
        if (curLine) {
          ctx.fillText(curLine, x + 14, lineY);
          lineY += 22;
        }
      }
    }
  } else if (elem.type === 'text') {
    ctx.fillStyle = elem.color || '#e2e8f0';
    const isBold = elem.bold ? 'bold ' : '';
    const isItalic = elem.italic ? 'italic ' : '';
    const size = elem.fontSize || 20;
    ctx.font = `${isItalic}${isBold}${size}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textBaseline = 'top';

    const text = elem.text || 'Text';
    const lines = text.split('\n');
    const x = elem.x;
    let y = elem.y;
    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += size * 1.35;
    }
  } else if (elem.type === 'image') {
    if (elem.src) {
      const img = getCachedImage(elem.src);
      if (img && img.complete) {
        ctx.drawImage(img, elem.x, elem.y, elem.width, elem.height);
      }
    }
  }

  // Draw selection bounding box if selected
  if (isSelected) {
    const b = getElementBounds(elem);
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(b.minX - 4, b.minY - 4, b.width + 8, b.height + 8);

    // Transform corner & edge handles
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    const handleRadius = 4.5;
    const midX = (b.minX + b.maxX) / 2;
    const midY = (b.minY + b.maxY) / 2;
    const handles = [
      { x: b.minX - 4, y: b.minY - 4 },
      { x: b.maxX + 4, y: b.minY - 4 },
      { x: b.maxX + 4, y: b.maxY + 4 },
      { x: b.minX - 4, y: b.maxY + 4 },
      { x: midX, y: b.minY - 4 },
      { x: midX, y: b.maxY + 4 },
      { x: b.minX - 4, y: midY },
      { x: b.maxX + 4, y: midY }
    ];
    handles.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, handleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  ctx.restore();
}

export function renderLaserTrail(ctx, trail, color = '#f43f5e') {
  if (!trail || trail.length < 2) return;
  const now = Date.now();
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < trail.length - 1; i++) {
    const p1 = trail[i];
    const p2 = trail[i + 1];
    const age = now - p2.timestamp;
    if (age > 1500) continue; // Fades out completely after 1.5 seconds

    const alpha = Math.max(0, 1 - age / 1500);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, 6 * alpha);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * alpha;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Laser Pointer head glow
  const head = trail[trail.length - 1];
  if (head && now - head.timestamp <= 1500) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function renderRemoteCursor(ctx, presence) {
  if (!presence || !presence.cursor) return;
  const { x, y } = presence.cursor;
  const color = presence.color || '#6366f1';
  const name = presence.name || 'Anonymous';

  ctx.save();
  ctx.translate(x, y);

  // Sleek SVG-style cursor arrow
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 15);
  ctx.lineTo(4, 11);
  ctx.lineTo(9, 17);
  ctx.lineTo(11, 15);
  ctx.lineTo(6, 9);
  ctx.lineTo(12, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Name tag badge
  ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
  const textWidth = ctx.measureText(name).width;
  const badgeWidth = textWidth + 14;
  const badgeHeight = 20;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(14, 10, badgeWidth, badgeHeight, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 21, 20);

  ctx.restore();
}

