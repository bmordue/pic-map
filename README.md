# Pic-Map

A TypeScript-based tool for creating maps with picture borders - perfect for travel documentation, business directories, and visual storytelling.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/bmordue/pic-map)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bmordue_pic-map&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=bmordue_pic-map)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bmordue_pic-map&metric=coverage)](https://sonarcloud.io/summary/new_code?id=bmordue_pic-map)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x+-green.svg)](https://nodejs.org/)

## Overview

Pic-Map creates maps that display a traditional map view in the center of the page, surrounded by a border of pictures. Each picture links to a place marker on the map, enabling visual storytelling through geographic locations.

```
┌─────────────────────────────────────────────────────┐
│  [Pic A]   [Pic B]   [Pic C]   [Pic D]   [Pic E]   │
│                                                     │
│ [Pic F]  ┌─────────────────────────────┐   [Pic G] │
│          │                             │            │
│ [Pic H]  │          MAP VIEW           │   [Pic I] │
│          │        A● B●  ●C            │            │
│ [Pic J]  │          ●D   ●E            │   [Pic K] │
│          │                             │            │
│          └─────────────────────────────┘            │
│                                                     │
│  [Pic L]   [Pic M]   [Pic N]   [Pic O]   [Pic P]   │
└─────────────────────────────────────────────────────┘
```

### Use Cases

- **Business Directory Maps**: City center maps with advertiser photos linked to business locations
- **Travel Documentation**: Holiday trip maps with photos linked to places where they were taken
- **Event Maps**: Conference or festival maps with photos of venues and activities
- **Real Estate**: Property maps with listing photos
- **Tourism Brochures**: Tourist attraction maps with photos

### Output Formats

The project targets print-ready output formats:
- **SVG** - Editable, scalable vector format (ideal for further editing)
- **PDF** - Final print-ready format with embedded fonts
- **EPS** - For professional print workflows (planned)

## Table of Contents

- [Getting Started](#getting-started)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/bmordue/pic-map.git
cd pic-map

# Install dependencies
npm install

# Build the project
npm run build
```

### Quick Start

Generate a map using the sample configuration:

```bash
# Render a basic map
node dist/examples/render-map.js

# Export to SVG or PDF
node dist/examples/export-map.js svg   # Creates map-export.svg
node dist/examples/export-map.js pdf   # Creates map-export.pdf
```

## Architecture

Pic-Map is built with a modular architecture consisting of five main components:

```
┌──────────────────────────────────────────────────────────────┐
│                        Configuration                          │
│                    (JSON/TypeScript)                          │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                       Data Layer                              │
│         (Types, Validators, Loaders)                          │
└─────────────────────────┬────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│   Map Engine    │ │ Picture Border│ │   Link Manager      │
│  (SVG Rendering)│ │    Engine     │ │ (Picture-Marker     │
│                 │ │               │ │  Connections)       │
└────────┬────────┘ └───────┬───────┘ └──────────┬──────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       Compositor                              │
│            (Combines all elements into final layout)          │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      Export Engine                            │
│                    (SVG, PDF output)                          │
└──────────────────────────────────────────────────────────────┘
```

| Component | Description |
|-----------|-------------|
| **Data Layer** | TypeScript interfaces, validation, and configuration loading |
| **Map Engine** | SVG-based map rendering with Web Mercator projection |
| **Picture Border Engine** | Arranges pictures around the map border |
| **Link Manager** | Connects pictures to map markers with visual indicators |
| **Compositor** | Combines all elements into the final composition |
| **Export Engine** | Converts compositions to print-ready SVG and PDF |

## Configuration

### Configuration File Structure

Create a JSON configuration file with the following structure:

```json
{
  "title": "My Map",
  "description": "Optional description",
  "layout": {
    "pageSize": "A4",
    "orientation": "landscape",
    "borderWidth": 60,
    "pictureSpacing": 10,
    "margin": {
      "top": 20,
      "right": 20,
      "bottom": 20,
      "left": 20
    }
  },
  "map": {
    "provider": "openstreetmap",
    "zoom": 12,
    "center": {
      "latitude": 51.5074,
      "longitude": -0.1278,
      "name": "London"
    },
    "showScale": true,
    "showAttribution": true
  },
  "images": [
    {
      "filePath": "/path/to/image.jpg",
      "caption": "Image caption",
      "dimensions": { "width": 1920, "height": 1280 }
    }
  ],
  "links": [
    {
      "imageId": "0",
      "location": { "latitude": 51.5074, "longitude": -0.1278 },
      "label": "A"
    }
  ],
  "pictureBorder": {
    "backgroundColor": "#ffffff",
    "borderColor": "#333333",
    "borderThickness": 2,
    "cornerRadius": 5
  },
  "linkStyle": {
    "type": "both",
    "lineColor": "#0066cc",
    "lineWidth": 2,
    "lineStyle": "solid"
  }
}
```

### Page Sizes

| Preset | Portrait (mm) | Landscape (mm) |
|--------|---------------|----------------|
| A4 | 210 × 297 | 297 × 210 |
| A3 | 297 × 420 | 420 × 297 |
| Letter | 215.9 × 279.4 | 279.4 × 215.9 |
| Legal | 215.9 × 355.6 | 355.6 × 215.9 |

## API Reference

### Map Engine

```typescript
import { MapEngine } from 'picmap';

const engine = new MapEngine();

// Render a map
const result = engine.renderMap({
  style: {
    provider: 'openstreetmap',
    zoom: 12,
    center: { latitude: 51.5074, longitude: -0.1278 },
    showScale: true,
    showAttribution: true,
  },
  width: 800,
  height: 600,
  markers: [
    {
      location: { latitude: 51.5074, longitude: -0.1278 },
      label: 'A',
      style: { color: '#e74c3c', size: 20, shape: 'pin' }
    }
  ],
  backgroundColor: '#ffffff'
});

console.log(result.svg);    // SVG string
console.log(result.width);  // Width in pixels
console.log(result.height); // Height in pixels
console.log(result.bounds); // Geographic bounding box
```

### Export Engine

```typescript
import { MapEngine, ExportEngine } from 'picmap';

// Render a map
const mapEngine = new MapEngine();
const mapResult = mapEngine.renderMap({ /* config */ });

// Export to SVG
const exportEngine = new ExportEngine();
const svgResult = exportEngine.exportToSvg(
  { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
  { pageSize: 'A4', orientation: 'landscape', title: 'My Map' }
);

// Export to PDF
const pdfResult = await exportEngine.exportToPdf(
  { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
  { pageSize: 'A4', dpi: 300, title: 'My Map', author: 'Author Name' }
);

// Write to file
import { writeFile } from 'fs/promises';
await writeFile('map.pdf', pdfResult.data);
```

### Compositor

```typescript
import { Compositor, createCompositorFromLayout } from 'picmap';

// Create from layout configuration
const compositor = createCompositorFromLayout(
  config.layout,
  config.pictureBorder,
  config.linkStyle,
  300 // DPI
);

// Render complete composition
const composition = compositor.render({
  map: renderedMap,
  images: config.images,
  links: processedLinks
});

console.log(composition.svg);
console.log(composition.width);
console.log(composition.height);
```

### Data Validation

```typescript
import { validatePicMapConfig, loadConfigFromFile } from 'picmap';

// Load and validate configuration
const config = await loadConfigFromFile('config.json');

// Manual validation
const result = validatePicMapConfig(config);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Examples

### Complete Workflow Example

```typescript
import { writeFile } from 'fs/promises';
import { 
  loadConfigFromFile, 
  MapEngine, 
  ExportEngine 
} from 'picmap';

async function createMap(configPath: string) {
  // 1. Load configuration
  const config = await loadConfigFromFile(configPath);
  
  // 2. Create map engine and render
  const mapEngine = new MapEngine();
  const markers = MapEngine.createMarkersFromLinks(config.links);
  
  const mapResult = mapEngine.renderMap({
    style: config.map,
    width: 3508,  // A4 landscape at 300 DPI
    height: 2480,
    markers,
    backgroundColor: '#ffffff'
  });
  
  // 3. Export to PDF
  const exportEngine = new ExportEngine();
  const pdfResult = await exportEngine.exportToPdf(
    { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
    { pageSize: 'A4', orientation: 'landscape', dpi: 300, title: config.title }
  );
  
  // 4. Save the output
  await writeFile('output.pdf', pdfResult.data);
  console.log('Map created successfully!');
}

createMap('examples/sample-config.json');
```

### Coordinate Utilities

```typescript
import { 
  geoToPixel,
  pixelToGeo,
  calculateCenter,
  calculateZoomToFit,
  calculateBounds
} from 'picmap';

// Convert coordinates
const pixel = geoToPixel({ latitude: 51.5074, longitude: -0.1278 }, 12);
const geo = pixelToGeo({ x: 2048, y: 1536 }, 12);

// Calculate optimal view for multiple locations
const locations = [
  { latitude: 51.5074, longitude: -0.1278 },
  { latitude: 51.5033, longitude: -0.1195 },
  { latitude: 51.5055, longitude: -0.0754 }
];

const center = calculateCenter(locations);
const zoom = calculateZoomToFit(locations, 800, 600, 50);
const bounds = calculateBounds(center, zoom, 800, 600);
```

## Documentation

Detailed documentation is available in the following locations:

| Document | Description |
|----------|-------------|
| [Getting Started Guide](docs/getting-started.md) | Step-by-step tutorial for beginners |
| [API Reference](docs/api.md) | Complete API documentation |
| [Map Engine](src/map-engine/README.md) | Map rendering documentation |
| [Export Engine](src/export-engine/README.md) | Export functionality documentation |
| [Development Plan](docs/PLAN.md) | Project roadmap and architecture |

## Project Structure

```
pic-map/
├── src/
│   ├── index.ts              # Main entry point and exports
│   ├── types.ts              # Core TypeScript interfaces
│   ├── validators.ts         # Data validation utilities
│   ├── loaders.ts            # Configuration loading utilities
│   ├── map-engine/           # Map rendering module
│   ├── picture-border-engine/# Picture border module
│   ├── link-manager/         # Link management module
│   ├── compositor/           # Composition module
│   ├── export-engine/        # Export module
│   └── examples/             # Example scripts
├── examples/
│   ├── sample-config.json    # Sample configuration
│   └── README.md             # Examples documentation
├── docs/
│   ├── PLAN.md               # Development roadmap
│   ├── api.md                # API documentation
│   ├── getting-started.md    # Getting started guide
│   └── architecture.dot      # Architecture diagram
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Development

### Scripts

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

### Testing

The project uses [Vitest](https://vitest.dev/) for testing with 272+ tests across all modules:

- Unit tests for each module
- Integration tests for complete workflows
- Test coverage tracking

### Code Style

- **Language**: TypeScript 5.x with strict mode
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Conventions**: Follows standard TypeScript best practices

### Code Quality & Static Analysis

This project uses [SonarCloud](https://sonarcloud.io) for continuous code quality monitoring and static analysis.

#### Setting Up SonarCloud (For Maintainers)

1. **Create SonarCloud Account**
   - Go to [sonarcloud.io](https://sonarcloud.io) and sign in with your GitHub account
   - Click "My Account" → "Security" → "Tokens" and generate a new token

2. **Configure GitHub Secret**
   - In your GitHub repository, go to Settings → Secrets and variables → Actions
   - Add a new secret named `SONAR_TOKEN` with the token generated in Step 1

3. **SonarCloud Analysis**
   - The analysis runs automatically on every push and pull request via GitHub Actions
   - View results at [https://sonarcloud.io/dashboard?id=bmordue_pic-map](https://sonarcloud.io/dashboard?id=bmordue_pic-map)
   - Quality gates ensure code meets defined standards before merging

#### Configuration Files

- `sonar-project.properties` - SonarCloud configuration with project settings
- `.github/workflows/ci.yml` - CI pipeline includes SonarCloud analysis
- `vitest.config.ts` - Configured to generate LCOV coverage reports for SonarCloud

#### Quality Metrics Tracked

- **Code Coverage**: Test coverage percentage
- **Code Smells**: Maintainability issues
- **Bugs**: Reliability issues
- **Security Vulnerabilities**: Security hotspots and vulnerabilities
- **Duplications**: Code duplication percentage
- **Technical Debt**: Estimated time to fix all issues

## Development Status

This project is in active development. See [PLAN.md](docs/PLAN.md) for the full development roadmap.

### Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation - Project setup, TypeScript, testing | ✅ |
| Phase 2 | Data Layer - Types, validation, configuration | ✅ |
| Phase 3 | Map Engine - SVG rendering, coordinates, markers | ✅ |
| Phase 4 | Picture Border Engine - Layout and rendering | ✅ |
| Phase 5 | Link Manager - Picture-to-marker connections | ✅ |
| Phase 6 | Compositor - Layout engine and composition | ✅ |
| Phase 7 | Export Engine - SVG and PDF export | ✅ |
| Phase 8 | CLI Interface | Planned |
| Phase 9 | Documentation & Examples | ✅ |
| Phase 10 | Testing & Refinement | Planned |

## Contributing

This is currently a personal project. Contributions guidelines will be added in a future release.

## License

ISC
