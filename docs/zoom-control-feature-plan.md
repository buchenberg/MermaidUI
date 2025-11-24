# Zoom Control Feature Plan

## Overview
Add zoom functionality to the Mermaid diagram viewing pane to allow users to zoom in/out and reset zoom for better diagram viewing experience.

## Problem Statement
Currently, the diagram viewing pane displays diagrams at a fixed scale. Users cannot adjust the zoom level to:
- View small details in complex diagrams
- Get an overview of large diagrams
- Accommodate different screen sizes and resolutions
- Improve readability for presentations or documentation

## User Stories
1. **As a user**, I want to zoom in on diagrams to see fine details
2. **As a user**, I want to zoom out to get an overview of large diagrams  
3. **As a user**, I want to reset zoom to the default 100% view
4. **As a user**, I want to see the current zoom level displayed
5. **As a user**, I want intuitive zoom controls that don't interfere with diagram editing

## Technical Requirements

### Frontend Components
1. **Zoom Controls UI**
   - Zoom in button (+)
   - Zoom out button (-)
   - Reset zoom button (100%)
   - Zoom level display (percentage)
   - Optional: Zoom slider for precise control

2. **Diagram Container**
   - CSS transform scaling for zoom implementation
   - Maintain diagram aspect ratio
   - Preserve diagram quality during scaling
   - Handle overflow with scrollbars when needed

3. **State Management**
   - Current zoom level (number, e.g., 1.0 for 100%)
   - Minimum/maximum zoom limits
   - Zoom step size (e.g., 0.1 or 10%)

### Integration Points
1. **DiagramEditor Component**
   - Add zoom state and controls to existing diagram editor
   - Maintain compatibility with existing auto-save and editing features
   - Ensure zoom doesn't affect diagram content or editing capabilities

2. **Mermaid Rendering**
   - Zoom should apply to the rendered SVG output
   - Maintain sharp rendering at different zoom levels
   - Handle re-rendering when zoom changes

## Implementation Plan

### Phase 1: Basic Zoom Functionality
1. **Add zoom state to DiagramEditor**
   - Add `zoomLevel` state (default: 1.0)
   - Add `setZoomLevel` function
   - Define zoom limits (e.g., 0.3 to 3.0)

2. **Implement zoom controls**
   - Create ZoomControls component
   - Add zoom in/out/reset buttons
   - Display current zoom percentage

3. **Apply zoom to diagram container**
   - Use CSS `transform: scale()` on diagram container
   - Handle container sizing and overflow

### Phase 2: Enhanced Controls
1. **Add zoom slider**
   - Range input for precise zoom control
   - Real-time zoom adjustment

2. **Keyboard shortcuts**
   - Ctrl/Cmd + Mouse wheel for zoom
   - Ctrl/Cmd + 0 to reset zoom
   - Ctrl/Cmd + + to zoom in
   - Ctrl/Cmd + - to zoom out

3. **Zoom to fit**
   - Auto-zoom to fit diagram in viewport
   - Maintain aspect ratio

### Phase 3: Polish & UX
1. **Smooth animations**
   - CSS transitions for zoom changes
   - Performance optimization

2. **Persistent zoom**
   - Save zoom level per diagram
   - Restore zoom when reopening diagrams

3. **Responsive design**
   - Mobile-friendly zoom controls
   - Touch gesture support (pinch to zoom)

## Technical Specifications

### Component Structure
```
DiagramEditor/
├── DiagramEditor.tsx (existing)
├── DiagramEditor.css (existing)
├── ZoomControls.tsx (new)
└── ZoomControls.css (new)
```

### State Interface
```typescript
interface ZoomState {
  level: number;        // Current zoom level (1.0 = 100%)
  min: number;         // Minimum zoom (e.g., 0.3)
  max: number;         // Maximum zoom (e.g., 3.0)
  step: number;        // Zoom step size (e.g., 0.1)
}
```

### CSS Implementation
```css
.diagram-container.zoomed {
  transform: scale(var(--zoom-level));
  transform-origin: 0 0;
  transition: transform 0.2s ease;
}
```

## Dependencies & Considerations

### Dependencies
- **None**: Uses existing React and CSS capabilities
- **Optional**: May use React hooks for gesture handling

### Performance Considerations
- CSS transforms are GPU-accelerated and performant
- Avoid re-rendering the entire Mermaid diagram on zoom
- Use debouncing for rapid zoom changes

### Browser Compatibility
- CSS transforms widely supported
- Fallback for older browsers (if needed)

## Testing Strategy

### Unit Tests
- Zoom level calculation
- Zoom limits enforcement
- Reset functionality

### Integration Tests
- Zoom controls integration with DiagramEditor
- CSS transform application
- Keyboard shortcuts

### User Testing
- Zoom control usability
- Performance with large diagrams
- Mobile/touch interaction

## Success Metrics
- Users can successfully zoom in/out on diagrams
- Zoom controls are intuitive and responsive
- No performance degradation with zoom
- Zoom state persists appropriately
- Keyboard shortcuts work as expected

## Risks & Mitigations

### Technical Risks
1. **Performance issues with large diagrams**
   - Mitigation: Use CSS transforms (GPU accelerated)
   - Mitigation: Implement virtual scrolling if needed

2. **Zoom affecting diagram editing**
   - Mitigation: Apply zoom only to viewing container
   - Mitigation: Separate zoom state from diagram content

3. **Browser compatibility**
   - Mitigation: Test across target browsers
   - Mitigation: Provide fallback options

### UX Risks
1. **Controls obstructing diagram view**
   - Mitigation: Position controls thoughtfully
   - Mitigation: Option to hide controls

2. **Confusion about zoom state**
   - Mitigation: Clear zoom level display
   - Mitigation: Visual feedback for zoom changes

## Timeline Estimate
- **Phase 1**: 2-3 days
- **Phase 2**: 1-2 days  
- **Phase 3**: 1-2 days
- **Total**: 4-7 development days

## Next Steps
1. Create ZoomControls component
2. Integrate with DiagramEditor
3. Implement basic zoom functionality
4. Add enhanced controls and keyboard shortcuts
5. Test and refine user experience