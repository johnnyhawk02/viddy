const TASTEFUL_COLORS = [
  '#09090b', // pure dark
  '#18181b', // zinc
  '#1e293b', // slate
  '#0f172a', // midnight
  '#14281d', // pine
  '#1e1b4b', // deep indigo
  '#2a1b18', // espresso
  '#1f2937', // cool gray
  '#1c1917', // warm stone
  '#164e63', // deep cyan
  '#31103f', // dark plum
  '#262626', // neutral charcoal
  '#0d2818', // forest
  '#111827', // obsidian
  '#282c34', // dark metallic
  '#1b1c1e', // obsidian ink
];

export function getRandomColor(): string {
  const index = Math.floor(Math.random() * TASTEFUL_COLORS.length);
  return TASTEFUL_COLORS[index];
}

export async function generateCoverImage(
  trackName: string,
  bgColor?: string
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const color = bgColor || getRandomColor();

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clean track name formatting (strip file extension)
  const cleanName = trackName.replace(/\.[^/.]+$/, '').trim() || 'Untitled Track';

  // Tasteful typography: JetBrains Mono
  const maxLineWidth = 1400;
  let fontSize = 56;
  ctx.font = `500 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;

  // Split into lines if needed for clean layout
  const words = cleanName.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Cap at maximum 3 lines with ellipsis if too long
  if (lines.length > 3) {
    lines.splice(2);
    lines[1] = lines[1] + '...';
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

  // Minimalist dot marker above track name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, startY - lineHeight / 2 - 32, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw track name lines
  ctx.fillStyle = '#f4f4f5';
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        const file = new File([blob], `${cleanName}-cover.png`, {
          type: 'image/png',
          lastModified: Date.now(),
        });
        resolve(file);
      },
      'image/png',
      1.0
    );
  });
}

