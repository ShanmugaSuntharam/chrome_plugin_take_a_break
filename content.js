// Content script for Take a Break Reminder extension

let breakOverlay = null;
let breakTimer = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'showBreakOverlay':
            showBreakOverlay(message.duration);
            break;
        case 'hideBreakOverlay':
            hideBreakOverlay();
            break;
        case 'playNotificationSound':
            playNotificationSound();
            break;
        case 'showAlert':
            showAlert(message.title, message.message);
            break;
    }
});

// Show break overlay on the page
function showBreakOverlay(duration) {
    if (breakOverlay) {
        hideBreakOverlay();
    }

    // Create overlay container
    breakOverlay = document.createElement('div');
    breakOverlay.id = 'take-a-break-overlay';
    breakOverlay.innerHTML = `
        <div class="break-modal">
            <div class="break-header">
                <h2>🎯 Time for a Break!</h2>
                <p>Take ${duration} minutes to step away from your screen</p>
            </div>
            
            <div class="break-content">
                <div class="break-timer">
                    <div class="timer-circle">
                        <span class="timer-text" id="break-timer-text">${duration}:00</span>
                    </div>
                </div>
                
                <div class="break-suggestions">
                    <h3>Break Ideas:</h3>
                    <ul>
                        <li>👀 Look 20 feet away for 20 seconds (20-20-20 rule)</li>
                        <li>💧 Drink some water and stay hydrated</li>
                        <li>🧘 Do some light stretching exercises</li>
                        <li>🚶 Take a short walk around your space</li>
                        <li>🌱 Look at something green or natural</li>
                    </ul>
                </div>
                
                <div class="break-actions">
                    <button id="skip-break-btn" class="btn btn-secondary">Skip Break</button>
                    <button id="extend-break-btn" class="btn btn-primary">Extend +5 min</button>
                </div>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #take-a-break-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .break-modal {
            background: white;
            border-radius: 20px;
            padding: 0;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .break-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .break-header h2 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
        }

        .break-header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.9;
        }

        .break-content {
            padding: 30px;
        }

        .break-timer {
            text-align: center;
            margin-bottom: 30px;
        }

        .timer-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .timer-text {
            color: white;
            font-size: 24px;
            font-weight: 700;
        }

        .break-suggestions {
            margin-bottom: 30px;
        }

        .break-suggestions h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
        }

        .break-suggestions ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .break-suggestions li {
            padding: 8px 0;
            color: #555;
            font-size: 14px;
            border-bottom: 1px solid #eee;
        }

        .break-suggestions li:last-child {
            border-bottom: none;
        }

        .break-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-secondary:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }

        @media (max-width: 600px) {
            .break-modal {
                width: 95%;
                margin: 20px;
            }
            
            .break-header {
                padding: 20px;
            }
            
            .break-content {
                padding: 20px;
            }
            
            .break-actions {
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(breakOverlay);

    // Start break timer
    startBreakTimer(duration);

    // Add event listeners
    document.getElementById('skip-break-btn').addEventListener('click', () => {
        hideBreakOverlay();
        // Send message to background to restart timer
        chrome.runtime.sendMessage({ action: 'skipBreak' });
    });

    document.getElementById('extend-break-btn').addEventListener('click', () => {
        extendBreak();
    });

    // Prevent scrolling on body
    document.body.style.overflow = 'hidden';
}

// Hide break overlay
function hideBreakOverlay() {
    if (breakOverlay) {
        if (breakTimer) {
            clearInterval(breakTimer);
            breakTimer = null;
        }
        document.body.removeChild(breakOverlay);
        breakOverlay = null;
        document.body.style.overflow = '';
    }
}

// Start break countdown timer
function startBreakTimer(duration) {
    let timeLeft = duration * 60; // Convert to seconds
    
    const updateTimer = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        const timerText = document.getElementById('break-timer-text');
        if (timerText) {
            timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            hideBreakOverlay();
            return;
        }
        
        timeLeft--;
    };
    
    updateTimer(); // Update immediately
    breakTimer = setInterval(updateTimer, 1000);
}

// Extend break by 5 minutes
function extendBreak() {
    if (breakTimer) {
        clearInterval(breakTimer);
        breakTimer = null;
    }
    
    // Add 5 minutes to current time
    const currentTime = document.getElementById('break-timer-text').textContent;
    const [minutes, seconds] = currentTime.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds + 300; // Add 5 minutes (300 seconds)
    const newMinutes = Math.floor(totalSeconds / 60);
    
    // Update display
    const timerText = document.getElementById('break-timer-text');
    if (timerText) {
        timerText.textContent = `${newMinutes}:00`;
    }
    
    // Restart timer with new duration
    startBreakTimer(newMinutes);
}

// Play notification sound
function playNotificationSound() {
    try {
        // Create audio context for notification sound
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('Content: Notification sound played successfully');
    } catch (error) {
        console.error('Content: Error playing notification sound:', error);
    }
}

// Show alert as last resort when notifications fail
function showAlert(title, message) {
    try {
        // Create a custom alert overlay
        const alertOverlay = document.createElement('div');
        alertOverlay.id = 'take-a-break-alert';
        alertOverlay.innerHTML = `
            <div class="alert-modal">
                <div class="alert-header">
                    <h3>${title}</h3>
                </div>
                <div class="alert-content">
                    <p>${message}</p>
                </div>
                <div class="alert-actions">
                    <button id="alert-ok-btn" class="btn btn-primary">OK</button>
                </div>
            </div>
        `;

        // Add alert styles
        const alertStyle = document.createElement('style');
        alertStyle.textContent = `
            #take-a-break-alert {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .alert-modal {
                background: white;
                border-radius: 12px;
                padding: 20px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }

            .alert-header h3 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 18px;
            }

            .alert-content p {
                margin: 0 0 20px 0;
                color: #666;
                font-size: 14px;
                line-height: 1.5;
            }

            .alert-actions {
                text-align: right;
            }

            .alert-actions .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                background: #667eea;
                color: white;
                cursor: pointer;
                font-size: 14px;
            }

            .alert-actions .btn:hover {
                background: #5a6fd8;
            }
        `;

        document.head.appendChild(alertStyle);
        document.body.appendChild(alertOverlay);

        // Add event listener to close alert
        document.getElementById('alert-ok-btn').addEventListener('click', () => {
            document.body.removeChild(alertOverlay);
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (document.body.contains(alertOverlay)) {
                document.body.removeChild(alertOverlay);
            }
        }, 5000);

        console.log('Content: Alert overlay created as fallback');
    } catch (error) {
        console.error('Content: Error creating alert overlay:', error);
        // Last resort: use browser alert
        alert(`${title}\n\n${message}`);
    }
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (breakOverlay) {
        hideBreakOverlay();
    }
});
