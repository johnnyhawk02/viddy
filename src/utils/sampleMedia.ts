/**
 * Utilities to generate instant sample image and sample audio
 * for quick 1-click testing without external network downloads.
 */

export function createSampleImage(): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(0.5, '#18181b');
    grad.addColorStop(1, '#09090b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Glowing circle
    const radial = ctx.createRadialGradient(640, 360, 50, 640, 360, 420);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    radial.addColorStop(0.5, 'rgba(161, 161, 170, 0.08)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(640, 360, 420, 0, Math.PI * 2);
    ctx.fill();

    // Geometric accent ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(640, 360, 180, 0, Math.PI * 2);
    ctx.stroke();

    // Inner filled core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(640, 360, 8, 0, Math.PI * 2);
    ctx.fill();

    // Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1FPS VIDEO GENERATOR', 640, 420);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '400 15px monospace';
    ctx.fillText('1280 × 720 · STILL FRAME', 640, 450);

    canvas.toBlob((blob) => {
      const file = new File([blob!], 'sample-artwork.png', { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

export async function createSampleAudio(): Promise<File> {
  const sampleRate = 44100;
  const durationSec = 6;
  const numSamples = sampleRate * durationSec;

  const offlineCtx = new OfflineAudioContext(2, numSamples, sampleRate);

  // Play a soft chord (C minor 9: C3, G3, Eb4, Bb4, D5)
  const freqs = [130.81, 196.0, 311.13, 466.16, 587.33];

  freqs.forEach((freq, idx) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, 0);

    // Fade in and out
    gain.gain.setValueAtTime(0.001, 0);
    gain.gain.exponentialRampToValueAtTime(0.12 / freqs.length, 1.2);
    gain.gain.setValueAtTime(0.12 / freqs.length, durationSec - 2);
    gain.gain.exponentialRampToValueAtTime(0.0001, durationSec);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(0);
    osc.stop(durationSec);
  });

  const renderedBuffer = await offlineCtx.startRendering();

  // Encode AudioBuffer to WAV format
  const wavBytes = audioBufferToWav(renderedBuffer);
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  return new File([blob], 'sample-audio.wav', { type: 'audio/wav' });
}

function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  out.setUint32(0, 0x46464952, true); // 'RIFF'
  setUint32(length - 8);
  out.setUint32(pos, 0x45564157, true); // 'WAVE'
  pos += 4;

  // fmt sub-chunk
  out.setUint32(pos, 0x20746d66, true); // 'fmt '
  pos += 4;
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  out.setUint32(pos, 0x61746164, true); // 'data'
  pos += 4;
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Uint8Array(out.buffer);
}
