import { useState } from 'react';
import './ExportProgressModal.css';

interface ExportProgressModalProps {
  isOpen: boolean;
  format: 'svg' | 'png' | 'pdf' | null;
  diagramName: string;
  status: 'idle' | 'preparing' | 'generating' | 'complete' | 'error';
  downloadUrl: string | null;
  errorMessage: string | null;
  onClose: () => void;
  onDownload: () => void;
}

export default function ExportProgressModal({
  isOpen,
  format,
  diagramName,
  status,
  downloadUrl,
  errorMessage,
  onClose,
  onDownload,
}: ExportProgressModalProps) {
  if (!isOpen) return null;

  const formatLabel = format?.toUpperCase() || '';

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="export-modal-title">Exporting as {formatLabel}</h3>
        
        <div className="export-status">
          {status === 'preparing' && (
            <div className="status-item">
              <div className="status-indicator preparing"></div>
              <span>Preparing export...</span>
            </div>
          )}
          {status === 'generating' && (
            <>
              <div className="status-item completed">
                <div className="status-indicator completed"></div>
                <span>Prepared</span>
              </div>
              <div className="status-item">
                <div className="status-indicator generating"></div>
                <span>Generating {formatLabel}...</span>
              </div>
            </>
          )}
          {status === 'complete' && (
            <>
              <div className="status-item completed">
                <div className="status-indicator completed"></div>
                <span>Prepared</span>
              </div>
              <div className="status-item completed">
                <div className="status-indicator completed"></div>
                <span>Generated</span>
              </div>
              <div className="status-item completed">
                <div className="status-indicator completed"></div>
                <span>Ready for download</span>
              </div>
            </>
          )}
          {status === 'error' && (
            <div className="status-item error">
              <div className="status-indicator error"></div>
              <span>Export failed: {errorMessage || 'Unknown error'}</span>
            </div>
          )}
        </div>

        {status === 'complete' && downloadUrl && (
          <div className="export-actions">
            <button
              className="btn-download"
              onClick={(e) => {
                e.preventDefault();
                onDownload();
              }}
            >
              Save {formatLabel} File...
            </button>
          </div>
        )}

        <div className="export-modal-actions">
          {status === 'complete' || status === 'error' ? (
            <button className="btn-close" onClick={onClose}>
              Close
            </button>
          ) : (
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

