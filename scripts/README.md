# Scripts

This directory contains utility scripts for the pic-map project.

## Overview

These scripts create GitHub issues for the 10 implementation phases defined in `docs/PLAN.md`. Each phase becomes a tracked issue with appropriate labels and task lists.

Two scripts are provided:
- `create-issues.sh` - Uses GitHub CLI (gh) - recommended for most users
- `create-issues.js` - Uses Node.js and GitHub API - for automation/CI

## create-issues.sh (Recommended)

Creates GitHub issues using the GitHub CLI tool.

### Prerequisites

1. GitHub CLI (gh) installed - https://cli.github.com/
2. Authenticated with: `gh auth login`

### Usage

```bash
./scripts/create-issues.sh
```

Simple, fast, and uses your existing GitHub authentication.

## create-issues.js

Creates GitHub issues from the structured issue definitions in `docs/issues-to-create.json`.

### Prerequisites

1. A GitHub Personal Access Token with `repo` scope
2. Node.js installed (the script uses built-in modules only)

### Usage

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token_here

# Run the script
node scripts/create-issues.js
```

### What it does

1. Reads all issue definitions from `docs/issues-to-create.json`
2. Creates each issue in the `bmordue/pic-map` repository
3. Applies the specified labels to each issue
4. Adds a 1-second delay between issues to avoid rate limiting
5. Provides a summary of created and failed issues

### Example output

```
Loaded 10 issues to create

Starting to create 10 issues...

════════════════════════════════════════════════════════════

Creating issue: "Phase 1: Project Setup & Foundation"
✓ Created issue #1: https://github.com/bmordue/pic-map/issues/1

Creating issue: "Phase 2: Data Layer"
✓ Created issue #2: https://github.com/bmordue/pic-map/issues/2

...

════════════════════════════════════════════════════════════

Summary:
  ✓ Successfully created: 10 issues

Done!
```

### Getting a GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "pic-map issue creator")
4. Select the `repo` scope
5. Click "Generate token"
6. Copy the token and set it in your environment

### Troubleshooting

**Error: GITHUB_TOKEN environment variable is not set**
- Make sure you've exported the token: `export GITHUB_TOKEN=your_token`

**Error: HTTP 401**
- Your token may be invalid or expired. Generate a new one.

**Error: HTTP 403**
- Your token may not have the required `repo` scope.

**Error: HTTP 404**
- Check that the repository owner and name are correct in the script.
