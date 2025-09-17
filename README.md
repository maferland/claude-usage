# Claude Usage Monitor

A native desktop application built with Tauri that monitors your Claude API usage costs in real-time. Features a system tray integration for quick access to daily spending and detailed usage trends.

## Features

- **Real-time Usage Tracking**: Monitor your Claude API costs with configurable polling intervals (1min, 5min, 10min)
- **System Tray Integration**: Always-visible cost display in your system tray with quick access menu
- **Daily & Weekly Trends**: Visual charts showing usage patterns over the past 7 days
- **Background Monitoring**: Runs quietly in the background, hiding to tray instead of closing

## Requirements

- Node.js 18+ with pnpm
- Rust (for development)
- ccusage CLI tool (`bunx ccusage` must be available)
- Valid Claude API credentials configured for ccusage

## Installation

### Development Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd claude-usage
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm tauri dev
   ```

### Building for Production

```bash
pnpm tauri build
```

The built application will be available in `src-tauri/target/release/bundle/`.

## Usage

### First Run

1. Ensure you have the `ccusage` CLI tool installed and configured with your Claude API credentials
2. Launch the application - it will appear in your system tray
3. Click the tray icon to open the main window
4. Configure your preferred polling frequency in the Settings tab

### System Tray

- **Left click**: Toggle main window visibility
- **Right click**: Access context menu with quit option
- **Tray title**: Shows today's current cost (e.g., "$1.23")
- **Tooltip**: Displays today's cost and current mode

### Main Interface

The application features three main tabs:

- **Dashboard**: Today's usage, weekly/monthly totals, and last update time
- **Trends**: 7-day visual chart with usage statistics and daily comparisons
- **Settings**: Configure polling frequency and auto-start preferences

### Data Sources

The application fetches usage data by executing `bunx ccusage --json` directly, ensuring you always get the most up-to-date information from the Claude API.

## Configuration

### Polling Frequencies

- **1 Minute**: Fast updates for active development (red indicator)
- **5 Minutes**: Balanced updates for regular monitoring (orange indicator)
- **10 Minutes**: Slower updates to conserve resources (green indicator)

### Auto-start

Enable auto-start to have the application launch automatically when your system boots.

## Troubleshooting

### Common Issues

**"No usage data available"**

- Ensure `bunx ccusage --json` works in your terminal
- Verify your Claude API credentials are properly configured
- Check that you have an active internet connection

**Window won't close**

- This is by design - the application hides to the system tray instead of closing
- Right-click the system tray icon and select "Quit" to fully exit

**Data showing $0.00**

- This usually indicates ccusage isn't returning valid data
- Try running `bunx ccusage` manually to verify it's working
- Check the application logs for any error messages

## Development

### Architecture

- **Frontend**: React + TypeScript with Vite
- **Backend**: Rust with Tauri v2
- **Data Source**: ccusage CLI tool via direct execution
- **State Management**: Tauri's state management with Rust mutexes

### Key Files

- `src-tauri/src/lib.rs`: Main Rust backend with API handlers and system tray logic
- `src/App.tsx`: Main React application component
- `src/components/`: React components for dashboard, trends, and settings
- `src/types/index.ts`: TypeScript interfaces for data structures

### Building

The application uses Tauri's standard build process:

```bash
# Development
pnpm tauri dev

# Production build
pnpm tauri build

# Frontend only (for testing)
pnpm dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions to Claude Usage Monitor! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test` (if available)
5. Build the app: `pnpm tauri build`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow existing TypeScript/Rust conventions
- **Testing**: Ensure your changes don't break existing functionality
- **Documentation**: Update README.md if you add new features
- **Commit Messages**: Use clear, descriptive commit messages

### Types of Contributions

- 🐛 **Bug Fixes**: Report or fix issues with the application
- ✨ **Features**: Add new functionality or improve existing features
- 📚 **Documentation**: Improve docs, add examples, or clarify usage
- 🎨 **UI/UX**: Enhance the user interface or user experience
- ⚡ **Performance**: Optimize code or reduce resource usage

### Reporting Issues

When reporting bugs, please include:

- Operating system and version
- Steps to reproduce the issue
- Expected vs actual behavior
- Console logs or error messages
- Screenshots if applicable

### Questions?

Feel free to open an issue for questions about development, usage, or feature requests.
