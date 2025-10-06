# Mondrian

A web-based Mondrian-style art generator inspired by the geometric abstract paintings of [Piet Mondrian](https://en.wikipedia.org/wiki/Piet_Mondrian). Create unique compositions featuring rectangles, customizable colors, and bold lines.

## Features

- **Interactive Art Generation**: Create unique Mondrian-style compositions with adjustable parameters
- **Customizable Settings**:
  - Complexity levels (2-15)
  - Multiple color palettes with intelligent color generation
  - Border width and color customization
  - External border and corner radius controls
  - Advanced split ratios and probability settings
- **Paint Mode**: Click rectangles to cycle through colors interactively
- **Multiple Export Formats**: Download as SVG, PNG, or WebP
- **URL Sharing**: Share your creations via URL with all settings preserved
- **Fullscreen Mode**: View your art in fullscreen with keyboard and touch controls
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Live Demo

Visit [getmondrian.com](https://getmondrian.com) to try it out!

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

```bash
npm run build
npm start
```

## How It Works

The generator uses a recursive subdivision algorithm with a seeded random number generator to create reproducible patterns. Parameters like complexity, split ratios, and probabilities control how the canvas is divided into rectangles, each filled with a color from your chosen palette.

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Icons**: Lucide React
- **Deployment**: Optimized for Vercel

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Created by [Tim Mikeladze](https://github.com/TimMikeladze)

## Support

If you enjoy this project, consider [buying me a coffee](https://www.buymeacoffee.com/linesofcode)!
