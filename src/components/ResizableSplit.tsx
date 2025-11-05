import { useState, useRef, useEffect } from 'react';
import './ResizableSplit.css';

interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeftWidth?: number; // Percentage (0-100)
}

type PaneVisibility = 'both' | 'left' | 'right';

export default function ResizableSplit({ left, right, initialLeftWidth = 50 }: ResizableSplitProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [paneVisibility, setPaneVisibility] = useState<PaneVisibility>('both');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const toggleLeftPane = () => {
    if (paneVisibility === 'left') {
      // If only left is visible, show both
      setPaneVisibility('both');
    } else if (paneVisibility === 'both') {
      // If both are visible, hide left (show only right)
      setPaneVisibility('right');
    } else if (paneVisibility === 'right') {
      // If only right is visible, show both
      setPaneVisibility('both');
    }
  };

  const toggleRightPane = () => {
    if (paneVisibility === 'right') {
      // If only right is visible, show both
      setPaneVisibility('both');
    } else if (paneVisibility === 'both') {
      // If both are visible, hide right (show only left)
      setPaneVisibility('left');
    } else if (paneVisibility === 'left') {
      // If only left is visible, show both
      setPaneVisibility('both');
    }
  };

  return (
    <div className="resizable-split" ref={containerRef}>
      <div 
        className={`resizable-split-left ${paneVisibility === 'right' ? 'hidden' : ''}`}
        style={{ width: paneVisibility === 'left' ? '100%' : `${leftWidth}%` }}
      >
        {left}
      </div>
      {paneVisibility === 'both' && (
        <div
          className="resizable-split-divider"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
        >
          <div className="divider-controls">
            <button
              className="divider-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleLeftPane();
              }}
              title="Hide Left Pane"
            >
              ◀
            </button>
            <button
              className="divider-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleRightPane();
              }}
              title="Hide Right Pane"
            >
              ▶
            </button>
          </div>
        </div>
      )}
      {paneVisibility === 'left' && (
        <div className="resizable-split-divider collapsed">
          <div className="divider-controls">
            <button
              className="divider-btn"
              onClick={toggleRightPane}
              title="Show Right Pane"
            >
              ◀
            </button>
          </div>
        </div>
      )}
      {paneVisibility === 'right' && (
        <div className="resizable-split-divider collapsed">
          <div className="divider-controls">
            <button
              className="divider-btn"
              onClick={toggleLeftPane}
              title="Show Left Pane"
            >
              ▶
            </button>
          </div>
        </div>
      )}
      <div 
        className={`resizable-split-right ${paneVisibility === 'left' ? 'hidden' : ''}`}
        style={{ width: paneVisibility === 'right' ? '100%' : `${100 - leftWidth}%` }}
      >
        {right}
      </div>
    </div>
  );
}

