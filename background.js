// Background service worker for Take a Break Reminder extension

let currentAlarm = null;
let breakAlarm = null;
let isRunning = false;
let isPaused = false;
let isOnBreak = false;
let breakInterval = 25; // minutes - default 25
let breakDuration = 5; // minutes - default 5
let enableNotifications = true;
let enableSound = true;
let nextBreakTime = null;
let breakEndTime = null;
let pauseStartTime = null;
let pausedDuration = 0;

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
    console.log('Take a Break Reminder extension installed');
    
    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Load saved settings
    loadSettings();
});

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get({
        breakInterval: 25,
        breakDuration: 5,
        enableNotifications: true,
        enableSound: true
    }, (items) => {
        console.log('Background: Loading settings:', items);
        breakInterval = items.breakInterval;
        breakDuration = items.breakDuration;
        enableNotifications = items.enableNotifications;
        enableSound = items.enableSound;
    });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background: Received message:', message);
    
    switch (message.action) {
        case 'startTimer':
            startTimer(message.breakInterval, message.breakDuration);
            break;
        case 'stopTimer':
            stopTimer();
            break;
        case 'pauseTimer':
            pauseTimer();
            break;
        case 'resumeTimer':
            resumeTimer();
            break;
        case 'skipToBreak':
            skipToBreak();
            break;
        case 'getStatus':
            const timeLeft = nextBreakTime ? Math.max(0, nextBreakTime - Date.now()) : 0;
            const breakTimeLeft = breakEndTime ? Math.max(0, breakEndTime - Date.now()) : 0;
            console.log('Background: Sending status - timeLeft:', timeLeft, 'breakTimeLeft:', breakTimeLeft, 'nextBreakTime:', nextBreakTime, 'now:', Date.now());
            console.log('Background: Time calculations - timeLeft (ms):', timeLeft, 'breakTimeLeft (ms):', breakTimeLeft);
            
            // Determine status text based on current state
            let statusText = 'Stopped';
            if (isRunning) {
                if (isPaused) {
                    statusText = 'Pause - Pomodoro';
                } else if (isOnBreak) {
                    statusText = 'Break';
                } else {
                    statusText = 'Active - Pomodoro';
                }
            }
            
            // Log current state for debugging
            logCurrentState();
            
            sendResponse({
                isRunning,
                isPaused,
                isOnBreak,
                breakInterval,
                breakDuration,
                enableNotifications,
                enableSound,
                nextBreakTime,
                breakEndTime,
                timeLeft: timeLeft,
                breakTimeLeft: breakTimeLeft,
                statusText: statusText
            });
            break;
        case 'updateSettings':
            updateSettings(message.settings);
            break;
        case 'testNotifications':
            testNotifications();
            break;
    }
    
    return true; // Keep message channel open for async response
});

// Start the timer
function startTimer(newBreakInterval, newBreakDuration) {
    console.log('Background: Starting timer');
    
    // Update settings if provided
    if (newBreakInterval) breakInterval = newBreakInterval;
    if (newBreakDuration) breakDuration = newBreakDuration;
    
    isRunning = true;
    isPaused = false;
    isOnBreak = false;
    pausedDuration = 0;
    breakEndTime = null;
    
    if (pauseStartTime) {
        pausedDuration += Date.now() - pauseStartTime;
        pauseStartTime = null;
    }

    nextBreakTime = Date.now() + (breakInterval * 60 * 1000) - pausedDuration;
    
    // Clear any existing alarms
    if (currentAlarm) {
        chrome.alarms.clear(currentAlarm);
    }
    if (breakAlarm) {
        chrome.alarms.clear(breakAlarm);
    }

    // Set main break alarm
    const alarmName = `break_reminder_${Date.now()}`;
    currentAlarm = alarmName;
    
    chrome.alarms.create(alarmName, {
        delayInMinutes: breakInterval
    }).then(() => {
        console.log(`Background: Alarm created successfully: ${alarmName}`);
    }).catch((error) => {
        console.error('Background: Error creating alarm:', error);
    });

    console.log(`Background: Timer started, next break in ${breakInterval} minutes`);
    
    // Save settings
    saveSettings();
}

// Stop the timer
function stopTimer() {
    console.log('Background: Stopping timer');
    
    isRunning = false;
    isPaused = false;
    isOnBreak = false;
    pauseStartTime = null;
    pausedDuration = 0;
    nextBreakTime = null;
    breakEndTime = null;
    
    // Clear alarms
    if (currentAlarm) {
        chrome.alarms.clear(currentAlarm);
        currentAlarm = null;
    }
    if (breakAlarm) {
        chrome.alarms.clear(breakAlarm);
        breakAlarm = null;
    }
    
    console.log('Background: Timer stopped');
}

