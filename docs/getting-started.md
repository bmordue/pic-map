# Getting Started with Pic-Map

This guide will walk you through creating your first map with picture borders using Pic-Map.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Your First Map](#your-first-map)
- [Understanding the Configuration](#understanding-the-configuration)
- [Customizing Your Map](#customizing-your-map)
- [Exporting Your Map](#exporting-your-map)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js** version 18.x or higher
- **npm** version 8.x or higher

You can check your versions with:

```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 8.x.x or higher
```

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/bmordue/pic-map.git
cd pic-map
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Project

```bash
npm run build
```

### Step 4: Verify Installation

Run the test suite to ensure everything is working:

```bash
npm test
```

You should see all tests passing (272+ tests).

---

## Your First Map

Let's create a simple map using the included sample configuration.

### Step 1: Run the Example

```bash
node dist/examples/render-map.js
```

This command will:
1. Load the sample configuration from `examples/sample-config.json`
2. Render a map of London with three tourist attractions
3. Save the result as `map-output.svg` in the project root

### Step 2: View Your Map

Open `map-output.svg` in:
- Any web browser (Chrome, Firefox, Safari, Edge)
- An SVG editor like Inkscape or Adobe Illustrator
- VS Code or another code editor with SVG preview

You should see a map of London with markers for Big Ben, Tower Bridge, and the London Eye.

---

## Understanding the Configuration

The configuration file defines everything about your map. Let's examine the sample configuration at `examples/sample-config.json`:

### Basic Information

```json
{
  "title": "London Tourism Map",
  "description": "A map of London showing major tourist attractions with photos"
}
```

### Layout Settings

```json
{
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
  }
}
```

| Property | Description | Values |
|----------|-------------|--------|
| `pageSize` | Paper size | `A4`, `A3`, `Letter`, `custom` |
| `orientation` | Page orientation | `portrait`, `landscape` |
| `borderWidth` | Width of picture border (mm) | Any positive number |
| `pictureSpacing` | Space between pictures (mm) | Any positive number |
| `margin` | Page margins (mm) | Object with `top`, `right`, `bottom`, `left` |

### Map Settings

```json
{
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
  }
}
```

| Property | Description | Values |
|----------|-------------|--------|
| `provider` | Map style provider | `openstreetmap`, `custom` |
| `zoom` | Zoom level | 0-20 (higher = more detail) |
| `center` | Map center point | Object with `latitude`, `longitude` |
| `showScale` | Display scale bar | `true`, `false` |
| `showAttribution` | Display map attribution | `true`, `false` |

### Images

```json
{
  "images": [
    {
      "filePath": "/images/big-ben.jpg",
      "caption": "Big Ben and Houses of Parliament",
      "altText": "The iconic clock tower of Westminster",
      "credit": "Photo by John Smith",
      "dimensions": {
        "width": 1920,
        "height": 1280
      }
    }
  ]
}
```

### Links (Image-to-Location)

```json
{
  "links": [
    {
      "imageId": "0",
      "location": {
        "latitude": 51.5007,
        "longitude": -0.1246,
        "name": "Big Ben"
      },
      "label": "A"
    }
  ]
}
```

The `imageId` corresponds to the index of the image in the `images` array (0-based).

---

## Customizing Your Map

### Creating Your Own Configuration

Create a new file called `my-map.json`:

```json
{
  "title": "My Custom Map",
  "description": "A custom map with my favorite places",
  "layout": {
    "pageSize": "A4",
    "orientation": "landscape",
    "borderWidth": 50,
    "pictureSpacing": 8,
    "margin": {
      "top": 15,
      "right": 15,
      "bottom": 15,
      "left": 15
    }
  },
  "map": {
    "provider": "openstreetmap",
    "zoom": 14,
    "center": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "name": "New York City"
    },
    "showScale": true,
    "showAttribution": true
  },
  "pictureBorder": {
    "backgroundColor": "#f5f5f5",
    "borderColor": "#2c3e50",
    "borderThickness": 3,
    "cornerRadius": 8
  },
  "linkStyle": {
    "type": "both",
    "lineColor": "#3498db",
    "lineWidth": 2,
    "lineStyle": "solid",
    "labelStyle": {
      "fontFamily": "Arial",
      "fontSize": 14,
      "color": "#2c3e50"
    }
  },
  "images": [
    {
      "filePath": "/path/to/statue-of-liberty.jpg",
      "caption": "Statue of Liberty",
      "dimensions": { "width": 1920, "height": 1280 }
    },
    {
      "filePath": "/path/to/central-park.jpg",
      "caption": "Central Park",
      "dimensions": { "width": 1920, "height": 1280 }
    }
  ],
  "links": [
    {
      "imageId": "0",
      "location": {
        "latitude": 40.6892,
        "longitude": -74.0445,
        "name": "Statue of Liberty"
      },
      "label": "A"
    },
    {
      "imageId": "1",
      "location": {
        "latitude": 40.7829,
        "longitude": -73.9654,
        "name": "Central Park"
      },
      "label": "B"
    }
  ]
}
```

### Run with Your Configuration

```bash
node dist/examples/render-map.js my-map.json
```

### Marker Styles

Customize marker appearance:

```json
{
  "links": [
    {
      "imageId": "0",
      "location": { "latitude": 40.6892, "longitude": -74.0445 },
      "label": "A"
    }
  ]
}
```

When using the Map Engine directly, you can customize markers:

```typescript
const markers = [
  {
    location: { latitude: 40.6892, longitude: -74.0445 },
    label: 'A',
    style: {
      color: '#e74c3c',    // Red
      size: 24,            // Larger
      shape: 'pin'         // Classic map pin
    }
  },
  {
    location: { latitude: 40.7829, longitude: -73.9654 },
    label: 'B',
    style: {
      color: '#3498db',    // Blue
      size: 20,
      shape: 'circle'      // Circle marker
    }
  }
];
```

### Link Styles

Choose how pictures connect to map markers:

| Type | Description |
|------|-------------|
| `line` | Only connecting lines |
| `label` | Only labels (letters/numbers) |
| `both` | Both lines and labels |
| `none` | No visual connections |

```json
{
  "linkStyle": {
    "type": "both",
    "lineColor": "#666666",
    "lineWidth": 1,
    "lineStyle": "dashed"
  }
}
```

---

## Exporting Your Map

### Export to SVG

SVG is ideal for further editing:

```bash
node dist/examples/export-map.js svg my-map-export.svg
```

### Export to PDF

PDF is ideal for printing:

```bash
node dist/examples/export-map.js pdf my-map-export.pdf
```

### Programmatic Export

```typescript
import { writeFile } from 'fs/promises';
import { loadConfigFromFile, MapEngine, ExportEngine } from 'picmap';

async function exportMap() {
  // Load config
  const config = await loadConfigFromFile('my-map.json');

  // Render map
  const mapEngine = new MapEngine();
  const markers = MapEngine.createMarkersFromLinks(config.links);
  
  const map = mapEngine.renderMap({
    style: config.map,
    width: 3508,   // A4 landscape @ 300 DPI
    height: 2480,
    markers,
    backgroundColor: '#ffffff'
  });

  // Export to PDF
  const exportEngine = new ExportEngine();
  const result = await exportEngine.exportToPdf(
    { svg: map.svg, width: map.width, height: map.height },
    {
      pageSize: 'A4',
      orientation: 'landscape',
      dpi: 300,
      title: config.title
    }
  );

  await writeFile('output.pdf', result.data);
  console.log('Map exported successfully!');
}

exportMap();
```

### Print Resolution Guide

| DPI | Use Case | A4 Landscape Pixels |
|-----|----------|---------------------|
| 72 | Screen/Web preview | 842 × 595 |
| 150 | Draft printing | 1754 × 1240 |
| 300 | Standard print quality | 3508 × 2480 |
| 600 | High-quality printing | 7016 × 4961 |

---

## Next Steps

### Learn More

- **[API Reference](api.md)** - Complete API documentation
- **[Map Engine](../src/map-engine/README.md)** - Detailed map rendering options
- **[Export Engine](../src/export-engine/README.md)** - Export formats and options

### Try the Examples

Explore the examples directory:

```bash
# List example files
ls examples/

# Run the validation example
node dist/examples/validate-config.js examples/sample-config.json
```

### Create a Travel Map

1. Gather photos from your trip
2. Note the locations where each was taken
3. Create a configuration file with your photos and coordinates
4. Render and export your map!

### Tips and Best Practices

1. **Image Dimensions**: Provide accurate dimensions for better layout
2. **Zoom Level**: Start with zoom 12-14 for city maps, 8-10 for regions
3. **Labels**: Use single letters (A, B, C) for cleaner maps
4. **Border Width**: 40-60mm works well for most layouts
5. **Print Quality**: Always use 300 DPI for print output

---

## Troubleshooting

### Common Issues

**"Configuration validation failed"**
- Check that all required fields are present
- Verify latitude is between -90 and 90
- Verify longitude is between -180 and 180

**"Cannot find module 'picmap'"**
- Make sure you've run `npm run build`
- Run from the project root directory

**Map appears blank or wrong location**
- Verify the center coordinates
- Try adjusting the zoom level
- Check that your coordinates use decimal degrees (not DMS)

### Getting Help

If you encounter issues:

1. Check the [API documentation](api.md)
2. Review the test files for usage examples
3. Check the [PLAN.md](PLAN.md) for project status

---

## Example Configurations

### Travel Map (Europe Trip)

```json
{
  "title": "European Adventure 2024",
  "layout": {
    "pageSize": "A3",
    "orientation": "landscape",
    "borderWidth": 70,
    "pictureSpacing": 12,
    "margin": { "top": 25, "right": 25, "bottom": 25, "left": 25 }
  },
  "map": {
    "provider": "openstreetmap",
    "zoom": 5,
    "center": { "latitude": 48.8566, "longitude": 2.3522 },
    "showScale": true,
    "showAttribution": true
  }
}
```

### Business Directory (Local Area)

```json
{
  "title": "Downtown Business Directory",
  "layout": {
    "pageSize": "Letter",
    "orientation": "portrait",
    "borderWidth": 45,
    "pictureSpacing": 6,
    "margin": { "top": 15, "right": 15, "bottom": 15, "left": 15 }
  },
  "map": {
    "provider": "openstreetmap",
    "zoom": 16,
    "center": { "latitude": 37.7749, "longitude": -122.4194 },
    "showScale": true,
    "showAttribution": true
  },
  "pictureBorder": {
    "backgroundColor": "#ffffff",
    "borderColor": "#1a1a1a",
    "borderThickness": 2,
    "cornerRadius": 4
  }
}
```

---

Congratulations! You're now ready to create beautiful maps with picture borders using Pic-Map.
