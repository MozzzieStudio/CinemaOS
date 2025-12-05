/**
 * ZoomControls — Zoom slider and buttons for the editor
 * 
 * Provides 50%-200% zoom with keyboard shortcuts
 * Persists zoom level to localStorage
 */

import { useEffect } from 'react';

const STORAGE_KEY = 'cinema-os-editor-zoom';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function ZoomControls({ zoom, onZoomChange }: ZoomControlsProps) {
  const MIN_ZOOM = 50;
  const MAX_ZOOM = 200;
  const ZOOM_STEP = 10;

  // Load zoom from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedZoom = parseInt(saved, 10);
      if (savedZoom >= MIN_ZOOM && savedZoom <= MAX_ZOOM) {
        onZoomChange(savedZoom);
      }
    }
  }, []); // Only on mount

  // Save zoom to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, zoom.toString());
  }, [zoom]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP));
        } else if (e.key === '-') {
          e.preventDefault();
          onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP));
        } else if (e.key === '0') {
          e.preventDefault();
          onZoomChange(100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, onZoomChange]);

  const zoomIn = () => onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP));
  const zoomOut = () => onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP));
  const resetZoom = () => onZoomChange(100);

  return (
    <div className="flex items-center gap-1.5">
      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        disabled={zoom <= MIN_ZOOM}
        className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Zoom Out (Ctrl+-)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
        </svg>
      </button>

      {/* Zoom Slider */}
      <div className="relative group">
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-16 h-1 appearance-none bg-white/10 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-2.5
            [&::-webkit-slider-thumb]:h-2.5
            [&::-webkit-slider-thumb]:bg-violet-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-125"
        />
      </div>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        disabled={zoom >= MAX_ZOOM}
        className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Zoom In (Ctrl++)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Zoom Percentage */}
      <button
        onClick={resetZoom}
        className="min-w-[40px] px-1.5 py-0.5 text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 rounded transition-colors"
        title="Reset to 100% (Ctrl+0)"
      >
        {zoom}%
      </button>
    </div>
  );
}