// Pause the timer
function pauseTimer() {
    if (!isRunning || isPaused) return;
    
    console.log('Background: Pausing timer');
    isPaused = true;
    pauseStartTime = Date.now();
    
    // Clear the current alarm
    if (currentAlarm) {
        chrome.alarms.clear(currentAlarm);
        currentAlarm = null;
    }
}

// Resume the timer
function resumeTimer() {
    if (!isRunning || !isPaused) return;
    
    console.log('Background: Resuming timer');
    isPaused = false;
    
    if (pauseStartTime) {
        pausedDuration += Date.now() - pauseStartTime;
        pauseStartTime = null;
    }
    
    // Restart the alarm with remaining time
    const remainingTime = Math.max(0, nextBreakTime - Date.now() - pausedDuration);
    const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
    
    if (remainingMinutes > 0) {
        const alarmName = `break_reminder_${Date.now()}`;
        currentAlarm = alarmName;
        
        chrome.alarms.create(alarmName, {
            delayInMinutes: remainingMinutes
        });
        
        console.log(`Background: Timer resumed, break in ${remainingMinutes} minutes`);
    }
}

// Skip to break immediately
function skipToBreak() {
    if (!isRunning) return;
    
    console.log('Background: Skipping to break');
    
    // Clear current alarm
    if (currentAlarm) {
        chrome.alarms.clear(currentAlarm);
        currentAlarm = null;
    }
    
    // Set break state
    isOnBreak = true;
    breakEndTime = Date.now() + (breakDuration * 60 * 1000);
    
    // Create break end alarm
    const breakEndAlarmName = `break_end_${Date.now()}`;
    breakAlarm = breakEndAlarmName;
    
    chrome.alarms.create(breakEndAlarmName, {
        delayInMinutes: breakDuration
    }).then(() => {
        console.log(`Background: Break end alarm created: ${breakEndAlarmName}`);
    }).catch((error) => {
        console.error('Background: Error creating break end alarm:', error);
    });
    
    // Show break notification
    showBreakNotification();
    
    // Schedule next break cycle
    nextBreakTime = Date.now() + (breakInterval * 60 * 1000);
    const newAlarmName = `break_reminder_${Date.now()}`;
    currentAlarm = newAlarmName;
    
    chrome.alarms.create(newAlarmName, {
        delayInMinutes: breakInterval
    }).then(() => {
        console.log(`Background: Next break alarm created: ${newAlarmName}`);
    }).catch((error) => {
        console.error('Background: Error creating next break alarm:', error);
    });
}

// Restart the timer
function restartTimer() {
    stopTimer();
    setTimeout(() => startTimer(), 100);
}

// Update settings
function updateSettings(newSettings) {
    if (newSettings.breakInterval !== undefined) breakInterval = newSettings.breakInterval;
    if (newSettings.breakDuration !== undefined) breakDuration = newSettings.breakDuration;
    if (newSettings.enableNotifications !== undefined) enableNotifications = newSettings.enableNotifications;
    if (newSettings.enableSound !== undefined) enableSound = newSettings.enableSound;
    
    console.log('Background: Settings updated:', { breakInterval, breakDuration, enableNotifications, enableSound });
    
    // If timer is running, restart it with new settings
    if (isRunning && !isPaused) {
        restartTimer();
    }
    
    saveSettings();
}

// Save settings to storage
function saveSettings() {
    const settings = {
        breakInterval,
        breakDuration,
        enableNotifications,
        enableSound
    };
    
    chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
            console.error('Background: Error saving settings:', chrome.runtime.lastError);
        } else {
            console.log('Background: Settings saved successfully');
        }
    });
}

