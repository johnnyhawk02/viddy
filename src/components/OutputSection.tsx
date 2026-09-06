import React from 'react';
import { VideoOutput } from '../types';

interface OutputSectionProps {
  output: VideoOutput;
  onReset: () => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({ output, onReset }) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = output.url;
    a.download = output.filename || 'rendered-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <fieldset
      id="output-video-section"
      className="web1-fieldset mt-4"
    >
      <legend className="web1-legend">3. Generated MP4 Video File</legend>

      {/* Video player preview */}
      <div className="border border-black bg-black p-1 aspect-video max-h-[340px] flex items-center justify-center mx-auto mb-3">
        <video
          id="output-video-player"
          src={output.url}
          controls
          autoPlay
          loop
          playsInline
          className="w-full h-full object-contain"
        />
      </div>

      {/* Details & Download action */}
      <div className="border border-[#cccccc] bg-[#f9f9f9] p-3 text-xs font-serif">
        <table className="w-full text-xs font-serif mb-3">
          <tbody>
            <tr>
              <td className="w-28 font-bold pr-2">File Name:</td>
              <td className="font-mono">{output.filename}</td>
            </tr>
            <tr>
              <td className="font-bold pr-2">File Size:</td>
              <td className="font-mono">{formatSize(output.size)}</td>
            </tr>
            <tr>
              <td className="font-bold pr-2">Video Specs:</td>
              <td className="font-mono">H.264 Baseline, 1 FPS, AAC Stereo</td>
            </tr>
          </tbody>
        </table>

        <div className="flex items-center gap-3 pt-2 border-t border-[#dddddd]">
          <button
            id="btn-download-video"
            type="button"
            onClick={handleDownload}
            className="web1-btn font-bold text-sm px-4 py-1"
          >
            💾 Download MP4 Video
          </button>
          <button
            id="btn-create-another"
            type="button"
            onClick={onReset}
            className="web1-btn text-xs px-3 py-1"
          >
            Convert Another File
          </button>
        </div>
      </div>
    </fieldset>
  );
};
