# Estakada 99 — Samsung Tizen TV

A Tizen web app that streams the Estakada 99 live broadcast on Samsung smart TVs.

Ported from the [Android TV version](https://github.com/jpgamboa/Estakada99-TV).

## Features

- Live stream playback via HTML5 audio
- Fullscreen UI optimized for 1920x1080 TV screens
- Bouncing logo animation (DVD-style)
- Pulsing background animation
- Play/pause button that appears on remote interaction and auto-hides after 15 seconds
- Auto-reconnect on stream error
- Keeps screen on during playback
- Clock display
- Samsung remote control support (OK, Play, Pause, Back)

## Project Structure

```
Estakada99-Tizen/
├── config.xml          # Tizen app manifest
├── icon.png            # App icon (117x117)
├── index.html          # Entry point
├── css/style.css       # Animations and layout
├── js/app.js           # Playback, bounce, remote input
└── images/
    ├── background.png
    ├── banner.png
    └── logo.png
```

## Building the .wgt Package

The `.wgt` is just a zip of the project contents:

```bash
cd Estakada99-Tizen
zip -r Estakada99TV.wgt *
```

## Installing on a Samsung TV (Sideload)

1. On the TV, go to **Settings > Apps**, type `12345` on the remote to enter **Developer Mode**
2. Enable Developer Mode and set your computer's IP address
3. Restart the TV
4. On your computer, connect via Samsung's debug bridge:
   ```bash
   sdb connect <TV_IP_ADDRESS>
   sdb install Estakada99TV.wgt
   ```
5. The app will appear in the TV's app list

## Remote Control

| Button | Action |
|---|---|
| OK / Enter | Show play/pause button (first press), then toggle playback |
| Play | Play stream |
| Pause | Pause stream |
| Play/Pause | Toggle playback |
| Back | Exit the app |
| Any other key | Show the play/pause button |

## Requirements

- Samsung Smart TV running Tizen 2.3 or higher
- Internet connection
- For sideloading: Samsung `sdb` tool (included with [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download))

## Publishing to Samsung TV App Store

The sideloaded `.wgt` is unsigned, which is fine for development. To publish:

1. Install [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download)
2. Import the project as a Tizen Web Application
3. Register for a [Samsung Seller Office](https://seller.samsungapps.com/) account
4. Generate a certificate via Tizen Studio's Certificate Manager
5. Sign and package the app
6. Submit through Seller Office

## Tech Stack

| Component | Technology |
|---|---|
| Language | HTML / CSS / JavaScript |
| Player | HTML5 `<audio>` element |
| Animations | CSS keyframes + requestAnimationFrame |
| Platform | Tizen Web API |
| Min Tizen | 2.3 |
