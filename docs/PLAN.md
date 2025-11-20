# Project Plan: Pic-Map

## Overview

Pic-Map is a template for creating maps that display a traditional map view in the center of the page, surrounded by a border of pictures. Each picture links to a place marker on the map, enabling visual storytelling through geographic locations.

## Use Cases

1. **Business Directory Maps**: City center maps with advertiser photos linked to business locations
2. **Travel Documentation**: Holiday trip maps with photos linked to places where they were taken
3. **Event Maps**: Conference or festival maps with photos of venues and activities

## Goals

- Create an intuitive map visualization with linked picture borders
- Target print output formats (SVG, EPS, PDF)
- Maintain an editable intermediate representation for iteration
- Implement using TypeScript for type safety and maintainability

## Architecture Overview

### High-Level Architecture

The Pic-Map system consists of several key components working together to create the final output:

1. **Data Layer**: Manages geographic data and image metadata
2. **Map Engine**: Renders the central map view
3. **Picture Border Engine**: Arranges and renders the picture border
4. **Link Manager**: Manages connections between pictures and map markers
5. **Export Engine**: Converts the composition to print-ready formats

## Implementation Phases

### Phase 1: Project Setup & Foundation
- [x] Initialize TypeScript project structure
- [ ] Set up build tooling (TSC, bundler)
- [ ] Configure linting (ESLint, Prettier)
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Create basic project documentation

### Phase 2: Data Layer
- [ ] Define TypeScript interfaces for:
  - Geographic locations (lat/long, place names)
  - Image metadata (file paths, captions, dimensions)
  - Configuration schema (layout, styling options)
- [ ] Implement data validation
- [ ] Create data loader/parser utilities
- [ ] Add unit tests for data layer

### Phase 3: Map Engine
- [ ] Research and select map library (Leaflet, Mapbox, or custom SVG)
- [ ] Implement map rendering for print output
- [ ] Add marker placement functionality
- [ ] Support custom styling for print
- [ ] Create map configuration options
- [ ] Add integration tests

### Phase 4: Picture Border Engine
- [ ] Design picture layout algorithm
  - Calculate border dimensions
  - Distribute pictures evenly
  - Handle variable picture sizes
- [ ] Implement picture positioning
- [ ] Add picture frame/styling options
- [ ] Ensure print quality (DPI, resolution)
- [ ] Add unit tests for layout algorithms

### Phase 5: Link Manager
- [ ] Implement picture-to-marker linking logic
- [ ] Add visual link indicators (lines, numbers, etc.)
- [ ] Support various link styles
- [ ] Handle edge cases (multiple pictures per location)
- [ ] Add tests for link rendering

### Phase 6: Compositor & Rendering
- [ ] Combine map and picture border elements
- [ ] Implement layout engine for final composition
- [ ] Add support for different page sizes (A4, Letter, custom)
- [ ] Ensure proper alignment and spacing
- [ ] Add preview functionality
- [ ] Integration tests for full rendering

### Phase 7: Export Engine
- [ ] Implement SVG export
  - Ensure all elements are vector-based
  - Embed or reference images appropriately
- [ ] Implement PDF export
  - Research PDF generation library
  - Maintain print quality
- [ ] Implement EPS export (if needed)
- [ ] Add export configuration options
- [ ] Validate output quality

### Phase 8: User Interface (Optional)
- [ ] Design configuration file format (JSON/YAML)
- [ ] Create CLI for batch processing
- [ ] Consider web-based editor for interactive design
- [ ] Add preview functionality
- [ ] Documentation for UI usage

### Phase 9: Documentation & Examples
- [ ] Write comprehensive README
- [ ] Create API documentation
- [ ] Provide usage examples
- [ ] Include sample datasets
- [ ] Tutorial/getting started guide

### Phase 10: Testing & Refinement
- [ ] End-to-end testing with real data
- [ ] Performance optimization
- [ ] Print output validation
- [ ] Cross-platform testing
- [ ] Bug fixes and refinements

## Technical Decisions

### Language & Runtime
- **TypeScript**: For type safety, better IDE support, and maintainability
- **Node.js**: For development and build tooling

### Output Formats
1. **SVG**: Primary intermediate format, editable, scalable
2. **PDF**: Final print-ready format with embedded fonts and images
3. **EPS**: Optional, for compatibility with professional print workflows

### Key Libraries (To Be Evaluated)
- **Map Rendering**: Leaflet, Mapbox GL JS, or custom SVG generation
- **SVG Manipulation**: D3.js, SVG.js, or direct DOM manipulation
- **PDF Generation**: PDFKit, jsPDF, or Puppeteer
- **Image Processing**: Sharp for optimization and resizing
- **CLI Framework**: Commander.js or Yargs

### Design Principles
1. **Separation of Concerns**: Clear boundaries between components
2. **Testability**: All components should be unit testable
3. **Configurability**: Support various layouts and styles through configuration
4. **Print Quality**: Ensure high DPI and vector-based rendering where possible
5. **Extensibility**: Allow for future enhancements and customizations

## Milestones

1. **M1 - Foundation** (Weeks 1-2): Project setup, data layer, basic architecture
2. **M2 - Core Rendering** (Weeks 3-5): Map engine and picture border engine
3. **M3 - Integration** (Weeks 6-7): Link manager and compositor
4. **M4 - Export** (Weeks 8-9): Export engine and output validation
5. **M5 - Polish** (Weeks 10-12): Documentation, examples, testing, refinement

## Success Criteria

- [ ] Generate print-ready maps with picture borders
- [ ] Support multiple output formats (SVG, PDF)
- [ ] Handle various map types and picture configurations
- [ ] Provide clear documentation and examples
- [ ] Maintain type safety throughout codebase
- [ ] Achieve good test coverage (>80%)
- [ ] Produce high-quality print output

## Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Map library limitations for print | High | Evaluate multiple libraries early; consider custom SVG |
| Image quality/size issues | Medium | Implement image optimization pipeline |
| PDF generation complexity | Medium | Start with SVG, add PDF export later |
| Performance with many images | Low | Implement lazy loading and optimization |
| Cross-platform compatibility | Low | Test on multiple platforms early |

## Future Enhancements

- Interactive web-based editor
- Template marketplace
- Animation support for digital displays
- Batch processing for multiple maps
- Cloud-based rendering service
- Mobile app for data collection

## References

- Map projection considerations for print
- Print DPI standards (300+ DPI for quality output)
- SVG best practices for print
- PDF/X standards for professional printing
