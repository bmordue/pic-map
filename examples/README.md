# PicMap Examples

This directory contains example configurations and usage demonstrations for Pic-Map.

## Quick Start

```bash
# Build the project first
npm run build

# Render a map from the sample configuration
node dist/examples/render-map.js

# Export to SVG or PDF
node dist/examples/export-map.js svg
node dist/examples/export-map.js pdf
```

## Sample Configurations

### sample-config.json (London Tourism)

A complete example configuration file showing a London tourism map with three locations:
- Big Ben
- Tower Bridge
- London Eye

**Use case**: Tourism brochure, travel documentation

```bash
node dist/examples/render-map.js examples/sample-config.json
```

### travel-europe.json (European Trip)

A multi-country travel map covering major European cities:
- Paris, France
- Rome, Italy
- Barcelona, Spain
- Amsterdam, Netherlands
- Berlin, Germany

**Use case**: Travel blog, vacation memories

```bash
node dist/examples/render-map.js examples/travel-europe.json
```

### business-directory.json (Local Business Map)

A local business directory map for downtown San Francisco:
- Various business types (restaurants, shops, services)
- Compact portrait layout for flyers
- Professional styling

**Use case**: Business advertising, local directory, city guide

```bash
node dist/examples/render-map.js examples/business-directory.json
```

## Example Scripts

Located in `src/examples/`:

### render-map.ts

Renders a map from a configuration file to SVG.

```bash
# Usage
node dist/examples/render-map.js [config-file]

# Examples
node dist/examples/render-map.js                           # Uses default sample-config.json
node dist/examples/render-map.js examples/travel-europe.json
node dist/examples/render-map.js my-custom-config.json
```

Output: `map-output.svg` in the current directory.

### export-map.ts

Exports a map to SVG or PDF format with print-ready settings.

```bash
# Usage
node dist/examples/export-map.js [format] [output-file]

# Examples
node dist/examples/export-map.js svg                       # Creates map-export.svg
node dist/examples/export-map.js pdf                       # Creates map-export.pdf
node dist/examples/export-map.js pdf my-map.pdf            # Custom output filename
```

Output: Print-ready file at 300 DPI.

### validate-config.ts

Validates a configuration file and shows detailed diagnostics.

```bash
# Usage
node dist/examples/validate-config.js [config-file]

# Examples
node dist/examples/validate-config.js examples/sample-config.json
node dist/examples/validate-config.js my-custom-config.json
```

## Configuration Schema

### Complete Configuration Structure

```json
{
  "title": "Map Title",
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
      "name": "Location Name"
    },
    "showScale": true,
    "showAttribution": true
  },
  
  "images": [
    {
      "filePath": "/path/to/image.jpg",
      "caption": "Image caption",
      "altText": "Accessibility text",
      "credit": "Photo credit",
      "dimensions": {
        "width": 1920,
        "height": 1280
      }
    }
  ],
  
  "links": [
    {
      "imageId": "0",
      "location": {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "name": "Location"
      },
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
    "lineStyle": "solid",
    "labelStyle": {
      "fontFamily": "Arial",
      "fontSize": 14,
      "color": "#000000"
    }
  }
}
```

### Key Interfaces

| Interface | Description |
|-----------|-------------|
| `PicMapConfig` | Main configuration interface |
| `GeoLocation` | Geographic coordinates |
| `ImageMetadata` | Image file paths and metadata |
| `LayoutOptions` | Page layout configuration |
| `MapStyle` | Map rendering options |
| `PictureBorderStyle` | Picture frame styling |
| `LinkStyle` | Link visualization styling |

### Page Size Options

| Preset | Portrait (mm) | Landscape (mm) |
|--------|---------------|----------------|
| A4 | 210 × 297 | 297 × 210 |
| A3 | 297 × 420 | 420 × 297 |
| Letter | 215.9 × 279.4 | 279.4 × 215.9 |
| Legal | 215.9 × 355.6 | 355.6 × 215.9 |

### Zoom Level Guide

| Zoom | Coverage | Use Case |
|------|----------|----------|
| 3-5 | Continent | Multi-country travel map |
| 6-8 | Large region/country | Regional overview |
| 10-12 | City | City tourism map |
| 14-16 | Neighborhood | Local business directory |
| 17-18 | Street level | Detailed walking map |

## Tips

1. **Finding Coordinates**: Use Google Maps, right-click a location, and copy the coordinates.

2. **Image IDs**: The `imageId` in links corresponds to the array index (0-based) in the `images` array.

3. **Zoom Level**: Start with zoom 12 for city maps and adjust based on your marker spread.

4. **Print Quality**: Export at 300 DPI for professional printing.

5. **Labels**: Use sequential letters (A, B, C) or numbers for cleaner maps.

## More Information

- [Getting Started Guide](../docs/getting-started.md)
- [API Reference](../docs/api.md)
- [Map Engine Documentation](../src/map-engine/README.md)
- [Export Engine Documentation](../src/export-engine/README.md)
