# Copilot Instructions for pic-map

## Project Overview

This project is a template for creating maps that display a standard map view in the center of the page, with a border composed of a row of pictures. Each picture links to a place marker on the map.

**Example Use Cases:**
- A city center map with pictures linked to business advertisements
- A holiday trip map with photos linked to the places where they were taken

## Target Output

The project targets **print as the final output format**, supporting formats like:
- SVG
- EPS
- PDF

The interim representation should be editable and allow for iteration.

## Technology Stack

- **Primary Language:** TypeScript
- **Package Manager:** npm (as indicated by package.json)

## Project Goals

Create a flexible, print-ready map visualization tool that combines geographic information with visual media through an intuitive interface.

## Development Guidelines

### Code Style
- Use TypeScript for all source code
- Follow TypeScript best practices and type safety
- Prefer clear, descriptive variable and function names

### Testing
- Ensure any new features include appropriate tests
- Test output formats to verify print readiness

### Documentation
- Update README.md when adding significant features
- Document any new configuration options or APIs

### Commit Messages
- Use clear, descriptive commit messages
- Reference issue numbers when applicable

## Project Structure

The project is currently in early development. When adding new files:
- Source code should use TypeScript
- Keep dependencies minimal and purposeful
- Consider the print output requirements when selecting libraries

## When Working on Issues

- Focus on the print-ready output requirement
- Consider both the map visualization and picture border components
- Ensure compatibility with SVG/EPS/PDF output formats
- Think about the user workflow: how will they add pictures and link them to map markers?
