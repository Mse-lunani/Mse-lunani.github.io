// DOM elements will be queried on DOMContentLoaded to ensure they exist
let recordBtn, stopBtn, playBtn, submitBtn, timer, visualizer, messageForm, gallery, audioPlayer, recordedAudio;

// Audio recording variables
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let audioUrl;
let isRecording = false;
let recordingTime = 0;
let timerInterval;
let stream;

// Visualizer configuration (bars will be created once DOM is ready)
const bars = 40;
let visualizerBars = [];
// Interval handle that animates the visualizer while recording/playback
let visualizerInterval = null;
// On-page recording warning element (created on DOMContentLoaded)
let recordWarning;
// Redo button (created on DOMContentLoaded) — reloads the page when clicked
let redoBtn;

// Track whether we've already requested mic permission (preflight)
let micPermissionGranted = false;
// Basic mobile detection
const isMobileDevice = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
// Prefetch microphone permission on first user interaction (mobile-friendly)
async function prefetchMicrophonePermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
        console.log('[prefetchMicrophonePermission] requesting mic permission...');
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop tracks — we just wanted the permission prompt
        s.getTracks().forEach(t => t.stop());
        micPermissionGranted = true;
        console.log('[prefetchMicrophonePermission] permission granted');
    } catch (err) {
        console.warn('[prefetchMicrophonePermission] permission denied or error', err);
        micPermissionGranted = false;
    }
}
// One-time handler attached on DOMContentLoaded for mobile devices
function attachMobilePrefetchHandler() {
    // Attach a one-time handler on first user interaction to preflight microphone
    // permission prompt when getUserMedia is available. This improves behavior on
    // mobile where prompts must be triggered by user gestures. We attach the
    // handler for all devices when getUserMedia exists to make behavior reliable.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (micPermissionGranted) return;
    const handler = () => {
        prefetchMicrophonePermission();
    };
    // touchstart covers mobile; click covers desktops. Use once so it auto-removes.
    document.addEventListener('touchstart', handler, { once: true, passive: true });
    document.addEventListener('click', handler, { once: true, passive: true });
    console.log('[attachMobilePrefetchHandler] attached one-time touch/click handler to prefetch mic permission');
}

// Image URLs for gallery
// Compute folder path relative to the current page so fetch() resolves correctly
// Examples:
// - If page is at /gabu/gabu.html => PAGE_BASE = '/gabu' => GABU_FOLDER = '/gabu/images/gabu/'
// - If page is at /index.html (root) => PAGE_BASE = '' => GABU_FOLDER = '/images/gabu/'
const PAGE_BASE = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
const GABU_FOLDER = (PAGE_BASE === '' ? '' : PAGE_BASE) + '/images/gabu/';
console.log('[GABU_FOLDER] resolved to', GABU_FOLDER);

// Acceptable image extensions (lowercase)
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

// Fisher-Yates shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Render gallery items from an array of URLs (or paths)
function renderGallery(urls) {
    gallery.innerHTML = '';
    if (!urls || urls.length === 0) {
        gallery.innerHTML = '<p style="color:#666;">No images found in the gallery folder.</p>';
        return;
    }

    urls.forEach(url => {
        const galleryItem = document.createElement('div');
        galleryItem.classList.add('gallery-item');

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Gabu gallery image';
        img.loading = 'lazy';

        galleryItem.appendChild(img);
        gallery.appendChild(galleryItem);
    });

    // After populating the gallery, (re)setup lightbox handlers
    setupGalleryImages();
}

// Try to parse an HTML directory listing to extract image links
function parseDirectoryListing(htmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a'));
    const found = [];

    anchors.forEach(a => {
        let href = a.getAttribute('href');
        if (!href) return;

        // Normalize href: ignore parent links
        if (href === '../' || href === '/') return;

        // Some directory indexes return full URLs; others relative paths
        if (href.startsWith('http://') || href.startsWith('https://')) {
            // keep as-is
        } else {
            href = GABU_FOLDER + href.replace(/^\/?/, '');
        }

        const lower = href.toLowerCase();
        if (IMAGE_EXTS.some(ext => lower.endsWith(ext))) {
            found.push(href);
        }
    });

    return found;
}

