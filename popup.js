class BreakReminderPopup {
    constructor() {
        this.elements = {};
        this.statusUpdateInterval = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadStatus();
        this.startStatusUpdates();
    }

    initializeElements() {
        this.elements = {
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            countdown: document.getElementById('countdown'),
            countdownLabel: document.getElementById('countdownLabel'),
            breakInterval: document.getElementById('breakInterval'),
            breakDuration: document.getElementById('breakDuration'),
            enableNotifications: document.getElementById('enableNotifications'),
            enableSound: document.getElementById('enableSound'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            skipBtn: document.getElementById('skipBtn'),
            resetBtn: document.getElementById('resetBtn'),
            notificationsLabel: document.getElementById('notificationsLabel'),
            soundLabel: document.getElementById('soundLabel'),
            testNotificationsBtn: document.getElementById('testNotificationsBtn'),
            testSoundBtn: document.getElementById('testSoundBtn')
        };
    }

    setupEventListeners() {
        // Timer control buttons
        this.elements.startBtn.addEventListener('click', () => this.toggleTimer());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.elements.skipBtn.addEventListener('click', () => this.skipToBreak());
        this.elements.resetBtn.addEventListener('click', () => this.resetSettings());
        
        // Test buttons
        this.elements.testNotificationsBtn.addEventListener('click', () => this.testNotifications());
        this.elements.testSoundBtn.addEventListener('click', () => this.testSound());

        // Settings changes
        this.elements.breakInterval.addEventListener('change', (e) => {
            this.updateSetting('breakInterval', parseInt(e.target.value));
        });

        this.elements.breakDuration.addEventListener('change', (e) => {
            this.updateSetting('breakDuration', parseInt(e.target.value));
        });

        this.elements.enableNotifications.addEventListener('change', (e) => {
            this.updateSetting('enableNotifications', e.target.checked);
        });

        this.elements.enableSound.addEventListener('change', (e) => {
            this.updateSetting('enableSound', e.target.checked);
        });
    }

    // Load current status from background script
    loadStatus() {
        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
            if (response) {
                console.log('Popup: Received status:', response);
                this.updateUIFromStatus(response);
            } else {
                console.error('Popup: Failed to get status from background');
            }
        });
    }

    // Update UI based on status from background
    updateUIFromStatus(status) {
        // Update status using statusText from background script
        if (status.statusText) {
            this.elements.statusText.textContent = status.statusText;
            
            // Update status dot and button states based on status
            if (status.isRunning) {
                if (status.isPaused) {
                    this.elements.statusDot.className = 'status-dot paused';
                    this.elements.startBtn.textContent = 'Resume';
                    this.elements.pauseBtn.disabled = true;
                    this.elements.skipBtn.disabled = false;
                } else {
                    this.elements.statusDot.className = 'status-dot active';
                    this.elements.startBtn.textContent = 'Stop Timer';
                    this.elements.pauseBtn.disabled = false;
                    this.elements.skipBtn.disabled = false;
                }
            } else {
                this.elements.statusDot.className = 'status-dot stopped';
                this.elements.startBtn.textContent = 'Start Timer';
                this.elements.pauseBtn.disabled = true;
                this.elements.skipBtn.disabled = true;
            }
        }

        // Update countdown label and timer
        if (status.isRunning && !status.isPaused) {
            if (status.isOnBreak) {
                // During break: show break duration countdown
                this.elements.countdownLabel.textContent = 'Break will end in:';
                console.log('Popup: Break phase - showing break countdown, breakTimeLeft:', status.breakTimeLeft);
                
                // Use breakTimeLeft from background script for accurate countdown
                if (status.breakTimeLeft > 0) {
                    console.log('Popup: Break countdown - raw:', status.breakTimeLeft);
                    this.elements.countdown.textContent = this.formatTime(status.breakTimeLeft);
                } else {
                    this.elements.countdown.textContent = '--:--';
                }
            } else {
                // During work: show next break countdown
                this.elements.countdownLabel.textContent = 'Next break in:';
                console.log('Popup: Work phase - showing work countdown, timeLeft:', status.timeLeft);
                
                if (status.timeLeft > 0) {
                    console.log('Popup: Work countdown - raw:', status.timeLeft);
                    this.elements.countdown.textContent = this.formatTime(status.timeLeft);
                } else {
                    this.elements.countdown.textContent = '--:--';
                }
            }
        } else {
            // Timer not running or paused
            this.elements.countdownLabel.textContent = 'Next break in:';
            this.elements.countdown.textContent = '--:--';
        }

        // Update settings
        this.elements.breakInterval.value = status.breakInterval;
        this.elements.breakDuration.value = status.breakDuration;
        this.elements.enableNotifications.checked = status.enableNotifications;
        this.elements.enableSound.checked = status.enableSound;

        // Update status indicators
        this.updateStatusIndicators(status);
    }

    // Start periodic status updates
    startStatusUpdates() {
        this.statusUpdateInterval = setInterval(() => {
            this.loadStatus();
        }, 1000); // Update every second
    }

    // Stop status updates
    stopStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }

    // Timer control methods
    toggleTimer() {
        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
            if (response && response.isRunning) {
                if (response.isPaused) {
                    // If paused, resume the timer
                    this.resumeTimer();
                } else {
                    // If running, stop the timer
                    this.stopTimer();
                }
            } else {
                // If stopped, start the timer
                this.startTimer();
            }
        });
    }

    startTimer() {
        const interval = parseInt(this.elements.breakInterval.value);
        const duration = parseInt(this.elements.breakDuration.value);
        
        console.log('Popup: Starting timer with interval:', interval, 'duration:', duration);
        
        chrome.runtime.sendMessage({
            action: 'startTimer',
            breakInterval: interval,
            breakDuration: duration
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error starting timer:', chrome.runtime.lastError);
            } else {
                console.log('Popup: Timer start message sent');
                this.loadStatus(); // Refresh status
            }
        });
    }

    stopTimer() {
        console.log('Popup: Stopping timer');
        
        chrome.runtime.sendMessage({ action: 'stopTimer' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error stopping timer:', chrome.runtime.lastError);
            } else {
                console.log('Popup: Timer stop message sent');
                this.loadStatus(); // Refresh status
            }
        });
    }

    pauseTimer() {
        console.log('Popup: Pausing timer');
        
        chrome.runtime.sendMessage({ action: 'pauseTimer' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error pausing timer:', chrome.runtime.lastError);
            } else {
                console.log('Popup: Timer pause message sent');
                this.loadStatus(); // Refresh status
            }
        });
    }

    resumeTimer() {
        console.log('Popup: Resuming timer');
        
        chrome.runtime.sendMessage({ action: 'resumeTimer' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error resuming timer:', chrome.runtime.lastError);
            } else {
                console.log('Popup: Timer resume message sent');
                this.loadStatus(); // Refresh status
            }
        });
    }

    skipToBreak() {
        console.log('Popup: Skipping to break');
        
        chrome.runtime.sendMessage({ action: 'skipToBreak' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error skipping to break:', chrome.runtime.lastError);
            } else {
                console.log('Popup: Skip to break message sent');
                this.loadStatus(); // Refresh status
            }
        });
    }

    // Settings management
    updateSetting(key, value) {
        console.log('Popup: Updating setting:', key, '=', value);
        
        const settings = {};
        settings[key] = value;
        
        chrome.runtime.sendMessage({
            action: 'updateSettings',
            settings: settings
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error updating setting:', chrome.runtime.lastError);
            } else {
                console.log('Popup: Setting update message sent');
                this.loadStatus(); // Refresh status
            }
        });
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            console.log('Popup: Resetting settings');
            
            const defaultSettings = {
                breakInterval: 25,
                breakDuration: 5,
                enableNotifications: true,
                enableSound: true
            };
            
            chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings: defaultSettings
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Popup: Error resetting settings:', chrome.runtime.lastError);
                } else {
                    console.log('Popup: Settings reset message sent');
                    this.loadStatus(); // Refresh status
                }
            });
        }
    }

    // Format time to MM:SS format
    formatTime(ms) {
        if (ms <= 0) return '00:00';
        
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update labels based on checkbox state
    updateStatusIndicators(status) {
        // Update notifications label
        if (this.elements.notificationsLabel) {
            if (status.enableNotifications) {
                this.elements.notificationsLabel.textContent = 'Disable desktop notifications';
            } else {
                this.elements.notificationsLabel.textContent = 'Enable desktop notifications';
            }
        }
        
        // Update sound label
        if (this.elements.soundLabel) {
            if (status.enableSound) {
                this.elements.soundLabel.textContent = 'No sound on break';
            } else {
                this.elements.soundLabel.textContent = 'Play sound on break';
            }
        }
    }

    // Test methods
    testNotifications() {
        console.log('Popup: Testing notifications...');
        
        // Send message to background script to test notifications (more reliable than popup)
        chrome.runtime.sendMessage({ action: 'testNotifications' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error testing notifications:', chrome.runtime.lastError);
                alert('Error testing notifications: ' + chrome.runtime.lastError.message);
            } else {
                console.log('Popup: Test notification message sent to background');
                
                // Show success feedback
                const testNotificationsBtn = this.elements.testNotificationsBtn;
                const originalText = testNotificationsBtn.textContent;
                testNotificationsBtn.textContent = 'Notification Sent!';
                testNotificationsBtn.style.backgroundColor = '#4CAF50';
                testNotificationsBtn.style.color = 'white';
                
                setTimeout(() => {
                    testNotificationsBtn.textContent = originalText;
                    testNotificationsBtn.style.backgroundColor = '';
                    testNotificationsBtn.style.color = '';
                }, 2000);
            }
        });
    }

    testSound() {
        console.log('Popup: Testing sound...');
        
        try {
            // Create a simple test sound
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
            
            console.log('Popup: Test sound played successfully');
            
            // Show success message
            const testSoundBtn = this.elements.testSoundBtn;
            const originalText = testSoundBtn.textContent;
            testSoundBtn.textContent = 'Sound Tested!';
            testSoundBtn.style.backgroundColor = '#4CAF50';
            testSoundBtn.style.color = 'white';
            
            setTimeout(() => {
                testSoundBtn.textContent = originalText;
                testSoundBtn.style.backgroundColor = '';
                testSoundBtn.style.color = '';
            }, 2000);
            
        } catch (error) {
            console.error('Popup: Error playing test sound:', error);
            alert('Error playing test sound: ' + error.message);
        }
    }

    // Cleanup when popup closes
    destroy() {
        this.stopStatusUpdates();
    }
}

// Initialize the extension when the popup loads
let breakReminderPopup = null;

document.addEventListener('DOMContentLoaded', () => {
    breakReminderPopup = new BreakReminderPopup();
});

// Cleanup when popup is about to unload
window.addEventListener('beforeunload', () => {
    if (breakReminderPopup) {
        breakReminderPopup.destroy();
    }
});
