#!/usr/bin/env node
/**
 * Example: Export a complete pic-map to various formats
 *
 * This exports a full composition including:
 * - The map area with markers and scale
 * - Picture borders around the map with image placeholders
 * - Link lines connecting pictures to map markers
 *
 * Usage: node dist/examples/export-map.js [format] [output-file]
 *
 * Examples:
 *   node dist/examples/export-map.js svg map-export.svg
 *   node dist/examples/export-map.js pdf map-export.pdf
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { loadConfigFromFile } from '../loaders';
import { MapEngine } from '../map-engine/engine';
import { ExportEngine, ExportFormat } from '../export-engine';
import { createCompositorFromLayout } from '../compositor/compositor';
import { geoToViewportPixel } from '../map-engine/coordinates';

async function exportMapExample(format?: string, outputFile?: string): Promise<void> {
  try {
    // Load sample configuration
    const configFile = join(__dirname, '../../examples/sample-config.json');
    console.log(`Loading configuration from: ${configFile}`);
    const config = await loadConfigFromFile(configFile);

    console.log(`Configuration loaded: ${config.title}`);
    console.log(`Number of images: ${config.images.length}`);
    console.log(`Number of markers: ${config.links.length}`);

    // Create compositor with the config layout (300 DPI for print quality)
    const dpi = 300;
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
    const compositionResult = compositor.render({
      map: renderedMap,
      images: config.images,
      links: markerPositions,
    });

    console.log(
      `Composition rendered: ${compositionResult.width}x${compositionResult.height}px at ${compositionResult.dpi} DPI`
    );
    console.log(
      `Page size: ${compositionResult.pageSizeMm.width}mm x ${compositionResult.pageSizeMm.height}mm`
    );

    // Determine export format
    const exportFormat: ExportFormat = format === 'pdf' ? 'pdf' : 'svg';
    const defaultOutputName = exportFormat === 'pdf' ? 'map-export.pdf' : 'map-export.svg';
    const outputPath = join(process.cwd(), outputFile || defaultOutputName);

    // Create export engine
    const exportEngine = new ExportEngine();

    console.log(`\nExporting to ${exportFormat.toUpperCase()} format...`);

    const exportResult = await exportEngine.export(
      {
        svg: compositionResult.svg,
        width: compositionResult.width,
        height: compositionResult.height,
      },
      {
        format: exportFormat,
        pageSize: config.layout.pageSize === 'custom' ? 'A4' : config.layout.pageSize,
        orientation: config.layout.orientation,
        dpi,
        title: config.title,
        author: 'Pic-Map',
      }
    );

    console.log(`Export complete: ${exportResult.widthMm}mm x ${exportResult.heightMm}mm`);
    console.log(`Resolution: ${exportResult.widthPx}x${exportResult.heightPx}px at ${dpi} DPI`);

    // Write output file
    if (exportFormat === 'pdf') {
      await writeFile(outputPath, exportResult.data as Buffer);
    } else {
      await writeFile(outputPath, exportResult.data as string, 'utf-8');
    }

    console.log(`\nExported to: ${outputPath}`);
    console.log('\nThe output includes:');
    console.log(`  - Map area with ${config.links.length} markers`);
    console.log(`  - Picture border with ${config.images.length} image placeholders`);
    console.log('  - Link lines connecting pictures to map markers');

    if (exportFormat === 'svg') {
      console.log('\nYou can open this file in a web browser or SVG editor.');
    } else {
      console.log('\nYou can open this file in any PDF viewer.');
    }
  } catch (error) {
    console.error('Error exporting map:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  const format = process.argv[2];
  const outputFile = process.argv[3];
  exportMapExample(format, outputFile).catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { exportMapExample };
