#!/usr/bin/env node
/**
 * Example: Export a map to various formats
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

async function exportMapExample(format?: string, outputFile?: string): Promise<void> {
  try {
    // Load sample configuration
    const configFile = join(__dirname, '../../examples/sample-config.json');
    console.log(`Loading configuration from: ${configFile}`);
    const config = await loadConfigFromFile(configFile);

    console.log(`Configuration loaded: ${config.title}`);

    // Create map engine and render
    const mapEngine = new MapEngine();
    const markers = MapEngine.createMarkersFromLinks(config.links);

    // A4 landscape dimensions at 300 DPI
    const mapWidth = 3508; // 297mm at 300 DPI
    const mapHeight = 2480; // 210mm at 300 DPI

    console.log('\nRendering map...');
    const mapResult = mapEngine.renderMap({
      style: config.map,
      width: mapWidth,
      height: mapHeight,
      markers,
      backgroundColor: '#ffffff',
    });

    console.log(`Map rendered: ${mapResult.width}x${mapResult.height}px`);

    // Determine export format
    const exportFormat: ExportFormat = format === 'pdf' ? 'pdf' : 'svg';
    const defaultOutputName = exportFormat === 'pdf' ? 'map-export.pdf' : 'map-export.svg';
    const outputPath = join(process.cwd(), outputFile || defaultOutputName);

    // Create export engine
    const exportEngine = new ExportEngine();

    console.log(`\nExporting to ${exportFormat.toUpperCase()} format...`);

    const exportResult = await exportEngine.export(
      {
        svg: mapResult.svg,
        width: mapResult.width,
        height: mapResult.height,
      },
      {
        format: exportFormat,
        pageSize: 'A4',
        orientation: 'landscape',
        dpi: 300,
        title: config.title,
        author: 'Pic-Map',
      }
    );

    console.log(`Export complete: ${exportResult.widthMm}mm x ${exportResult.heightMm}mm`);
    console.log(`Resolution: ${exportResult.widthPx}x${exportResult.heightPx}px at 300 DPI`);

    // Write output file
    if (exportFormat === 'pdf') {
      await writeFile(outputPath, exportResult.data as Buffer);
    } else {
      await writeFile(outputPath, exportResult.data as string, 'utf-8');
    }

    console.log(`\nExported to: ${outputPath}`);

    if (exportFormat === 'svg') {
      console.log('You can open this file in a web browser or SVG editor.');
    } else {
      console.log('You can open this file in any PDF viewer.');
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
