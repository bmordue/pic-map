# Pic-Map

A TypeScript-based tool for creating maps with picture borders - perfect for travel documentation, business directories, and visual storytelling.

## Overview

Pic-Map creates maps that display a traditional map view in the center of the page, surrounded by a border of pictures. Each picture links to a place marker on the map, enabling visual storytelling through geographic locations.

### Use Cases

- **Business Directory Maps**: City center maps with advertiser photos linked to business locations
- **Travel Documentation**: Holiday trip maps with photos linked to places where they were taken
- **Event Maps**: Conference or festival maps with photos of venues and activities

### Output Formats

The project targets print-ready output formats:
- SVG (editable, scalable vector format)
- PDF (final print-ready format)
- EPS (for professional print workflows)

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
```

### Development

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

### Quick Start Example

```bash
# Build the project
npm run build

# Generate a map from the sample configuration
node dist/examples/render-map.js

# View the generated SVG
# The map will be saved as map-output.svg in the project root
```

You can also use the Map Engine programmatically:

```typescript
import { MapEngine } from 'picmap';

const engine = new MapEngine();

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
    },
  ],
});

console.log(result.svg); // SVG output
```

## Project Structure

```
pic-map/
├── src/           # Source TypeScript files
├── dist/          # Compiled JavaScript output
├── docs/          # Project documentation
├── package.json   # Project dependencies and scripts
├── tsconfig.json  # TypeScript configuration
├── eslint.config.mjs  # ESLint configuration
├── .prettierrc    # Prettier configuration
└── vitest.config.ts   # Vitest testing configuration
```

## Development Status

This project is in active development. See [PLAN.md](docs/PLAN.md) for the full development roadmap.

### Completed Phases

**Phase 1: Foundation** ✅
- [x] Initialize TypeScript project structure
- [x] Set up build tooling (TSC)
- [x] Configure linting (ESLint, Prettier)
- [x] Set up testing framework (Vitest)
- [x] Create basic project documentation

**Phase 2: Data Layer** ✅
- [x] Define TypeScript interfaces for locations, images, and configuration
- [x] Implement data validation
- [x] Create data loader/parser utilities
- [x] Add unit tests for data layer

**Phase 3: Map Engine** ✅
- [x] Custom SVG-based map rendering for print output
- [x] Web Mercator projection coordinate conversion
- [x] Marker placement with multiple shapes (pin, circle, square)
- [x] Custom styling support (colors, sizes)
- [x] Auto-zoom and auto-center utilities
- [x] Scale bar and attribution rendering
- [x] Comprehensive test coverage (114 tests)

### Current Phase: Picture Border Engine (Phase 4)

See [Map Engine Documentation](src/map-engine/README.md) for detailed usage examples.

## Contributing

This is currently a personal project. Contributions guidelines will be added in a future release.

## License

ISC
