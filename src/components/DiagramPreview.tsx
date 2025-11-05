import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import './DiagramPreview.css';

interface DiagramPreviewProps {
  content: string;
}

export default function DiagramPreview({ content }: DiagramPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current || !content.trim()) return;

    const renderDiagram = async () => {
      try {
        mermaid.initialize({ 
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, content);
        
        if (previewRef.current) {
          previewRef.current.innerHTML = svg;
        }
      } catch (error: any) {
        if (previewRef.current) {
          previewRef.current.innerHTML = `
            <div class="error-message">
              <h3>Error rendering diagram</h3>
              <pre>${error.message}</pre>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [content]);

  if (!content.trim()) {
    return (
      <div className="preview-empty">
        <p>Enter Mermaid diagram code in the editor to see the preview</p>
      </div>
    );
  }

  return <div ref={previewRef} className="mermaid-preview" />;
}

