/**
 * Example script demonstrating how to load and validate a PicMap configuration
 */

import {
  loadConfigFromFile,
  normalizeConfig,
  validateConfigReferences,
} from '../loaders';
import { validatePicMapConfig } from '../validators';

async function main() {
  const configPath = process.argv[2] || './examples/sample-config.json';

  try {
    console.log(`Loading configuration from: ${configPath}`);

    // Load the configuration from file
    const config = await loadConfigFromFile(configPath);

    console.log('\n✓ Configuration loaded successfully');
    console.log(`  Title: ${config.title}`);
    console.log(`  Description: ${config.description}`);
    console.log(`  Images: ${config.images.length}`);
    console.log(`  Links: ${config.links.length}`);

    // Validate the configuration structure
    const structureResult = validatePicMapConfig(config);
    if (structureResult.valid) {
      console.log('\n✓ Configuration structure is valid');
    } else {
      console.log('\n✗ Configuration structure has errors:');
      structureResult.errors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    }

    // Validate cross-references
    const refErrors = validateConfigReferences(config);
    if (refErrors.length === 0) {
      console.log('✓ All image references are valid');
    } else {
      console.log('\n✗ Configuration has reference errors:');
      refErrors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    }

    // Normalize the configuration with defaults
    const normalized = normalizeConfig(config);
    console.log('\n✓ Configuration normalized with defaults');
    console.log(
      `  Picture border color: ${normalized.pictureBorder?.borderColor}`,
    );
    console.log(`  Link style type: ${normalized.linkStyle?.type}`);
    console.log(`  Show map scale: ${normalized.map.showScale}`);

    console.log('\n✓ All validation checks passed!');
  } catch (error) {
    console.error('\n✗ Error:', error);
    process.exit(1);
  }
}

void main();
