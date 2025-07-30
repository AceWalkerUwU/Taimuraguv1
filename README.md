# 🎵 TAIMURAGU

**Master the art of delayed precision**

Taimuragu is an innovative rhythm-reaction game that challenges players with a unique twist on timing-based gameplay. Instead of clicking targets immediately when they appear, each target displays a countdown timer showing how many milliseconds you must wait before clicking it. The challenge lies in tracking multiple targets simultaneously and responding at precisely the right moment.

## 🎯 Core Concept

- **Delayed Precision**: Each target shows a number (e.g., "300") indicating milliseconds to wait
- **Mental Management**: Track multiple countdown timers simultaneously  
- **Perfect Timing**: Click when timers reach zero for maximum points
- **Musical Synchronization**: Targets spawn in sync with the beat

## ✨ Features

### 🎮 Game Modes
- **Play Mode**: Experience the full Taimuragu challenge
- **Demo Metronome**: Try the game with a built-in 120 BPM metronome
- **Custom Songs**: Upload your own music files for personalized gameplay

### 🛠️ Built-in Map Editor
- **Visual Interface**: Point-and-click target placement on a grid
- **Beat Detection**: Automatic beat analysis for uploaded songs
- **Custom Delays**: Set precise timing delays for each target (100-2000ms)
- **Multiple Shapes**: Choose between circle and square targets
- **Timeline Control**: Scrub through songs and place targets with precision
- **Save/Load**: Export and share custom level files

### 🎨 Visual Design
- **Modern UI**: Sleek, responsive interface with smooth animations
- **Particle Effects**: Dynamic visual feedback for hits and misses
- **Color Coding**: Targets change color based on delay duration
- **Countdown Rings**: Visual progress indicators for each target
- **Beat Synchronization**: Screen effects pulse with the music

### 🎵 Audio System
- **Advanced Beat Detection**: Automatic analysis of uploaded audio files
- **Real-time Processing**: Web Audio API for precise timing
- **Multiple Formats**: Support for common audio file formats
- **Volume Control**: Adjustable audio levels

## 🎯 How to Play

### Basic Gameplay
1. **Target Spawning**: Circles and squares appear on a 6x6 grid
2. **Read the Timer**: Each target shows its delay in milliseconds
3. **Wait and Watch**: Multiple timers count down simultaneously
4. **Perfect Timing**: Click when a timer reaches zero (±25ms for perfect score)
5. **Prioritize**: Choose which target to hit when multiple are ready

### Scoring System
- **Perfect (±25ms)**: 100 points + combo continues
- **Great (±50ms)**: 75 points + combo continues  
- **Good (±100ms)**: 50 points + combo continues
- **Miss**: -10 points + combo breaks

### Visual Cues
- **Color Coding**: 
  - Red: Short delays (≤200ms)
  - Teal: Medium delays (≤500ms)
  - Blue: Longer delays (≤1000ms)
  - Green: Very long delays (>1000ms)
- **Glow Intensity**: Increases as delay approaches zero
- **Scale Animation**: Targets pulse faster when ready to click

## 🛠️ Map Editor Guide

### Getting Started
1. Click "MAP EDITOR" from the main menu
2. Load a song using "Load Song" button
3. Use the timeline to navigate through the track
4. Click on grid cells to place targets

### Editor Controls
- **Left Click**: Place new target or select existing
- **Right Click**: Delete target
- **Spacebar**: Play/pause audio
- **Delete/Backspace**: Remove selected targets
- **Ctrl+A**: Select all targets
- **Ctrl+C/V**: Copy and paste targets
- **Escape**: Deselect all

### Settings
- **Target Type**: Choose circle or square shapes
- **Delay**: Set countdown timer (100-2000ms)
- **Grid Size**: 4x4, 6x6, or 8x8 layouts
- **Snap to Beat**: Automatically align targets with detected beats

### Saving and Loading
- **Save Map**: Export as JSON file for sharing
- **Load Map**: Import previously created levels
- **Clear All**: Remove all targets (with confirmation)

