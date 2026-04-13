(function () {
    'use strict';

    var STREAM_URL = 'https://live.e99.live/main';
    var LIVE_INFO_URL = 'https://bo.e99.live/api/live-info';
    var BUTTON_TIMEOUT = 15000;
    var NOW_PLAYING_POLL_MS = 30000;
    var SKY_CYCLE_MS = 100000;
    var SKY_FRAME_MS = 83;

    var audio, logo, status, playPauseBtn, clock;
    var showNameEl, nowPlayingLabel, nowPlayingTrack, nowPlayingContainer;
    var skyGradient;

    // DVD bounce state
    var logoX = 100, logoY = 100;
    var dx = 2, dy = 1.5;
    var bounceRAF;

    // Button auto-hide
    var hideTimer = null;

    // Now-playing poll
    var nowPlayingTimer = null;

    // Sky gradient animation
    var skyTimer = null;

    function init() {
        logo = document.getElementById('logo');
        status = document.getElementById('status');
        playPauseBtn = document.getElementById('playPauseBtn');
        clock = document.getElementById('clock');
        showNameEl = document.getElementById('showName');
        nowPlayingLabel = document.getElementById('nowPlayingLabel');
        nowPlayingTrack = document.getElementById('nowPlayingTrack');
        nowPlayingContainer = document.getElementById('nowPlaying');
        skyGradient = document.getElementById('skyGradient');

        setupAudio();
        startBounce();
        startClock();
        startSkyMotion();
        pollNowPlaying();

        document.addEventListener('keydown', onKeyDown);
        playPauseBtn.addEventListener('click', togglePlayback);

        // Keep screen on (Tizen API)
        try {
            tizen.power.request('SCREEN', 'SCREEN_NORMAL');
            tizen.power.setScreenStateChangeListener(function () {});
        } catch (e) {
            // Not on Tizen or API unavailable — ignore
        }
    }

    // --- Sky Gradient Animation (matches e99.live sky-motion.js) ---

    function skyBgXY(ms) {
        var t = (ms % SKY_CYCLE_MS) / SKY_CYCLE_MS;
        var x, y;
        if (t < 0.5) {
            var u = t * 2;
            x = u * 100;
            y = 25 + u * 50;
        } else {
            var v = (t - 0.5) * 2;
            x = 100 - v * 100;
            y = 75 - v * 50;
        }
        return { x: x, y: y };
    }

    function applySkyFrame() {
        var pos = skyBgXY(Date.now());
        skyGradient.style.backgroundPosition = pos.x + '% ' + pos.y + '%';
    }

    function startSkyMotion() {
        applySkyFrame();
        skyTimer = setInterval(applySkyFrame, SKY_FRAME_MS);
    }

    // --- Audio Playback ---

    function setupAudio() {
        audio = document.getElementById('audioPlayer');
        audio.src = STREAM_URL;

        audio.addEventListener('waiting', function () {
            setStatus('Buffering...');
            playPauseBtn.textContent = '\u23F3';
        });

        audio.addEventListener('playing', function () {
            setStatus(null);
            updateButton();
        });

        audio.addEventListener('pause', function () {
            updateButton();
        });

        audio.addEventListener('error', function () {
            setStatus('Stream unavailable. Press OK to retry.');
            playPauseBtn.textContent = '\u25B6';
        });

        audio.addEventListener('ended', function () {
            setStatus('Press OK to connect');
            playPauseBtn.textContent = '\u25B6';
        });

        // Auto-play
        audio.play().catch(function () {
            setStatus('Press OK to play');
        });
    }

    function togglePlayback() {
        if (audio.paused || audio.ended) {
            if (audio.error) {
                audio.load();
            }
            audio.play().catch(function () {
                setStatus('Stream unavailable. Press OK to retry.');
            });
        } else {
            audio.pause();
        }
    }

    function updateButton() {
        playPauseBtn.textContent = audio.paused ? '\u25B6' : '\u23F8';
    }

    // --- Status ---

    function setStatus(msg) {
        if (msg) {
            status.textContent = msg;
            status.classList.remove('hidden');
        } else {
            status.classList.add('hidden');
        }
    }

    // --- DVD Bounce ---

    function startBounce() {
        function frame() {
            var maxX = 1920 - 320;
            var maxY = 1080 - 80;

            logoX += dx;
            logoY += dy;

            if (logoX <= 0) { logoX = 0; dx = Math.abs(dx); }
            if (logoX >= maxX) { logoX = maxX; dx = -Math.abs(dx); }
            if (logoY <= 0) { logoY = 0; dy = Math.abs(dy); }
            if (logoY >= maxY) { logoY = maxY; dy = -Math.abs(dy); }

            logo.style.transform = 'translate(' + logoX + 'px, ' + logoY + 'px)';
            bounceRAF = requestAnimationFrame(frame);
        }
        bounceRAF = requestAnimationFrame(frame);
    }

    // --- Button Show/Hide ---

    function showButton() {
        clearTimeout(hideTimer);
        playPauseBtn.classList.add('visible');
        hideTimer = setTimeout(function () {
            playPauseBtn.classList.remove('visible');
        }, BUTTON_TIMEOUT);
    }

    // --- Clock ---

    function startClock() {
        function tick() {
            var now = new Date();
            var h = now.getHours() % 12 || 12;
            var m = now.getMinutes();
            var ampm = now.getHours() >= 12 ? 'PM' : 'AM';
            clock.textContent = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
        }
        tick();
        setInterval(tick, 10000);
    }

    // --- Now Playing ---

    function decodeEntities(text) {
        var el = document.createElement('span');
        el.innerHTML = text;
        return el.textContent || el.innerText || '';
    }

    function isJingle(item) {
        if (!item) return false;
        var blob = (item.name || '');
        if (item.metadata) {
            blob += ' ' + (item.metadata.track_title || '');
            blob += ' ' + (item.metadata.artist_name || '');
        }
        return /JINGLE/i.test(blob);
    }

    function formatSlot(item) {
        if (!item) return null;
        if (item.type === 'track' && item.metadata) {
            var artist = (item.metadata.artist_name || '').trim();
            var title = (item.metadata.track_title || '').trim();
            if (artist && title) return artist + ' \u2013 ' + title;
            if (title) return title;
            if (artist) return artist;
        }
        var name = (item.name || '').trim().replace(/^\s*-\s+/, '').trim();
        return name || null;
    }

    function fetchNowPlaying() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', LIVE_INFO_URL, true);
        xhr.timeout = 8000;
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onload = function () {
            if (xhr.status !== 200) return;
            try {
                var data = JSON.parse(xhr.responseText);
                var current = data.current;
                if (!current) {
                    nowPlayingContainer.classList.add('hidden');
                    return;
                }

                // Extract show name
                var rawShowName = null;
                if (data.currentShow && data.currentShow.name) {
                    rawShowName = data.currentShow.name.trim();
                } else if (current.metadata && current.metadata.genre) {
                    rawShowName = current.metadata.genre.trim();
                }

                var showName = rawShowName ? decodeEntities(rawShowName) : null;
                var label, trackText;

                if (isJingle(current)) {
                    var next = data.next;
                    var line = formatSlot(next);
                    if (line) {
                        label = 'Next up:';
                        trackText = decodeEntities(line);
                    } else {
                        nowPlayingContainer.classList.add('hidden');
                        return;
                    }
                } else {
                    var trackLine = formatSlot(current);
                    if (trackLine) {
                        label = 'Currently playing:';
                        trackText = decodeEntities(trackLine);
                    } else if (showName) {
                        label = 'Currently playing:';
                        trackText = showName;
                        showName = null;
                    } else {
                        nowPlayingContainer.classList.add('hidden');
                        return;
                    }
                }

                // Update UI
                if (showName) {
                    showNameEl.textContent = showName;
                    showNameEl.classList.remove('hidden');
                } else {
                    showNameEl.classList.add('hidden');
                }
                nowPlayingLabel.textContent = label;
                nowPlayingTrack.textContent = trackText;
                nowPlayingContainer.classList.remove('hidden');

            } catch (e) {
                // Parse error — ignore
            }
        };

        xhr.onerror = function () {};
        xhr.ontimeout = function () {};
        xhr.send();
    }

    function pollNowPlaying() {
        fetchNowPlaying();
        nowPlayingTimer = setInterval(fetchNowPlaying, NOW_PLAYING_POLL_MS);
    }

    // --- Remote Control ---

    function onKeyDown(e) {
        switch (e.keyCode) {
            case 13:  // OK / Enter
                if (playPauseBtn.classList.contains('visible')) {
                    togglePlayback();
                } else {
                    showButton();
                }
                e.preventDefault();
                break;

            case 415: // Tizen Play
                audio.play();
                e.preventDefault();
                break;

            case 19:  // Tizen Pause
                audio.pause();
                e.preventDefault();
                break;

            case 10252: // Tizen Play/Pause toggle
                togglePlayback();
                e.preventDefault();
                break;

            case 10009: // Tizen Back
            case 8:     // Backspace fallback
                try {
                    tizen.application.getCurrentApplication().exit();
                } catch (ex) {
                    window.close();
                }
                e.preventDefault();
                break;

            default:
                showButton();
                break;
        }
    }

    // --- Lifecycle ---

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            audio.pause();
            cancelAnimationFrame(bounceRAF);
            clearInterval(skyTimer);
            clearInterval(nowPlayingTimer);
        } else {
            audio.play();
            startBounce();
            startSkyMotion();
            pollNowPlaying();
        }
    });

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
