// Export utilities: PNG (Standard & 4K UHD), SVG, PDF, and JSON backups
import { jsPDF } from 'jspdf';
import { renderElement } from './canvasRenderer';
import { getElementBounds } from './geometryUtils';

export function calculateContentBounds(elements) {
  if (!elements || elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  elements.forEach(elem => {
    const b = getElementBounds(elem);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  });

  const padding = 60;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: Math.max(200, (maxX - minX) + padding * 2),
    height: Math.max(200, (maxY - minY) + padding * 2)
  };
}

export function exportToPNG({ elements, isApex = false, is4K = false, isDark = true, filename = 'TaskBandhu-Whiteboard.png' }) {
  const bounds = calculateContentBounds(elements);
  const canvas = document.createElement('canvas');

  // Scale: 1 for standard, 3 for 4K UHD
  const scale = (isApex && is4K) ? 3 : 1.5;
  canvas.width = bounds.width * scale;
  canvas.height = bounds.height * scale;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(-bounds.minX, -bounds.minY);

  // Background
  ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
  ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);

  // Render elements
  elements.forEach(elem => renderElement(ctx, elem, false));

  // Watermark for Core users
  if (!isApex) {
    ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('✦ Made with Task Bandhu Whiteboard', bounds.maxX - 20, bounds.maxY - 20);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function exportToSVG({ elements, isApex = false, isDark = true, filename = 'TaskBandhu-Whiteboard.svg' }) {
  const bounds = calculateContentBounds(elements);
  const bg = isDark ? '#0b0f19' : '#ffffff';

  let svgElements = '';
  elements.forEach(elem => {
    if (elem.type === 'stroke' || elem.type === 'pen' || elem.type === 'highlighter') {
      if (!elem.points || elem.points.length < 2) return;
      const d = elem.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const opacity = elem.type === 'highlighter' ? '0.35' : '1';
      svgElements += `<path d="${d}" stroke="${elem.color || '#6366f1'}" stroke-width="${elem.strokeWidth || 4}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />\n`;
    } else if (elem.type === 'rect') {
      const x = Math.min(elem.startX, elem.endX);
      const y = Math.min(elem.startY, elem.endY);
      const w = Math.abs(elem.endX - elem.startX);
      const h = Math.abs(elem.endY - elem.startY);
      svgElements += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" stroke="${elem.color || '#6366f1'}" stroke-width="${elem.strokeWidth || 3}" fill="${elem.fill || 'none'}" />\n`;
    } else if (elem.type === 'circle') {
      const cx = (elem.startX + elem.endX) / 2;
      const cy = (elem.startY + elem.endY) / 2;
      const rx = Math.abs(elem.endX - elem.startX) / 2;
      const ry = Math.abs(elem.endY - elem.startY) / 2;
      svgElements += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke="${elem.color || '#6366f1'}" stroke-width="${elem.strokeWidth || 3}" fill="${elem.fill || 'none'}" />\n`;
    } else if (elem.type === 'arrow' || elem.type === 'line') {
      svgElements += `<line x1="${elem.startX}" y1="${elem.startY}" x2="${elem.endX}" y2="${elem.endY}" stroke="${elem.color || '#6366f1'}" stroke-width="${elem.strokeWidth || 3}" stroke-linecap="round" />\n`;
    } else if (elem.type === 'sticky') {
      svgElements += `<g transform="translate(${elem.x}, ${elem.y})">
        <rect width="${elem.width || 180}" height="${elem.height || 160}" rx="8" fill="${elem.color || '#fef08a'}" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
        <text x="14" y="44" font-family="Caveat, cursive" font-size="${elem.fontSize || 16}" fill="${elem.textColor || '#1c1917'}">${elem.text || ''}</text>
      </g>\n`;
    } else if (elem.type === 'text') {
      svgElements += `<text x="${elem.x}" y="${elem.y + 20}" font-family="Plus Jakarta Sans, sans-serif" font-size="${elem.fontSize || 20}" fill="${elem.color || '#e2e8f0'}">${elem.text || ''}</text>\n`;
    }
  });

  const watermark = !isApex ? `<text x="${bounds.maxX - 20}" y="${bounds.maxY - 20}" font-family="Plus Jakarta Sans, sans-serif" font-size="12" fill="rgba(150,150,150,0.5)" text-anchor="end">✦ Task Bandhu Whiteboard</text>` : '';

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}">
  <rect x="${bounds.minX}" y="${bounds.minY}" width="${bounds.width}" height="${bounds.height}" fill="${bg}" />
  ${svgElements}
  ${watermark}
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export function exportToPDF({ elements, isApex = false, isDark = true, filename = 'TaskBandhu-Whiteboard.pdf' }) {
  const bounds = calculateContentBounds(elements);
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = bounds.width * scale;
  canvas.height = bounds.height * scale;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(-bounds.minX, -bounds.minY);

  ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
  ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);

  elements.forEach(elem => renderElement(ctx, elem, false));

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const orientation = bounds.width >= bounds.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [bounds.width, bounds.height]
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, bounds.width, bounds.height);
  pdf.save(filename);
}

export function exportToJSON({ boardData, elements, filename = 'TaskBandhu-Whiteboard.json' }) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    board: boardData,
    elements
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