// Attempt to load images from folder by fetching the folder URL.
// Assumption: web server exposes a directory listing (Apache/nginx autoindex) or a manifest.json.
async function loadGalleryFromFolder() {
    try {
        // First try manifest.json in the folder
        const manifestUrl = GABU_FOLDER + 'manifest.json';
        console.log(manifestUrl);
        let res = await fetch(manifestUrl);
        if (res.ok) {
            try {
                const data = await res.json();
                if (Array.isArray(data) && data.length) {
                    // Ensure full paths
                    const urls = data.map(p => (p.startsWith('http') ? p : GABU_FOLDER + p.replace(/^\/?/, '')));
                    renderGallery(shuffleArray(urls));
                    return;
                }
            } catch (e) {
                // Not valid JSON or not what we expect; fall through
            }
        }

        // NOTE: This project is usually hosted on static hosts (e.g. GitHub Pages) that do not
        // support server-side PHP. We therefore rely on a static `manifest.json` stored in
        // `images/gabu/`. If `manifest.json` is not present, the gallery cannot auto-discover
        // files on static hosting; show an explanatory message instead.

        // Next, try fetching the folder itself and parse HTML when server returns an index page
        res = await fetch(GABU_FOLDER, {cache: 'no-store'});
        if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            const text = await res.text();

            // If HTML, attempt to parse anchors/images
            if (contentType.includes('text/html') || text.includes('<a')) {
                const found = parseDirectoryListing(text);
                if (found.length) {
                    renderGallery(shuffleArray(found));
                    return;
                }
            }

            // If server returns JSON array directly from the folder URL
            try {
                const json = JSON.parse(text);
                if (Array.isArray(json) && json.length) {
                    const urls = json.map(p => (p.startsWith('http') ? p : GABU_FOLDER + p.replace(/^\/?/, '')));
                    renderGallery(shuffleArray(urls));
                    return;
                }
            } catch (e) {
                // not JSON, ignore
            }
        }

        // If we reach here, we couldn't discover the images automatically.
        // Show a helpful message in the gallery with a small attempt at guessing common file names.
        gallery.innerHTML = '<p style="color:#666;">Cannot list files automatically. If your server exposes directory listings or a <code>manifest.json</code> in <code>images/gabu/</code>, the gallery will load automatically.</p>';

    } catch (err) {
        console.error('Error loading gallery folder:', err);
        gallery.innerHTML = '<p style="color:#666;">Error loading gallery. Check server permissions and that <code>images/gabu/</code> is accessible.</p>';
    }
}



// Initialize gallery by attempting to load images from the folder
function initGallery() {
    loadGalleryFromFolder();
}


// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Update timer display
function updateTimer() {
    recordingTime++;
    timer.textContent = formatTime(recordingTime);

// Debug log for timer/update
    console.log('[updateTimer] recordingTime=', recordingTime, 'audioBlob=', !!audioBlob, 'submitBtn=', submitBtn ? submitBtn.disabled : 'N/A');

// Show inline warning while recording is less than required duration
    const required = 10;
    if (recordingTime < required) {
        const remaining = required - recordingTime;
        if (recordWarning) {
            recordWarning.textContent = `Please record at least ${required} seconds. ${remaining} second(s) remaining...`;
            recordWarning.style.display = 'block';
        }
    } else {
        if (recordWarning) {
            recordWarning.style.display = 'none';
        }
    }

// Enable submit button if recording is at least 10 seconds and we already have an audioBlob
    if (recordingTime >= 10 && audioBlob) {
        console.log('[updateTimer] enabling submit (recordingTime >=10 && audioBlob)');
        submitBtn.classList.add('active');
        submitBtn.disabled = false;
    } else if (recordingTime >= 10 && !audioBlob) {
        console.log('[updateTimer] recordingTime >=10 but audioBlob not present yet.');
    }

// Update visualizer bars
    updateVisualizer();
}

