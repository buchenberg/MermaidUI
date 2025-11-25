import React from "react";
import "./ZoomControls.css";

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onExportSvg?: () => void;
  onExportMmd?: () => void;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
}

export default function ZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExportSvg,
  onExportMmd,
  minZoom = 0.3,
  maxZoom = 3.0,
  step = 0.1,
}: ZoomControlsProps) {
  const zoomPercentage = Math.round(zoomLevel * 100);
  const canZoomIn = zoomLevel < maxZoom;
  const canZoomOut = zoomLevel > minZoom;

  return (
    <div className="zoom-controls">
      <button
        className="zoom-btn zoom-out"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        −
      </button>

      <div className="zoom-display">
        <span className="zoom-percentage">{zoomPercentage}%</span>
      </div>

      <button
        className="zoom-btn zoom-in"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom In"
        aria-label="Zoom In"
      >
        +
      </button>

      <button
        className="zoom-btn zoom-reset"
        onClick={onResetZoom}
        title="Reset Zoom to 100%"
        aria-label="Reset Zoom"
      >
        100%
      </button>

      {onExportSvg && (
        <button
          className="zoom-btn zoom-export"
          onClick={onExportSvg}
          title="Export as SVG"
          aria-label="Export as SVG"
        >
          ⬇️
        </button>
      )}
      {onExportMmd && (
        <button
          className="zoom-btn zoom-export"
          onClick={onExportMmd}
          title="Export Mermaid Source"
          aria-label="Export Mermaid Source"
        >
          📝
        </button>
      )}
    </div>
  );
}
