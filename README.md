# Take a Break Reminder - Chrome Extension

A simple yet powerful Chrome extension that reminds users to step away from their screens, stretch, hydrate, or rest their eyes—perfect for remote workers and desk warriors.

## 🌟 Features

- **Customizable Break Intervals**: Set break reminders from 20 minutes to 2 hours
- **Flexible Break Duration**: Choose break lengths from 5 to 20 minutes
- **Desktop Notifications**: Get notified when it's time for a break
- **Sound Alerts**: Audio notifications to grab your attention
- **Break Overlay**: Beautiful full-screen overlay with break suggestions
- **Break Timer**: Countdown timer during break periods
- **Pause/Resume**: Pause the timer when needed
- **Skip Breaks**: Skip breaks and restart the timer
- **Extend Breaks**: Add 5 minutes to your current break
- **Settings Persistence**: Your preferences are saved across browser sessions
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Supports high contrast and reduced motion preferences

## 🚀 Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download/Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the `take-a-break-extension` folder
5. **Pin the extension** to your toolbar for easy access

### Method 2: Chrome Web Store (When Published)

1. Visit the Chrome Web Store
2. Search for "Take a Break Reminder"
3. Click "Add to Chrome"
4. Confirm the installation

## 📱 Usage

### Getting Started

1. **Click the extension icon** in your Chrome toolbar
2. **Configure your preferences**:
   - Set break interval (how often you want reminders)
   - Set break duration (how long each break should be)
   - Enable/disable notifications and sounds
3. **Click "Start Timer"** to begin

### During Breaks

- **Break Overlay**: A beautiful full-screen overlay appears with break suggestions
- **Break Timer**: Countdown shows remaining break time
- **Skip Break**: Click to skip and restart the timer
- **Extend Break**: Add 5 minutes to your current break

### Controls

- **Start/Stop**: Toggle the timer on and off
- **Pause**: Pause the timer temporarily
- **Skip**: Skip to break immediately
- **Reset**: Reset all settings to defaults

## ⚙️ Configuration

### Break Intervals
- 20 minutes (Pomodoro technique)
- 30 minutes
- 45 minutes
- 1 hour
- 1.5 hours
- 2 hours

### Break Durations
- 5 minutes (quick stretch)
- 10 minutes (short break)
- 15 minutes (medium break)
- 20 minutes (long break)

### Notification Settings
- **Desktop Notifications**: Show system notifications
- **Sound Alerts**: Play audio when breaks start/end

## 🎨 Break Suggestions

The extension provides helpful suggestions during breaks:

- **👀 20-20-20 Rule**: Look 20 feet away for 20 seconds every 20 minutes
- **💧 Hydration**: Drink water to stay healthy
- **🧘 Stretching**: Do light stretching exercises
- **🚶 Walking**: Take a short walk around your space
- **🌱 Nature**: Look at something green or natural

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Uses the latest Chrome extension manifest
- **Service Worker**: Background script for alarms and notifications
- **Content Scripts**: Injects break overlays into web pages
- **Storage API**: Syncs settings across devices
- **Notifications API**: Desktop notifications with action buttons

### Files Structure
```
take-a-break-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── background.js         # Service worker
├── content.js            # Content script for web pages
├── content.css           # Content script styling
├── icons/                # Extension icons
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

### Permissions
- **storage**: Save user preferences
- **notifications**: Show desktop notifications
- **alarms**: Schedule break reminders
- **scripting**: Inject content scripts

## 🎯 Best Practices

### For Productivity
- Start with 20-minute intervals (Pomodoro technique)
- Take 5-minute breaks for quick stretches
- Use longer breaks for lunch or exercise

### For Eye Health
- Follow the 20-20-20 rule
- Look at distant objects
- Blink regularly
- Adjust screen brightness

### For Physical Health
- Stand up and stretch
- Walk around your workspace
- Do shoulder and neck exercises
- Stay hydrated

## 🐛 Troubleshooting

### Common Issues

**Extension not working:**
- Check if Developer Mode is enabled
- Reload the extension
- Check browser console for errors

**Notifications not showing:**
- Ensure notification permissions are granted
- Check if Do Not Disturb is enabled
- Verify extension is not blocked

**Timer not counting down:**
- Check if the extension is active
- Try refreshing the popup
- Restart the timer

### Getting Help

1. Check the browser console for error messages
2. Verify all files are present in the extension folder
3. Try reloading the extension
4. Check Chrome's extension error page

## 🚀 Development

### Local Development
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test your changes

### Building for Distribution
1. Create icon files in the required sizes
2. Test thoroughly on different websites
3. Package the extension
4. Submit to Chrome Web Store

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have suggestions:
1. Check the troubleshooting section
2. Open an issue on GitHub
3. Contact the development team

---

**Happy Breaks, Happy Productivity! 🎉**

Remember: Taking regular breaks is not just good for your health—it's essential for maintaining focus and productivity throughout your workday.