// Update visualizer bars with random heights
function updateVisualizer() {
    if (!visualizerBars || visualizerBars.length === 0) return;
    visualizerBars.forEach(bar => {
        // When recording, bars move randomly
        if (isRecording) {
            const randomHeight = 20 + Math.random() * 80;
            bar.style.height = `${randomHeight}%`;
            // Random color for fun effect
            bar.style.backgroundColor = `hsl(${280 + Math.random() * 40}, 80%, 65%)`;
        } else {
            // When not recording, bars are still
            bar.style.height = '0%';
        }
    });
}

// Start recording
async function startRecording() {
    try {
        // If Permissions API is available, check microphone permission state first.
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const p = await navigator.permissions.query({ name: 'microphone' });
                console.log('[startRecording] microphone permission state:', p.state);
                if (p.state === 'denied') {
                    alert('Microphone access is denied in your browser. Please enable microphone permissions for this site in your browser settings.');
                    return;
                }
                // If state is 'prompt' we continue and rely on getUserMedia to show prompt.
            } catch (permErr) {
                // permissions.query may throw on some browsers; ignore and continue
                console.log('[startRecording] permissions.query error (ignored):', permErr);
            }
        }

        // If we haven't preflighted permission yet, attempt a prefetch in the same
        // user gesture. This helps mobile browsers which require the permission
        // prompt to be triggered by a user action. If it succeeds, micPermissionGranted
        // will be true and the subsequent getUserMedia call should succeed.
        if (!micPermissionGranted) {
            try {
                console.log('[startRecording] performing preflight permission request as part of Record gesture');
                await prefetchMicrophonePermission();
            } catch (pfErr) {
                console.warn('[startRecording] preflight failed (ignored):', pfErr);
            }
        }

         console.log('[startRecording] requesting microphone access...');
         // Request microphone access
         stream = await navigator.mediaDevices.getUserMedia({
             audio: {
                 echoCancellation: true,
                 noiseSuppression: true,
                 sampleRate: 44100
             }
         });

// Check for supported MIME types
        const options = {
            audioBitsPerSecond: 128000,
            mimeType: 'audio/webm'
        };

// Try to create MediaRecorder with preferred options
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.log('Using default MediaRecorder settings:', e);
            mediaRecorder = new MediaRecorder(stream);
        }

// Reset recording variables
        audioChunks = [];
        recordingTime = 0;
        timer.textContent = formatTime(0);
        audioPlayer.classList.remove('active');

// Set up data handler
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

// Set up stop handler
        mediaRecorder.onstop = () => {
            // Create audio blob and URL
            audioBlob = new Blob(audioChunks, {
                type: mediaRecorder.mimeType || 'audio/webm'
            });
            audioUrl = URL.createObjectURL(audioBlob);

            console.log('[onstop] audioBlob created, size=', audioBlob ? audioBlob.size : 0, 'bytes', 'recordingTime=', recordingTime);

            // Set up the audio player
            recordedAudio.src = audioUrl;

            // Enable play button
            playBtn.disabled = false;

            // Update UI
            recordBtn.disabled = false;
            stopBtn.disabled = true;
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';

            // Stop visualizer animation
            isRecording = false;
            // Clear any ongoing visualizer interval used during recording
            if (visualizerInterval) {
                clearInterval(visualizerInterval);
                console.log('[onstop] cleared visualizerInterval');
                visualizerInterval = null;
            }
            // One final update to reset/settle bars
            updateVisualizer();

            // Clear timer interval
            clearInterval(timerInterval);

            // Show message if recording is too short
            if (recordingTime < 10) {
                const required = 10;
                alert('Please record a message of at least ' + required + ' seconds. Your recording was only ' + recordingTime + ' seconds.');
                if (recordWarning) {
                    recordWarning.textContent = 'Recording too short — please record at least ' + required + ' seconds.';
                    recordWarning.style.display = 'block';
                }
                submitBtn.classList.remove('active');
                submitBtn.disabled = true;
                if (redoBtn) redoBtn.style.display = 'none';
                console.log('[onstop] recording too short, submit disabled');
            } else {
                submitBtn.classList.add('active');
                submitBtn.disabled = false;
                audioPlayer.classList.add('active');
                if (redoBtn) redoBtn.style.display = 'inline-flex';
                if (recordWarning) recordWarning.style.display = 'none';
                console.log('[onstop] recording OK, submit enabled');
            }
        };

// Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        isRecording = true;
        console.log('[startRecording] started. isRecording=', isRecording);

        // Update UI
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = '<i class="fas fa-circle"></i> Recording...';

        // Start timer
        timerInterval = setInterval(updateTimer, 1000);

        // Start visualizer animation at higher frequency while recording
        if (visualizerInterval) clearInterval(visualizerInterval);
        visualizerInterval = setInterval(updateVisualizer, 80);
        console.log('[startRecording] visualizerInterval set=', visualizerInterval);
        // Also run one immediate frame
        updateVisualizer();

    } catch (error) {
        console.error('Error accessing microphone:', error);
        // If permission was denied or prompt didn't appear, attempt a one-time
        // preflight (only when this call is a user gesture) which can sometimes
        // surface the permission prompt on mobile. Retry once.
        const name = error && error.name ? error.name : '';
        if ((name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') && !micPermissionGranted) {
            console.log('[startRecording] NotAllowedError — attempting preflight then retry');
            try {
                await prefetchMicrophonePermission();
                // Try again to getUserMedia once
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('[startRecording] retry getUserMedia succeeded after preflight');
                // proceed with rest of startRecording by calling startRecording again logically
                // For simplicity, reload the page to reset state so the user can tap record again
                alert('Microphone permission granted. Please press Record again.');
                micPermissionGranted = true;
                return;
            } catch (retryErr) {
                console.warn('[startRecording] retry after preflight failed:', retryErr);
                // fall through to show the message below
            }
        }

        // Provide clearer guidance to users — many mobile issues are permission or
        // insecure-origin related (getUserMedia requires HTTPS on non-localhost).
        let msg = 'Could not access the microphone.';
        if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
            msg += ' Permission was denied. Please allow microphone access in your browser settings or when prompted.';
            msg += ' On mobile, ensure the site is served over HTTPS (or use localhost) so the browser can show the permission prompt.';
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
            msg += ' No microphone was found.';
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
            msg += ' The microphone is currently in use or not readable.';
        } else {
            msg += ' Error: ' + (error && error.message ? error.message : name);
        }
        alert(msg);
    }
}

