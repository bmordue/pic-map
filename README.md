# Pic-Map

This project is a template for maps that display the usual map view in the centre of the page, but have a border made up of a row of pictures. Each picture will have a link to a place marker on the map.

It could for example be a map of a city centre, with adverts linked to businesses; or it could be a map showing a holiday trip, with photos linked to the places they were taken. It should target print as the final output, so perhaps SVG, EPS, PDF, as long as there's an interim representation that can be edited and iterated on. Use typescript.

## Project Planning

- **[PLAN.md](docs/PLAN.md)** - Complete implementation plan with 10 phases
- **[ISSUES.md](docs/ISSUES.md)** - Guide for creating GitHub issues for each phase

### Creating Implementation Phase Issues

To track progress on the implementation plan, create GitHub issues for each phase:

```bash
# Option 1: Using GitHub CLI (recommended)
./scripts/create-issues.sh

# Option 2: Using Node.js and GitHub API
export GITHUB_TOKEN=your_token
node scripts/create-issues.js
```

See [docs/ISSUES.md](docs/ISSUES.md) for detailed instructions.
