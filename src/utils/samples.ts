/**
 * Helper to generate sample image and audio files for immediate demo testing
 */

export function createSampleImage(): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Fallback 1x1
      return resolve(new File([new Uint8Array([0])], 'sample-artwork.png', { type: 'image/png' }));
    }

    // Rich dark background
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Subtle decorative grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1280; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = 0; y < 720; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Modern album card box
    const cardX = 400;
    const cardY = 160;
    const cardW = 480;
    const cardH = 400;

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();

    // Central circular glow
    const radial = ctx.createRadialGradient(640, 310, 10, 640, 310, 140);
    radial.addColorStop(0, 'rgba(99, 102, 241, 0.6)');
    radial.addColorStop(0.6, 'rgba(14, 165, 233, 0.3)');
    radial.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(640, 310, 140, 0, Math.PI * 2);
    ctx.fill();

    // Sound wave graphic in center
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const bars = [25, 45, 70, 110, 85, 130, 95, 140, 100, 120, 60, 35];
    const spacing = 18;
    const startX = 640 - (bars.length * spacing) / 2;
    bars.forEach((height, i) => {
      const bx = startX + i * spacing;
      ctx.beginPath();
      ctx.moveTo(bx, 310 - height / 2);
      ctx.lineTo(bx, 310 + height / 2);
      ctx.stroke();
    });

    // Text labels
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ambient Waves', 640, 480);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Original Soundtrack • 2026', 640, 515);

    // Top watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText('FFMPEG WASM VIDEO RENDERER', 640, 90);

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'sample-artwork.png', { type: 'image/png' }));
      } else {
        resolve(new File([new Uint8Array(0)], 'sample-artwork.png', { type: 'image/png' }));
      }
    }, 'image/png');
  });
}

export function createSampleAudio(): Promise<File> {
  return new Promise((resolve) => {
    // Generate a 4-second WAV audio file with clean chime/harmonics using standard PCM
    const sampleRate = 44100;
    const duration = 4.0;
    const totalSamples = Math.floor(sampleRate * duration);
    const audioData = new Float32Array(totalSamples);

    // Frequencies for an ambient chord (C4, E4, G4, B4)
    const freqs = [261.63, 329.63, 392.0, 493.88];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      freqs.forEach((f, idx) => {
        const env = Math.exp(-t * (0.8 + idx * 0.2));
        sample += Math.sin(2 * Math.PI * f * t) * env * 0.22;
      });
      // Add subtle warm sub bass
      sample += Math.sin(2 * Math.PI * 130.81 * t) * Math.exp(-t * 0.6) * 0.2;
      audioData[i] = Math.max(-1, Math.min(1, sample));
    }

    // Encode to 16-bit PCM WAV
    const wavBuffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(wavBuffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat 1 = PCM
    view.setUint16(22, 1, true); // NumChannels = 1 (mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    resolve(new File([blob], 'sample-melody.wav', { type: 'audio/wav' }));
  });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
