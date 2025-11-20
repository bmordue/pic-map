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

### Current Phase: Foundation (Phase 1)

- [x] Initialize TypeScript project structure
- [x] Set up build tooling (TSC)
- [x] Configure linting (ESLint, Prettier)
- [x] Set up testing framework (Vitest)
- [x] Create basic project documentation

## Contributing

This is currently a personal project. Contributions guidelines will be added in a future release.

## License

ISC