// Stop the break alarm
function stopBreakAlarm() {
    if (currentAlarm) {
        chrome.alarms.clear(currentAlarm);
        currentAlarm = null;
    }
    if (breakAlarm) {
        chrome.alarms.clear(breakAlarm);
        breakAlarm = null;
    }
    console.log('Break alarms cleared');
}

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Background: Alarm triggered:', alarm.name, 'currentAlarm:', currentAlarm, 'breakAlarm:', breakAlarm);
    
    if (alarm.name === currentAlarm) {
        // Main break time reached
        console.log('Background: Main break alarm triggered, showing notification');
        showBreakNotification();
        
        // Set break end alarm
        const breakEndAlarmName = `break_end_${Date.now()}`;
        breakAlarm = breakEndAlarmName;
        
        chrome.alarms.create(breakEndAlarmName, {
            delayInMinutes: breakDuration
        }).then(() => {
            console.log(`Background: Break end alarm created: ${breakEndAlarmName}`);
        }).catch((error) => {
            console.error('Background: Error creating break end alarm:', error);
        });

        // Restart the main alarm for the next cycle
        const newAlarmName = `break_reminder_${Date.now()}`;
        currentAlarm = newAlarmName;
        
        chrome.alarms.create(newAlarmName, {
            delayInMinutes: breakInterval
        }).then(() => {
            console.log(`Background: Next break alarm created: ${newAlarmName}`);
        }).catch((error) => {
            console.error('Background: Error creating next break alarm:', error);
        });
        
        console.log(`Background: Next break scheduled in ${breakInterval} minutes`);
    } else if (alarm.name === breakAlarm) {
        // Break time is over
        showBreakEndNotification();
        breakAlarm = null;
        
        // Update nextBreakTime to reflect the next break cycle
        if (isRunning && !isPaused) {
            nextBreakTime = Date.now() + (breakInterval * 60 * 1000);
            console.log('Background: Break ended, nextBreakTime updated to:', new Date(nextBreakTime));
            console.log('Background: Break ended, isOnBreak set to false, transitioning to work phase');
        }
        
        // The main timer is already running for the next cycle
        // Just ensure the countdown continues properly
        console.log('Background: Break ended, main timer continues for next break');
        
        // Log current state for debugging
        logCurrentState();
    }
});

// Show break notification
function showBreakNotification() {
    console.log('Background: Showing break notification - enableNotifications:', enableNotifications, 'enableSound:', enableSound);
    
    // Set break state and calculate break end time
    isOnBreak = true;
    breakEndTime = Date.now() + (breakDuration * 60 * 1000);
    
    if (enableNotifications) {
        // Create desktop notification
        try {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Time for a Break! 🎯',
                message: `Take ${breakDuration} minutes to stretch, hydrate, and rest your eyes.`,
                requireInteraction: true,
                buttons: [
                    { title: 'Start Break' },
                    { title: 'Skip Break' }
                ]
            }, (notificationId) => {
                if (chrome.runtime.lastError) {
                    console.error('Background: Error creating break notification:', chrome.runtime.lastError);
                    // Fallback: try to show a simple notification
                    showFallbackNotification('Time for a Break! 🎯', `Take ${breakDuration} minutes to stretch, hydrate, and rest your eyes.`);
                } else {
                    console.log('Background: Break notification created with ID:', notificationId);
                }
            });
        } catch (error) {
            console.error('Background: Exception creating break notification:', error);
            // Fallback: try to show a simple notification
            showFallbackNotification('Time for a Break! 🎯', `Take ${breakDuration} minutes to stretch, hydrate, and rest your eyes.`);
        }
    } else {
        console.log('Background: Notifications disabled, skipping desktop notification');
    }

    // Play notification sound if enabled
    if (enableSound) {
        console.log('Background: Playing notification sound');
        playNotificationSound();
    } else {
        console.log('Background: Sound disabled, skipping audio');
    }

    // Send message to all tabs to show break overlay
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'showBreakOverlay',
                duration: breakDuration
            }).catch(() => {
                // Tab might not have content script loaded
            });
        });
    });
}

// Show break end notification
function showBreakEndNotification() {
    console.log('Background: Showing break end notification');
    
    // Clear break state and break end time
    isOnBreak = false;
    breakEndTime = null;
    
    if (enableNotifications) {
        try {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Break Time is Over! ⏰',
                message: 'Time to get back to work. Stay productive!',
                requireInteraction: false
            }, (notificationId) => {
                if (chrome.runtime.lastError) {
                    console.error('Background: Error creating break end notification:', chrome.runtime.lastError);
                    // Fallback: try to show a simple notification
                    showFallbackNotification('Break Time is Over! ⏰', 'Time to get back to work. Stay productive!');
                } else {
                    console.log('Background: Break end notification created with ID:', notificationId);
                }
            });
        } catch (error) {
            console.error('Background: Exception creating break end notification:', error);
            // Fallback: try to show a simple notification
            showFallbackNotification('Break Time is Over! ⏰', 'Time to get back to work. Stay productive!');
        }
    }

    if (enableSound) {
        playNotificationSound();
    }

    // Hide break overlay on all tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'hideBreakOverlay'
            }).catch(() => {
                // Tab might not have content script loaded
            });
        });
    });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        // Start Break button clicked
        chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
        // Skip Break button clicked
        chrome.notifications.clear(notificationId);
        // Restart timer immediately
        restartTimer();
    }
});

