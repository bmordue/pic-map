#!/usr/bin/env node
/**
 * Example: Render a map from a configuration file
 *
 * Usage: node dist/examples/render-map.js [config-file]
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { loadConfigFromFile } from '../loaders';
import { MapEngine } from '../map-engine/engine';

async function renderMapExample(configPath?: string): Promise<void> {
  try {
    // Use provided config path or default to sample config
    const configFile = configPath || join(__dirname, '../../examples/sample-config.json');

    console.log(`Loading configuration from: ${configFile}`);
    const config = await loadConfigFromFile(configFile);

    console.log(`Configuration loaded: ${config.title}`);
    console.log(`Map center: ${config.map.center.latitude}, ${config.map.center.longitude}`);
    console.log(`Zoom level: ${config.map.zoom}`);
    console.log(`Number of markers: ${config.links.length}`);

    // Create map engine
    const engine = new MapEngine();

    // Create markers from links
    const markers = MapEngine.createMarkersFromLinks(config.links);

    // Calculate map dimensions (A4 landscape at 96 DPI for web preview)
    // A4 landscape: 297mm x 210mm = 11.69in x 8.27in
    // At 96 DPI: 1122px x 794px
    const mapWidth = 1122;
    const mapHeight = 794;

    console.log('\nRendering map...');
    const result = engine.renderMap({
      style: config.map,
      width: mapWidth,
      height: mapHeight,
      markers,
      backgroundColor: '#ffffff',
    });

    console.log(`Map rendered: ${result.width}x${result.height}px`);
    console.log(
      `Bounds: N:${result.bounds.north.toFixed(4)}, S:${result.bounds.south.toFixed(4)}, E:${result.bounds.east.toFixed(4)}, W:${result.bounds.west.toFixed(4)}`
    );

    // Save the SVG
    const outputPath = join(process.cwd(), 'map-output.svg');
    await writeFile(outputPath, result.svg, 'utf-8');

    console.log(`\nMap saved to: ${outputPath}`);
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
