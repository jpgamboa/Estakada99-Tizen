(function () {
    'use strict';

    var STREAM_URL = 'https://live.e99.live/main';
    var BUTTON_TIMEOUT = 15000;

    var audio, logo, status, playPauseBtn, clock;

    // DVD bounce state
    var logoX = 100, logoY = 100;
    var dx = 2, dy = 1.5;
    var bounceRAF;

    // Button auto-hide
    var hideTimer = null;

    function init() {
        logo = document.getElementById('logo');
        status = document.getElementById('status');
        playPauseBtn = document.getElementById('playPauseBtn');
        clock = document.getElementById('clock');

        setupAudio();
        startBounce();
        startClock();

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
        } else {
            audio.play();
            startBounce();
        }
    });

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
