# SumVid - AI Video Summarizer Chrome Extension

A powerful Chrome extension that helps you understand YouTube videos better by providing AI-powered summaries, interactive quizzes, and a smart Q&A system - all written at a 5th-grade reading level for maximum accessibility.

## Features

- **Smart Video Detection**: Automatically detects when you're watching a YouTube video
- **AI-Powered Summaries**: Get clear, easy-to-understand summaries of video content
- **Interactive Quizzes**: Test your understanding with automatically generated multiple-choice questions
- **Q&A System**: Ask questions about the video and get simple, clear answers
- **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing
- **Copy & Share**: Export summaries, quiz results, and chat conversations
- **Accessibility Focus**: All content is written at a 5th-grade reading level
- **Visual Status Indicators**: Clear feedback about processing and completion status

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top-right corner
6. Click "Load unpacked" and select the `dist` directory
7. The extension is now installed and ready to use

## Usage

1. Navigate to any YouTube video
2. Wait for the extension icon to show a checkmark (✓), indicating a video was detected
3. Click the extension icon to open the popup
4. Use the following features:
   - View the AI-generated summary
   - Take a quiz to test your understanding
   - Ask questions about the video content
   - Toggle dark mode for comfortable viewing
   - Copy and share your learning materials

## How It Works

The extension uses:
- Content scripts to detect and extract video information
- GPT-3.5 for generating summaries, quizzes, and answering questions
- Chrome Extension APIs for seamless integration
- Modern web technologies for a smooth user experience

## Technical Details

Built with:
- JavaScript/TypeScript
- Chrome Extension APIs
- OpenAI GPT-3.5
- HTML/CSS
- Vite for building

## File Structure

```
/
├── dist/                  # Built extension files
├── src/                   # Source files
├── icons/                 # Extension icons
├── manifest.json          # Extension configuration
├── background.js         # Background service worker
├── content.js           # Content script for YouTube pages
├── popup.html           # Popup interface
├── popup.css            # Popup styling
└── popup.js             # Popup functionality
```

## Version History

### V2.2.0 (Current)
- Improved error handling and connection stability
- Enhanced message passing between components
- Better state management for video processing
- Improved dark mode implementation
- Added retry mechanism for failed operations

### V2.1.0
- Added dark mode support
- Improved UI/UX design
- Added copy/export functionality
- Enhanced quiz system

### V2.0.0
- Complete rewrite with AI integration
- Added summary generation
- Added quiz functionality
- Added Q&A system

### V1.0.0
- Initial release with basic video detection

## License

MIT