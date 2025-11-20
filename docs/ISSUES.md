# GitHub Issues for Implementation Phases

This document explains how to create GitHub issues for each of the 10 implementation phases defined in [PLAN.md](./PLAN.md).

## Overview

The PLAN.md file defines 10 implementation phases for the pic-map project. To track progress on each phase, we create corresponding GitHub issues. This approach provides:

- **Visibility**: Each phase has a dedicated issue for discussion and tracking
- **Organization**: Issues are labeled by phase, component, and milestone
- **Collaboration**: Team members can be assigned to specific phases
- **Progress Tracking**: Task lists within issues show completion status

## Implementation Phases

The following 10 issues will be created:

1. **Phase 1: Project Setup & Foundation** - Labels: `phase-1`, `setup`, `foundation`
2. **Phase 2: Data Layer** - Labels: `phase-2`, `data-layer`
3. **Phase 3: Map Engine** - Labels: `phase-3`, `map-engine`, `core-rendering`
4. **Phase 4: Picture Border Engine** - Labels: `phase-4`, `picture-border`, `core-rendering`
5. **Phase 5: Link Manager** - Labels: `phase-5`, `link-manager`, `integration`
6. **Phase 6: Compositor & Rendering** - Labels: `phase-6`, `compositor`, `rendering`, `integration`
7. **Phase 7: Export Engine** - Labels: `phase-7`, `export`, `svg`, `pdf`
8. **Phase 8: User Interface (Optional)** - Labels: `phase-8`, `ui`, `cli`, `optional`
9. **Phase 9: Documentation & Examples** - Labels: `phase-9`, `documentation`, `examples`
10. **Phase 10: Testing & Refinement** - Labels: `phase-10`, `testing`, `refinement`, `quality-assurance`

## How to Create the Issues

Three methods are provided:

### Method 1: GitHub CLI (Recommended)

Use the provided shell script with the GitHub CLI:

```bash
# Ensure gh is installed and authenticated
gh auth login

# Run the script
./scripts/create-issues.sh
```

This is the fastest and easiest method for most users.

### Method 2: Node.js Script

Use the provided Node.js script with a GitHub Personal Access Token:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here

# Run the script
node scripts/create-issues.js
```

This method is useful for automation or CI/CD pipelines.

### Method 3: Manual Creation

If you prefer to create issues manually:

1. Open the [issues-to-create.json](./issues-to-create.json) file
2. For each issue in the array:
   - Create a new issue in GitHub
   - Copy the title
   - Copy the body (in markdown format)
   - Add the specified labels

## Issue Structure

Each issue follows this structure:

```markdown
## Overview
Brief description of the phase

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Related
- See PLAN.md Phase X for full details
- Part of Milestone MX - Name (Weeks X-Y)
```

## Labels

Issues use a hierarchical labeling system:

- **Phase labels**: `phase-1` through `phase-10` - identifies the implementation phase
- **Component labels**: `data-layer`, `map-engine`, `export`, etc. - identifies the component being developed
- **Milestone labels**: `foundation`, `core-rendering`, `integration`, etc. - groups phases by milestone
- **Type labels**: `setup`, `documentation`, `testing`, etc. - indicates the type of work

## Tracking Progress

Once issues are created:

1. **Assign team members** to issues they'll work on
2. **Check off tasks** as they're completed
3. **Add comments** for discussion and updates
4. **Link pull requests** that implement parts of the phase
5. **Close the issue** when all tasks are complete

## Relationship to PLAN.md

The issues are derived directly from PLAN.md sections:

- **Issue Title**: Matches the phase heading in PLAN.md
- **Issue Body**: Contains the tasks listed under each phase
- **Labels**: Reflect the component, milestone, and type from PLAN.md

When PLAN.md is updated, the corresponding issues should be updated to stay in sync.

## Resources

- [PLAN.md](./PLAN.md) - Full project plan with all implementation phases
- [issues-to-create.json](./issues-to-create.json) - Structured issue definitions
- [scripts/create-issues.sh](../scripts/create-issues.sh) - GitHub CLI script
- [scripts/create-issues.js](../scripts/create-issues.js) - Node.js script
- [scripts/README.md](../scripts/README.md) - Detailed script documentation
