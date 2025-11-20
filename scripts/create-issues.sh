#!/bin/bash

# Script to create GitHub issues using the GitHub CLI (gh)
# 
# Usage:
#   ./scripts/create-issues.sh
# 
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated
#   - Run 'gh auth login' first if not authenticated

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not authenticated${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${BLUE}Creating GitHub issues for pic-map implementation phases${NC}\n"
echo "════════════════════════════════════════════════════════════"

# Phase 1: Project Setup & Foundation
echo -e "\n${BLUE}Creating Phase 1 issue...${NC}"
gh issue create \
  --title "Phase 1: Project Setup & Foundation" \
  --body "## Overview
Set up the foundational infrastructure for the Pic-Map project.

## Tasks
- [x] Initialize TypeScript project structure
- [ ] Set up build tooling (TSC, bundler)
- [ ] Configure linting (ESLint, Prettier)
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Create basic project documentation

## Related
- See PLAN.md Phase 1 for full details
- Part of Milestone M1 - Foundation (Weeks 1-2)" \
  --label "phase-1,setup,foundation"

echo -e "${GREEN}✓ Created Phase 1 issue${NC}"

# Phase 2: Data Layer
echo -e "\n${BLUE}Creating Phase 2 issue...${NC}"
gh issue create \
  --title "Phase 2: Data Layer" \
  --body "## Overview
Implement the data layer for managing geographic data and image metadata.

## Tasks
- [ ] Define TypeScript interfaces for:
  - Geographic locations (lat/long, place names)
  - Image metadata (file paths, captions, dimensions)
  - Configuration schema (layout, styling options)
- [ ] Implement data validation
- [ ] Create data loader/parser utilities
- [ ] Add unit tests for data layer

## Related
- See PLAN.md Phase 2 for full details
- Part of Milestone M1 - Foundation (Weeks 1-2)" \
  --label "phase-2,data-layer"

echo -e "${GREEN}✓ Created Phase 2 issue${NC}"

# Phase 3: Map Engine
echo -e "\n${BLUE}Creating Phase 3 issue...${NC}"
gh issue create \
  --title "Phase 3: Map Engine" \
  --body "## Overview
Implement the map rendering engine for displaying geographic data.

## Tasks
- [ ] Research and select map library (Leaflet, Mapbox, or custom SVG)
- [ ] Implement map rendering for print output
- [ ] Add marker placement functionality
- [ ] Support custom styling for print
- [ ] Create map configuration options
- [ ] Add integration tests

## Related
- See PLAN.md Phase 3 for full details
- Part of Milestone M2 - Core Rendering (Weeks 3-5)" \
  --label "phase-3,map-engine,core-rendering"

echo -e "${GREEN}✓ Created Phase 3 issue${NC}"

# Phase 4: Picture Border Engine
echo -e "\n${BLUE}Creating Phase 4 issue...${NC}"
gh issue create \
  --title "Phase 4: Picture Border Engine" \
  --body "## Overview
Implement the picture border engine for arranging and rendering pictures around the map.

## Tasks
- [ ] Design picture layout algorithm
  - Calculate border dimensions
  - Distribute pictures evenly
  - Handle variable picture sizes
- [ ] Implement picture positioning
- [ ] Add picture frame/styling options
- [ ] Ensure print quality (DPI, resolution)
- [ ] Add unit tests for layout algorithms

## Related
- See PLAN.md Phase 4 for full details
- Part of Milestone M2 - Core Rendering (Weeks 3-5)" \
  --label "phase-4,picture-border,core-rendering"

echo -e "${GREEN}✓ Created Phase 4 issue${NC}"

# Phase 5: Link Manager
echo -e "\n${BLUE}Creating Phase 5 issue...${NC}"
gh issue create \
  --title "Phase 5: Link Manager" \
  --body "## Overview
Implement the link manager for connecting pictures to map markers.

## Tasks
- [ ] Implement picture-to-marker linking logic
- [ ] Add visual link indicators (lines, numbers, etc.)
- [ ] Support various link styles
- [ ] Handle edge cases (multiple pictures per location)
- [ ] Add tests for link rendering

## Related
- See PLAN.md Phase 5 for full details
- Part of Milestone M3 - Integration (Weeks 6-7)" \
  --label "phase-5,link-manager,integration"

echo -e "${GREEN}✓ Created Phase 5 issue${NC}"

# Phase 6: Compositor & Rendering
echo -e "\n${BLUE}Creating Phase 6 issue...${NC}"
gh issue create \
  --title "Phase 6: Compositor & Rendering" \
  --body "## Overview
Implement the compositor to combine map and picture border elements into final output.

## Tasks
- [ ] Combine map and picture border elements
- [ ] Implement layout engine for final composition
- [ ] Add support for different page sizes (A4, Letter, custom)
- [ ] Ensure proper alignment and spacing
- [ ] Add preview functionality
- [ ] Integration tests for full rendering

## Related
- See PLAN.md Phase 6 for full details
- Part of Milestone M3 - Integration (Weeks 6-7)" \
  --label "phase-6,compositor,rendering,integration"

echo -e "${GREEN}✓ Created Phase 6 issue${NC}"

# Phase 7: Export Engine
echo -e "\n${BLUE}Creating Phase 7 issue...${NC}"
gh issue create \
  --title "Phase 7: Export Engine" \
  --body "## Overview
Implement the export engine for generating print-ready output formats.

## Tasks
- [ ] Implement SVG export
  - Ensure all elements are vector-based
  - Embed or reference images appropriately
- [ ] Implement PDF export
  - Research PDF generation library
  - Maintain print quality
- [ ] Implement EPS export (if needed)
- [ ] Add export configuration options
- [ ] Validate output quality

## Related
- See PLAN.md Phase 7 for full details
- Part of Milestone M4 - Export (Weeks 8-9)" \
  --label "phase-7,export,svg,pdf"

echo -e "${GREEN}✓ Created Phase 7 issue${NC}"

# Phase 8: User Interface
echo -e "\n${BLUE}Creating Phase 8 issue...${NC}"
gh issue create \
  --title "Phase 8: User Interface (Optional)" \
  --body "## Overview
Implement user interface options for configuration and interaction.

## Tasks
- [ ] Design configuration file format (JSON/YAML)
- [ ] Create CLI for batch processing
- [ ] Consider web-based editor for interactive design
- [ ] Add preview functionality
- [ ] Documentation for UI usage

## Related
- See PLAN.md Phase 8 for full details
- Part of Milestone M5 - Polish (Weeks 10-12)" \
  --label "phase-8,ui,cli,optional"

echo -e "${GREEN}✓ Created Phase 8 issue${NC}"

# Phase 9: Documentation & Examples
echo -e "\n${BLUE}Creating Phase 9 issue...${NC}"
gh issue create \
  --title "Phase 9: Documentation & Examples" \
  --body "## Overview
Create comprehensive documentation and examples for the project.

## Tasks
- [ ] Write comprehensive README
- [ ] Create API documentation
- [ ] Provide usage examples
- [ ] Include sample datasets
- [ ] Tutorial/getting started guide

## Related
- See PLAN.md Phase 9 for full details
- Part of Milestone M5 - Polish (Weeks 10-12)" \
  --label "phase-9,documentation,examples"

echo -e "${GREEN}✓ Created Phase 9 issue${NC}"

# Phase 10: Testing & Refinement
echo -e "\n${BLUE}Creating Phase 10 issue...${NC}"
gh issue create \
  --title "Phase 10: Testing & Refinement" \
  --body "## Overview
Perform comprehensive testing and refinement of the entire system.

## Tasks
- [ ] End-to-end testing with real data
- [ ] Performance optimization
- [ ] Print output validation
- [ ] Cross-platform testing
- [ ] Bug fixes and refinements

## Related
- See PLAN.md Phase 10 for full details
- Part of Milestone M5 - Polish (Weeks 10-12)" \
  --label "phase-10,testing,refinement,quality-assurance"

echo -e "${GREEN}✓ Created Phase 10 issue${NC}"

echo -e "\n════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Successfully created all 10 phase issues!${NC}"
echo -e "\nView issues at: https://github.com/bmordue/pic-map/issues"
