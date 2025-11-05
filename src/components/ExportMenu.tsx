import { useState } from 'react';
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import ExportProgressModal from './ExportProgressModal';
import './ExportMenu.css';

const API_BASE = 'http://localhost:3001/api';

interface ExportMenuProps {
  diagramId: number;
  diagramName: string;
  hasUnsavedChanges: boolean;
  onSaveBeforeExport: () => Promise<void>;
}

export default function ExportMenu({ diagramId, diagramName, hasUnsavedChanges, onSaveBeforeExport }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<'svg' | 'png' | 'pdf' | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'generating' | 'complete' | 'error'>('idle');
  const [exportFormat, setExportFormat] = useState<'svg' | 'png' | 'pdf' | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async (format: 'svg' | 'png' | 'pdf') => {
    setIsOpen(false);
    
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      setPendingExportFormat(format);
      setShowUnsavedWarning(true);
      return;
    }
    
    // No unsaved changes, proceed with export
    await performExport(format);
  };

  const handleSaveAndExport = async () => {
    setShowUnsavedWarning(false);
    try {
      await onSaveBeforeExport();
      // Wait a moment for save to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      if (pendingExportFormat) {
        await performExport(pendingExportFormat);
        setPendingExportFormat(null);
      }
    } catch (error) {
      alert('Failed to save diagram. Export cancelled.');
      setPendingExportFormat(null);
    }
  };

  const handleExportAnyway = async () => {
    setShowUnsavedWarning(false);
    if (pendingExportFormat) {
      await performExport(pendingExportFormat);
      setPendingExportFormat(null);
    }
  };

  const handleCancelExport = () => {
    setShowUnsavedWarning(false);
    setPendingExportFormat(null);
  };

  const performExport = async (format: 'svg' | 'png' | 'pdf') => {
    setShowProgressModal(true);
    setExportFormat(format);
    setExportStatus('preparing');
    setDownloadUrl(null);
    setErrorMessage(null);

    try {
      // Small delay to show "preparing" state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setExportStatus('generating');
      
      const response = await fetch(`${API_BASE}/export/${format}/${diagramId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        const errorMessage = errorData.details || errorData.error || `Failed to export as ${format.toUpperCase()}`;
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setExportStatus('complete');
    } catch (error: any) {
      setExportStatus('error');
      setErrorMessage(error.message || `Failed to export as ${format.toUpperCase()}`);
      console.error('Export error:', error);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl || !exportFormat) return;

    try {
      // Show native save dialog
      const filePath = await save({
        defaultPath: `${diagramName}.${exportFormat}`,
        filters: [{
          name: exportFormat.toUpperCase(),
          extensions: [exportFormat]
        }]
      });

      if (!filePath) {
        // User cancelled
        return;
      }

      // Fetch the blob again and convert to array buffer
      const response = await fetch(`${API_BASE}/export/${exportFormat}/${diagramId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch export file');
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Write file using Tauri
      await writeBinaryFile(filePath, uint8Array);
      
      // Close the modal
      handleClose();
    } catch (error: any) {
      console.error('Save error:', error);
      // Fallback to browser download if Tauri save fails
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${diagramName}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleClose = () => {
    setShowProgressModal(false);
    setExportStatus('idle');
    setExportFormat(null);
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setErrorMessage(null);
  };

  return (
    <>
      <div className="export-menu">
        <button
          className="btn-export"
          onClick={() => setIsOpen(!isOpen)}
          disabled={showProgressModal}
        >
          Export {isOpen ? '▲' : '▼'}
        </button>
        {isOpen && (
          <div className="export-dropdown">
            <button onClick={() => handleExport('svg')} disabled={showProgressModal}>
              Export as SVG
            </button>
            <button onClick={() => handleExport('png')} disabled={showProgressModal}>
              Export as PNG
            </button>
            <button onClick={() => handleExport('pdf')} disabled={showProgressModal}>
              Export as PDF
            </button>
          </div>
        )}
      </div>
      
      {showUnsavedWarning && (
        <div className="modal-overlay" onClick={handleCancelExport}>
          <div className="unsaved-export-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Unsaved Changes</h3>
            <p className="modal-message">
              You have unsaved changes to this diagram. The export will use the last saved version. 
              Would you like to save your changes before exporting?
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCancelExport}>
                Cancel
              </button>
              <button className="btn-confirm-secondary" onClick={handleExportAnyway}>
                Export Anyway
              </button>
              <button className="btn-confirm" onClick={handleSaveAndExport}>
                Save & Export
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ExportProgressModal
        isOpen={showProgressModal}
        format={exportFormat}
        diagramName={diagramName}
        status={exportStatus}
        downloadUrl={downloadUrl}
        errorMessage={errorMessage}
        onClose={handleClose}
        onDownload={handleDownload}
      />
    </>
  );
}