## 💻 Technical Requirements

### Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Web Audio API**: Required for audio processing
- **Canvas 2D**: For game rendering
- **File API**: For song and map uploads
- **ES6 Support**: Modern JavaScript features

### Performance
- **Target FPS**: 60 FPS for smooth gameplay
- **Memory Usage**: Efficient audio buffer management
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Installation and Setup

### Quick Start
1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. No build process or dependencies required!

### Local Development
```bash
# Serve files locally (recommended)
python -m http.server 8000
# or
npx serve .
# or use any local web server
```

### File Structure
```
taimuragu/
├── index.html          # Main application
├── styles.css          # Complete styling
├── js/
│   ├── audio.js        # Audio management and beat detection
│   ├── game.js         # Core game engine
│   ├── editor.js       # Map editor functionality
│   ├── ui.js          # UI controller
│   └── main.js        # Application initialization
└── README.md          # This file
```

## 🎨 Customization

### Adding Custom Songs
1. Click "Upload Your Own Song" on song selection
2. Choose any audio file (MP3, WAV, OGG, etc.)
3. The game automatically analyzes beats and creates a demo pattern
4. Or use the Map Editor to create custom patterns

### Creating Custom Maps
1. Open the Map Editor
2. Load your audio file
3. Place targets throughout the song
4. Adjust delays and target types
5. Save and share your creation

### Modifying Game Settings
Access the debug console in development:
```javascript
// Change game settings
TaimuraguAPI.settings.set('volume', 0.5);
TaimuraguAPI.settings.set('visualEffects', false);

// View performance info
TaimuraguAPI.performance();

// Export game data
TaimuraguAPI.debug.exportData();
```

## 🎯 Gameplay Tips

### For Beginners
- Start with the metronome demo to understand the concept
- Focus on one target at a time initially
- Use color coding to prioritize shorter delays
- Don't panic - accuracy is more important than speed

### Advanced Techniques
- **Peripheral Vision**: Track multiple timers simultaneously
- **Pattern Recognition**: Learn common delay combinations
- **Beat Anticipation**: Use music rhythm to predict new targets
- **Combo Management**: Prioritize maintaining streaks over risky hits

## 🛡️ Troubleshooting

### Audio Issues
- **No Sound**: Check browser audio permissions
- **Delay Problems**: Ensure Web Audio API is supported
- **File Loading**: Try different audio formats (MP3 recommended)

### Performance Issues
- **Low FPS**: Close other browser tabs and applications
- **Memory Usage**: Refresh page after extended play sessions
- **Mobile Performance**: Use smaller grid sizes (4x4) on mobile

### Browser Compatibility
- **Firefox**: May require manual audio context initialization
- **Safari**: Some audio formats may not be supported
- **Mobile Chrome**: Touch events are supported

## 🤝 Contributing

Taimuragu is designed to be extensible and community-friendly:

### Ways to Contribute
- **Create Maps**: Design and share challenging levels
- **Report Bugs**: Use the debug console to export error logs
- **Suggest Features**: Ideas for new game modes or mechanics
- **Optimize Performance**: Improvements to rendering or audio processing

### Development
- **No Build Process**: Pure HTML/CSS/JavaScript
- **Modular Design**: Each system is in its own file
- **Debug Mode**: Comprehensive debugging tools included
- **Error Handling**: Robust error logging and recovery

## 📜 License

This project is open source and available under the MIT License.

## 🎵 Credits

Created with ❤️ for rhythm game enthusiasts.

**Technologies Used:**
- Web Audio API for audio processing
- Canvas 2D for game rendering  
- CSS3 for modern styling and animations
- JavaScript ES6+ for game logic

**Special Thanks:**
- The rhythm game community for inspiration
- Web Audio API developers for making this possible
- Players who will create amazing custom maps

---

**Ready to master the art of delayed precision?**  
🎯 Launch Taimuragu and start your journey!