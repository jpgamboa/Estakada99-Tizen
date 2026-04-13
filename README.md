# Estakada 99 — Samsung Tizen TV

A Tizen web app that streams the Estakada 99 live broadcast on Samsung smart TVs.

### Other platforms

- **Android TV** — [Estakada99-TV](https://github.com/jpgamboa/Estakada99-TV)
- **LG (WebOS)** — [Estakada99-WebOS](https://github.com/jpgamboa/Estakada99-WebOS)

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
├── config.xml              # Tizen app manifest
├── icon.png                # App icon (117x117)
├── index.html              # Entry point
├── Estakada99-Tizen.wgt    # Pre-built package (ready to install)
├── css/
│   ├── style.css           # Styles, gradient, Satoshi font
│   ├── satoshi-regular.ttf
│   └── satoshi-bold.ttf
├── js/app.js               # Playback, bounce, now-playing, sky gradient
└── images/
    ├── banner.png
    └── logo.png
```

## Installing on a Samsung TV (Sideload)

A pre-built `Estakada99-Tizen.wgt` is included in the repo — no build step needed.

### Building the .wgt from source

The `.wgt` is just a zip of the project contents:

```bash
cd Estakada99-Tizen
zip -r Estakada99-Tizen.wgt config.xml icon.png index.html css js images
```

## Installing on a Samsung TV (Sideload)

Samsung does not allow `.wgt` files to be installed via USB — sideloading must be done over Wi-Fi using Samsung's debug bridge (`sdb`).

1. On the TV, go to **Settings > Apps**, type `12345` on the remote to enter **Developer Mode**
2. Enable Developer Mode and set your computer's IP address
3. Restart the TV
4. On your computer, connect via Samsung's debug bridge:
   ```bash
   sdb connect <TV_IP_ADDRESS>
   sdb install Estakada99-Tizen.wgt
   ```
5. The app will appear in the TV's app list

### Alternative: Without Tizen Studio

If you don't want to install the full Tizen Studio SDK, you can use [tizen-app-installer](https://gist.github.com/CodaBool/f3140d5b4fbccdc990eee3093d21efa3), a lightweight Node.js tool that installs `.wgt` files over your local network.

1. Make sure [Node.js](https://nodejs.org/) is installed on your computer
2. Download the `tizen-app-installer` script:
   ```bash
   git clone https://gist.github.com/CodaBool/f3140d5b4fbccdc990eee3093d21efa3 tizen-app-installer
   cd tizen-app-installer
   npm install
   ```
3. Put your TV in Developer Mode (see steps above)
4. Find your TV's IP address (Settings > General > Network > Network Status)
5. Run the installer, pointing it at the `.wgt` file and your TV's IP:
   ```bash
   node index.js <TV_IP_ADDRESS> /path/to/Estakada99-Tizen.wgt
   ```
6. The app will appear in the TV's app list

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

## Tech Stack

| Component | Technology |
|---|---|
| Language | HTML / CSS / JavaScript |
| Player | HTML5 `<audio>` element |
| Animations | CSS keyframes + requestAnimationFrame |
| Platform | Tizen Web API |
| Min Tizen | 2.3 |
