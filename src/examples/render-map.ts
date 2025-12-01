#!/usr/bin/env node
/**
 * Example: Render a complete pic-map from a configuration file
 *
 * This renders a full composition including:
 * - The map area with markers and scale
 * - Picture borders around the map with image placeholders
 * - Link lines connecting pictures to map markers
 *
 * Usage: node dist/examples/render-map.js [config-file]
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { loadConfigFromFile } from '../loaders';
import { MapEngine } from '../map-engine/engine';
import { createCompositorFromLayout } from '../compositor/compositor';
import { geoToViewportPixel } from '../map-engine/coordinates';

async function renderMapExample(configPath?: string): Promise<void> {
  try {
    // Use provided config path or default to sample config
    const configFile = configPath || join(__dirname, '../../examples/sample-config.json');

    console.log(`Loading configuration from: ${configFile}`);
    const config = await loadConfigFromFile(configFile);

    console.log(`Configuration loaded: ${config.title}`);
    console.log(`Map center: ${config.map.center.latitude}, ${config.map.center.longitude}`);
    console.log(`Zoom level: ${config.map.zoom}`);
    console.log(`Number of images: ${config.images.length}`);
    console.log(`Number of markers: ${config.links.length}`);

    // Create compositor with the config layout (96 DPI for web preview)
    const dpi = 96;
    const compositor = createCompositorFromLayout(
      config.layout,
      config.pictureBorder,
      config.linkStyle,
      dpi
    );

    // Get the layout to determine map area dimensions
    const initialLayout = compositor.createLayout({
      map: { svg: '', width: 0, height: 0, bounds: { north: 0, south: 0, east: 0, west: 0 } },
      images: config.images,
      links: [],
    });

    const mapWidth = initialLayout.mapArea.width;
    const mapHeight = initialLayout.mapArea.height;

    console.log(`\nMap area: ${mapWidth}x${mapHeight}px`);

    // Create map engine and render the map
    const mapEngine = new MapEngine();
    const markers = MapEngine.createMarkersFromLinks(config.links);

    console.log('Rendering map...');
    const renderedMap = mapEngine.renderMap({
      style: config.map,
      width: mapWidth,
      height: mapHeight,
      markers,
      backgroundColor: '#ffffff',
    });

    console.log(`Map rendered: ${renderedMap.width}x${renderedMap.height}px`);
    console.log(
      `Bounds: N:${renderedMap.bounds.north.toFixed(4)}, S:${renderedMap.bounds.south.toFixed(4)}, E:${renderedMap.bounds.east.toFixed(4)}, W:${renderedMap.bounds.west.toFixed(4)}`
    );

    // Calculate marker positions relative to map for link lines
    const markerPositions = config.links.map((link) => {
      const pixel = geoToViewportPixel(
        link.location,
        config.map.center,
        config.map.zoom,
        mapWidth,
        mapHeight
      );
      return {
        imageIndex: parseInt(link.imageId, 10),
        markerPosition: pixel,
        label: link.label,
      };
    });

    // Render the full composition
    console.log('\nComposing full pic-map...');
    const result = compositor.render({
      map: renderedMap,
      images: config.images,
      links: markerPositions,
    });

    console.log(`Composition rendered: ${result.width}x${result.height}px at ${result.dpi} DPI`);
    console.log(`Page size: ${result.pageSizeMm.width}mm x ${result.pageSizeMm.height}mm`);

    // Save the SVG
    const outputPath = join(process.cwd(), 'map-output.svg');
    await writeFile(outputPath, result.svg, 'utf-8');

    console.log(`\nMap saved to: ${outputPath}`);
    console.log('\nThe output includes:');
    console.log(`  - Map area with ${config.links.length} markers`);
    console.log(`  - Picture border with ${config.images.length} image placeholders`);
    console.log('  - Link lines connecting pictures to map markers');
    console.log('\nYou can open this file in a web browser or SVG editor.');
  } catch (error) {
    console.error('Error rendering map:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  const configPath = process.argv[2];
  renderMapExample(configPath).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { renderMapExample };
