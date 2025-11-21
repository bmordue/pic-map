# PicMap Examples

This directory contains example configurations and usage demonstrations for the PicMap data layer.

## Files

### sample-config.json

A complete example configuration file showing a London tourism map with three locations:
- Big Ben
- Tower Bridge
- London Eye

This demonstrates all available configuration options including:
- Geographic locations with coordinates
- Image metadata with captions and dimensions
- Layout options (page size, orientation, margins)
- Map styling (provider, zoom level, center point)
- Picture border styling
- Link visualization styling

### validate-config.ts (in src/examples/)

A TypeScript example script that demonstrates how to:
- Load a configuration from a JSON file
- Validate the configuration structure
- Check cross-references between images and links
- Normalize the configuration with default values

## Running the Examples

To validate the sample configuration:

```bash
npm run build
node dist/examples/validate-config.js examples/sample-config.json
```

Or to run with ts-node (if installed):

```bash
npx ts-node src/examples/validate-config.ts examples/sample-config.json
```

## Configuration Schema

For detailed information about the configuration schema and available options, see the TypeScript interfaces in `src/types/index.ts`.

### Key Interfaces

- `PicMapConfig`: The main configuration interface
- `GeoLocation`: Geographic coordinates and location information
- `ImageMetadata`: Image file paths, captions, and metadata
- `LayoutOptions`: Page layout and spacing configuration
- `MapStyle`: Map rendering options
- `PictureBorderStyle`: Border styling for pictures
- `LinkStyle`: Visual styling for links between images and locations