// Test notifications function
function testNotifications() {
    console.log('Background: Testing notifications...');
    
    try {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Test Notification 🧪',
            message: 'This is a test notification from Take a Break Reminder!',
            requireInteraction: false
        }, (notificationId) => {
            if (chrome.runtime.lastError) {
                console.error('Background: Error creating test notification:', chrome.runtime.lastError);
                // Fallback: try to show a simple notification
                showFallbackNotification('Test Notification 🧪', 'This is a test notification from Take a Break Reminder!');
            } else {
                console.log('Background: Test notification created successfully with ID:', notificationId);
                
                // Auto-close the test notification after 3 seconds
                setTimeout(() => {
                    chrome.notifications.clear(notificationId);
                }, 3000);
            }
        });
    } catch (error) {
        console.error('Background: Exception creating test notification:', error);
        // Fallback: try to show a simple notification
        showFallbackNotification('Test Notification 🧪', 'This is a test notification from Take a Break Reminder!');
    }
}

// Debug function to log current state
function logCurrentState() {
    console.log('Background: Current state:', {
        isRunning,
        isPaused,
        isOnBreak,
        breakInterval,
        breakDuration,
        nextBreakTime: nextBreakTime ? new Date(nextBreakTime) : null,
        breakEndTime: breakEndTime ? new Date(breakEndTime) : null,
        timeLeft: nextBreakTime ? Math.max(0, nextBreakTime - Date.now()) : 0,
        breakTimeLeft: breakEndTime ? Math.max(0, breakEndTime - Date.now()) : 0,
        currentAlarm,
        breakAlarm
    });
}

// Fallback notification function
function showFallbackNotification(title, message) {
    console.log('Background: Using fallback notification');
    
    // Try to show a simple notification without buttons
    try {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message,
            requireInteraction: false
        }, (notificationId) => {
            if (chrome.runtime.lastError) {
                console.error('Background: Fallback notification also failed:', chrome.runtime.lastError);
                // Last resort: send message to tabs to show alert
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'showAlert',
                            title: title,
                            message: message
                        }).catch(() => {
                            // Tab might not have content script loaded
                        });
                    });
                });
            } else {
                console.log('Background: Fallback notification created successfully');
            }
        });
    } catch (error) {
        console.error('Background: Exception in fallback notification:', error);
        // Last resort: send message to tabs to show alert
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'showAlert',
                    title: title,
                    message: message
                }).catch(() => {
                    // Tab might not have content script loaded
                });
            });
        });
    }
}

// Play notification sound
function playNotificationSound() {
    console.log('Background: playNotificationSound called');
    
    try {
        // Send message to all tabs to play sound (more reliable than background script audio)
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'playNotificationSound'
                }).catch(() => {
                    // Tab might not have content script loaded
                });
            });
        });
        
        console.log('Background: Sound play message sent to tabs');
    } catch (error) {
        console.error('Background: Error sending sound play message:', error);
    }
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Background: Extension started');
    
    // Load settings
    loadSettings();
    
    // Check if there are any existing alarms and restore them
    chrome.alarms.getAll((alarms) => {
        if (alarms.length > 0) {
            // Extension was restarted, clear old alarms
            alarms.forEach(alarm => {
                chrome.alarms.clear(alarm.name);
            });
        }
    });
});

// Listen for storage changes to keep settings in sync
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        console.log('Background: Storage changed:', changes);
        
        // Update local variables if they changed
        if (changes.breakInterval) {
            breakInterval = changes.breakInterval.newValue;
        }
        if (changes.breakDuration) {
            breakDuration = changes.breakDuration.newValue;
        }
        if (changes.enableNotifications) {
            enableNotifications = changes.enableNotifications.newValue;
        }
        if (changes.enableSound) {
            enableSound = changes.enableSound.newValue;
        }
        
        // If timer is running, restart it with new settings
        if (isRunning && !isPaused) {
            restartTimer();
        }
    }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        // Inject content script if not already present
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch(() => {
            // Script might already be injected
        });
    }
});