// Stop recording
function stopRecording() {
    console.log('[stopRecording] called, mediaRecorder state=', mediaRecorder ? mediaRecorder.state : 'no recorder');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();

// Stop all audio tracks
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Play recorded audio
function playRecording() {
    if (recordedAudio.src) {
// Reset and play
        recordedAudio.currentTime = 0;
        recordedAudio.play().catch(error => {
            console.error('Error playing audio:', error);
            alert('Error playing audio. Please try again.');
        });

// Visualize during playback
        const playbackInterval = setInterval(() => {
            if (!recordedAudio.paused && !recordedAudio.ended) {
// Create visualizer effect during playback
                visualizerBars.forEach((bar, index) => {
                    const timeOffset = index * 0.1;
                    const waveHeight = 30 + Math.sin(Date.now() / 200 + timeOffset) * 40;
                    bar.style.height = `${waveHeight}%`;
                    bar.style.backgroundColor = `hsl(${200 + Math.sin(Date.now() / 500 + index) * 40}, 80%, 65%)`;
                });
            } else {
                clearInterval(playbackInterval);
                updateVisualizer();
            }
        }, 50);

// Reset visualizer when playback ends
        recordedAudio.onended = () => {
            clearInterval(playbackInterval);
            updateVisualizer();
        };
    }
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();

// Debug submission state
    console.log('[handleSubmit] invoked. submitBtn.disabled=', submitBtn ? submitBtn.disabled : 'N/A', 'audioBlob=', !!audioBlob, 'recordingTime=', recordingTime);

// Get form data
    const name = document.getElementById('name').value.trim();

    if (!name) {
        alert('Please enter your name before submitting.');
        return;
    }

    if (!audioBlob) {
        alert('Please record a message before submitting.');
        return;
    }

    if (recordingTime < 10) {
        const required = 10;
        const remaining = required - recordingTime;
        if (recordWarning) {
            recordWarning.textContent = `Please record at least ${required} seconds. ${remaining} second(s) remaining.`;
            recordWarning.style.display = 'block';
        }
        alert('Please record a message of at least ' + required + ' seconds.');
        return;
    }

// Create form data
    const formData = new FormData();
    formData.append('name', name);
    formData.append('birthday_message', audioBlob, `birthday_message.webm`);


// Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
        // Send to the configured API endpoint
        console.log('Form data prepared:', {
            name: name,
            audioSize: `${(audioBlob.size / 1024).toFixed(2)} KB`,
            duration: `${recordingTime} seconds`,
            endpoint: 'https://system.hayahbloom.com/admin/apis/add_audio.php'
        });

        const apiUrl = 'https://system.hayahbloom.com/admin/apis/add_audio.php';
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Server responded with ${response.status}: ${text}`);
        }

        // Try to parse JSON, otherwise treat as plain text
        let result;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            result = await response.json();
        } else {
            result = await response.text();
        }

        console.log('[handleSubmit] server response:', result);

        // Determine success: prefer a JSON { success: true } convention, otherwise rely on HTTP 200
        let success = true;
        let serverMessage = '';
        if (typeof result === 'object' && result !== null) {
            if ('success' in result) success = !!result.success;
            if ('message' in result) serverMessage = String(result.message);
        } else if (typeof result === 'string') {
            serverMessage = result;
        }

        if (!success) {
            throw new Error(serverMessage || 'Server indicated failure');
        }

        // Success handling
        alert(`Thank you, ${name}! Your birthday message for Gabu has been sent successfully!`);

        // Reload the page to return to a clean state (avoids audio element error events
        // that can occur when clearing the src manually). The alert above is blocking,
        // so calling reload immediately will happen after the user dismisses the alert.
        console.log('[handleSubmit] submission succeeded, reloading page');
        location.reload();
        return;
    } catch (error) {
        console.error('Error submitting form:', error);
        // Show server-provided message when available
        alert('There was an error submitting your message: ' + (error.message || 'Please try again.'));
    } finally {
// Restore button state
         submitBtn.innerHTML = originalText;
         submitBtn.disabled = false;
         console.log('[handleSubmit] finished, submitBtn.disabled=', submitBtn.disabled);
     }
}

// Initialize the page once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Query DOM elements now that they exist
    recordBtn = document.getElementById('recordBtn');
    stopBtn = document.getElementById('stopBtn');
    playBtn = document.getElementById('playBtn');
    submitBtn = document.getElementById('submitBtn');
    timer = document.getElementById('timer');
    visualizer = document.getElementById('visualizer');
    messageForm = document.getElementById('messageForm');
    gallery = document.getElementById('gallery');
    audioPlayer = document.getElementById('audioPlayer');
    recordedAudio = document.getElementById('recordedAudio');

    // Create visualizer bars inside the visualizer element
    visualizer.innerHTML = '';
    for (let i = 0; i < bars; i++) {
        const bar = document.createElement('div');
        bar.classList.add('visualizer-bar');
        bar.style.left = `${(i / bars) * 100}%`;
        bar.style.height = '0%';
        visualizer.appendChild(bar);
    }
    visualizerBars = Array.from(document.querySelectorAll('.visualizer-bar'));

    // Ensure submit button initial state: disabled until a valid recording is available
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.remove('active');
    }

    // Create an inline warning element shown while recording is too short
    recordWarning = document.createElement('div');
    recordWarning.id = 'recordWarning';
    recordWarning.style.color = '#e74c3c';
    recordWarning.style.marginTop = '10px';
    recordWarning.style.fontWeight = '600';
    recordWarning.style.display = 'none';
    // Insert after the timer element if possible
    if (timer && timer.parentNode) {
        timer.parentNode.insertBefore(recordWarning, timer.nextSibling);
    } else {
        document.body.appendChild(recordWarning);
    }

    // Create a 'Redo' button and append it to the audio controls; hidden by default.
    redoBtn = document.createElement('button');
    redoBtn.type = 'button';
    redoBtn.id = 'redoBtn';
    redoBtn.className = 'audio-btn redo-btn';
    redoBtn.innerHTML = '<i class="fas fa-redo"></i> Redo';
    redoBtn.style.display = 'none';
    // Place it next to the other audio controls if present
    const audioControls = document.querySelector('.audio-controls');
    if (audioControls) {
        audioControls.appendChild(redoBtn);
    } else {
        // fallback: append to form
        if (messageForm) messageForm.appendChild(redoBtn);
    }
    redoBtn.addEventListener('click', () => {
        console.log('[redoBtn] clicked — reloading page');
        location.reload();
    });

    // Visible 'Enable Microphone' button for mobile users (or when getUserMedia exists)
    const enableMicBtn = document.createElement('button');
    enableMicBtn.type = 'button';
    enableMicBtn.id = 'enableMicBtn';
    enableMicBtn.className = 'audio-btn enable-mic-btn';
    enableMicBtn.innerHTML = '<i class="fas fa-microphone-alt"></i> Enable Microphone';
    // Show it on mobile devices (or when getUserMedia exists but adjust as needed)
    enableMicBtn.style.display = (isMobileDevice && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? 'inline-flex' : 'none';
    if (audioControls) {
        audioControls.insertBefore(enableMicBtn, audioControls.firstChild);
    } else if (messageForm) {
        messageForm.insertBefore(enableMicBtn, messageForm.firstChild);
    } else {
        document.body.appendChild(enableMicBtn);
    }

    enableMicBtn.addEventListener('click', async () => {
        try {
            enableMicBtn.disabled = true;
            console.log('[enableMicBtn] user tapped — prefetching mic permission');
            await prefetchMicrophonePermission();
            if (micPermissionGranted) {
                alert('Microphone permission granted. Press Record to start recording.');
                enableMicBtn.style.display = 'none';
            } else {
                alert('Microphone permission was not granted. Please allow access in your browser settings.');
                enableMicBtn.disabled = false;
            }
        } catch (err) {
            console.error('[enableMicBtn] error during prefetch:', err);
            enableMicBtn.disabled = false;
        }
    });

    console.log('[DOMContentLoaded] submitBtn found=', !!submitBtn, 'disabled=', submitBtn ? submitBtn.disabled : 'N/A');

    // Attach event listeners (safe now that elements exist)
    if (recordBtn) recordBtn.addEventListener('click', startRecording);
    if (stopBtn) stopBtn.addEventListener('click', stopRecording);
    if (playBtn) playBtn.addEventListener('click', playRecording);
    if (messageForm) messageForm.addEventListener('submit', handleSubmit);

    // Initialize gallery
    initGallery();

    // Add some initial visualizer animation (subtle)
    const initAnimation = setInterval(() => {
        if (!isRecording) {
            visualizerBars.forEach((bar, index) => {
                const timeOffset = index * 0.1;
                const waveHeight = 30 + Math.sin(Date.now() / 500 + timeOffset) * 30;
                bar.style.height = `${waveHeight}%`;
                bar.style.backgroundColor = `hsl(${280 + Math.sin(Date.now() / 1000 + index) * 20}, 80%, 65%)`;
            });
        }
    }, 100);

    // Stop initial animation after 5 seconds
    setTimeout(() => {
        if (!isRecording) {
            clearInterval(initAnimation);
            visualizerBars.forEach(bar => {
                bar.style.height = '0%';
            });
        }
    }, 5000);

    // Update the audio player when audio is loaded
    if (recordedAudio) {
        recordedAudio.addEventListener('loadeddata', () => {
            console.log('Audio loaded, duration:', recordedAudio.duration);
        });

        // Handle audio play errors
        recordedAudio.addEventListener('error', (e) => {
            // Ignore error events when the src was intentionally cleared or empty
            // (for example after a successful submit we set recordedAudio.src = '').
            const src = recordedAudio && recordedAudio.src ? recordedAudio.src : '';
            if (!src) {
                // Likely we intentionally cleared the source; do not alert the user.
                console.log('recordedAudio error ignored: no source (probably cleared)');
                return;
            }

            // Only alert/log when there is a real source that failed to load
            console.error('Audio error:', recordedAudio.error, 'src=', src);
            alert('There was an error loading the audio. Please try recording again.');
        });
    }

    // Attach mobile prefetch handler for microphone permission
    attachMobilePrefetchHandler();
});

let galleryImages = [];

// Create lightbox overlay elements
const lightboxOverlay = document.createElement('div');
lightboxOverlay.classList.add('lightbox-overlay');
document.body.appendChild(lightboxOverlay);

const lightboxContent = document.createElement('div');
lightboxContent.classList.add('lightbox-content');
lightboxOverlay.appendChild(lightboxContent);

const lightboxImg = document.createElement('img');
lightboxImg.classList.add('lightbox-img');
lightboxContent.appendChild(lightboxImg);

const closeBtn = document.createElement('button');
closeBtn.classList.add('lightbox-close');
closeBtn.innerHTML = '&times;';
lightboxContent.appendChild(closeBtn);

const prevBtn = document.createElement('button');
prevBtn.classList.add('lightbox-nav', 'left');
prevBtn.innerHTML = '&lt;';
lightboxContent.appendChild(prevBtn);

const nextBtn = document.createElement('button');
nextBtn.classList.add('lightbox-nav', 'right');
nextBtn.innerHTML = '&gt;';
lightboxContent.appendChild(nextBtn);

// Open lightbox with image
function openLightbox(src) {
    lightboxImg.src = src;
    lightboxOverlay.classList.add('active');
    // prevent page scroll while open
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox() {
    lightboxOverlay.classList.remove('active');
    // restore page scroll
    document.body.style.overflow = '';
}

// Clicking backdrop closes lightbox (but clicking content should not)
lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) {
        closeLightbox();
    }
});

// Prevent clicks inside content from bubbling to overlay
lightboxContent.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Graceful image error handling
lightboxImg.addEventListener('error', () => {
    lightboxImg.alt = 'Image failed to load';
    lightboxImg.style.display = 'none';
    // show a small fallback message
    if (!lightboxContent.querySelector('.lightbox-fallback')) {
        const msg = document.createElement('div');
        msg.className = 'lightbox-fallback';
        msg.style.color = '#fff';
        msg.style.padding = '20px';
        msg.innerText = 'Image failed to load.';
        lightboxContent.appendChild(msg);
    }
});

// Remove fallback when image loads successfully
lightboxImg.addEventListener('load', () => {
    lightboxImg.style.display = '';
    const fb = lightboxContent.querySelector('.lightbox-fallback');
    if (fb) fb.remove();
});

// Show next image in lightbox
function showNextImage() {
    const currentIndex = galleryImages.findIndex(img => img.src === lightboxImg.src);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    lightboxImg.src = galleryImages[nextIndex].src;
}

// Show previous image in lightbox
function showPrevImage() {
    const currentIndex = galleryImages.findIndex(img => img.src === lightboxImg.src);
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[prevIndex].src;
}

// Gallery item click handler
function onGalleryItemClick(e) {
    const img = e.currentTarget.querySelector('img');
    if (img) {
        openLightbox(img.src);
    }
}

// Close button click handler
closeBtn.addEventListener('click', closeLightbox);

// Next/prev button click handlers
nextBtn.addEventListener('click', showNextImage);
prevBtn.addEventListener('click', showPrevImage);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!lightboxOverlay.classList.contains('active')) return;

    if (e.key === 'ArrowRight' || e.key === 'd') {
        showNextImage();
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        showPrevImage();
    } else if (e.key === 'Escape' || e.key === 'Enter') {
        closeLightbox();
    }
});

// Store gallery images and attach click handlers
function setupGalleryImages() {
    // Build list of images (sources) for navigation
    galleryImages = Array.from(document.querySelectorAll('.gallery-item img')).map(img => ({ src: img.src, alt: img.alt }));

    // Attach click handlers to gallery items, but avoid attaching multiple times
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        if (item.dataset.lbAttached === '1') return; // already attached
        item.addEventListener('click', onGalleryItemClick);
        item.dataset.lbAttached = '1';
    });
}

// Initialize gallery images setup
document.addEventListener('DOMContentLoaded', () => {
    setupGalleryImages();
});
/**
 * Request microphone permissions and handle platform-specific requirements
 * This function works for iOS, Android, and desktop browsers
 */
function requestMicrophonePermission() {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser');

        // For older browsers
        const legacyGetUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

        if (!legacyGetUserMedia) {
            alert('Your browser does not support audio recording. Please try Chrome, Firefox, or Safari.');
            return Promise.reject('Browser does not support audio recording');
        }

        // Use legacy API
        return new Promise((resolve, reject) => {
            legacyGetUserMedia.call(navigator,
                { audio: true },
                resolve,
                reject
            );
        });
    }

    // For modern browsers (including iOS 14.3+ and Android)
    return navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // iOS specific: request optimal sample rate
            sampleRate: 44100,
            // For better compatibility on mobile
            channelCount: 1
        }
    })
        .then(stream => {
            console.log('Microphone access granted');

            // IMPORTANT: For iOS, we need to create and start an AudioContext
            // during a user gesture to enable audio playback later
            if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.AudioContext) {
                // Create audio context on iOS
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();

                // Create a media stream source (required for iOS)
                const source = audioContext.createMediaStreamSource(stream);

                // Connect to destination (required to make it work on iOS)
                source.connect(audioContext.destination);
            }

            // Stop the tracks immediately since we just needed permission
            stream.getTracks().forEach(track => track.stop());

            return true;
        })
        .catch(error => {
            console.error('Error getting microphone permission:', error);

            // User-friendly error messages
            let errorMessage = 'Microphone access was denied or not available.';

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings to record audio messages.';

                // iOS-specific guidance
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    errorMessage += '\n\nOn iOS: Go to Settings > Safari > Microphone and enable it.';
                }
                // Android-specific guidance
                else if (/Android/.test(navigator.userAgent)) {
                    errorMessage += '\n\nOn Android: Check app permissions and allow microphone access.';
                }
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'No microphone found. Please check if your device has a microphone.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'Microphone is already in use by another application. Please close other apps using the microphone.';
            } else if (error.name === 'SecurityError') {
                errorMessage = 'Microphone access is blocked for security reasons. Please use HTTPS.';
            }

            alert(errorMessage);
            return Promise.reject(error);
        });
}

// Function to check current permission state (useful for iOS)
function checkMicrophonePermission() {
    if (navigator.permissions && navigator.permissions.query) {
        return navigator.permissions.query({ name: 'microphone' })
            .then(permissionStatus => {
                console.log('Microphone permission state:', permissionStatus.state);
                return permissionStatus.state;
            })
            .catch(() => 'unknown');
    }
    return Promise.resolve('unknown');
}

// Call on page load with user interaction requirement for iOS
document.addEventListener('DOMContentLoaded', function() {
    // For iOS, we need a user gesture to request permission
    // So we'll set up a button or ask on first interaction

    // Check if we already have permission
    checkMicrophonePermission().then(state => {
        if (state === 'granted') {
            console.log('Microphone permission already granted');
        } else if (state === 'prompt') {
            console.log('Microphone permission will be requested on first use');
        }
    });

    // Optional: Add a button to explicitly request permissions
    // This is recommended for iOS compatibility
    const permissionButton = document.createElement('button');
    permissionButton.id = 'micPermissionBtn';
    permissionButton.textContent = 'Allow Microphone Access';
    permissionButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
        font-family: sans-serif;
    `;

    permissionButton.addEventListener('click', function() {
        requestMicrophonePermission().then(() => {
            permissionButton.textContent = '✓ Microphone Allowed';
            permissionButton.style.background = '#4ecdc4';
            setTimeout(() => {
                permissionButton.style.display = 'none';
            }, 2000);
        });
    });

    // Add button to page (optional - you can trigger this differently)
    // document.body.appendChild(permissionButton);
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { requestMicrophonePermission, checkMicrophonePermission };
}