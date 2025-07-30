// Main application controller for Taimuragu
class TaimuraguApp {
    constructor() {
        this.version = '1.0.0';
        this.uiController = null;
        this.initialized = false;
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 60;
        
        // Settings
        this.settings = this.loadSettings();
        
        this.init();
    }
    
    async init() {
        try {
            console.log(`🎵 Taimuragu v${this.version} - Initializing...`);
            
            // Check browser compatibility
            if (!this.checkBrowserSupport()) {
                this.showCompatibilityError();
                return;
            }
            
            // Initialize UI controller
            this.uiController = new UIController();
            
            // Apply settings
            this.applySettings();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Show welcome message
            this.showWelcomeMessage();
            
            this.initialized = true;
            console.log('✅ Taimuragu initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize Taimuragu:', error);
            this.showInitializationError(error);
        }
    }
    
    checkBrowserSupport() {
        const requiredFeatures = {
            'Web Audio API': () => window.AudioContext || window.webkitAudioContext,
            'Canvas 2D': () => {
                const canvas = document.createElement('canvas');
                return canvas.getContext && canvas.getContext('2d');
            },
            'File API': () => window.File && window.FileReader && window.FileList && window.Blob,
            'ES6 Classes': () => {
                try {
                    eval('class Test {}');
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'RequestAnimationFrame': () => window.requestAnimationFrame,
            'Local Storage': () => window.localStorage
        };
        
        const unsupported = [];
        
        for (const [feature, check] of Object.entries(requiredFeatures)) {
            if (!check()) {
                unsupported.push(feature);
            }
        }
        
        if (unsupported.length > 0) {
            console.warn('⚠️ Unsupported features:', unsupported);
            return false;
        }
        
        return true;
    }
    
    showCompatibilityError() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
                color: white;
                font-family: 'Orbitron', monospace;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="font-size: 3rem; margin-bottom: 2rem; color: #ff6b6b;">
                        Browser Not Supported
                    </h1>
                    <p style="font-size: 1.2rem; margin-bottom: 2rem; color: #b8b8b8;">
                        Taimuragu requires a modern browser with Web Audio API support.
                    </p>
                    <p style="font-size: 1rem; color: #96ceb4;">
                        Please try using Chrome, Firefox, Safari, or Edge.
                    </p>
                </div>
            </div>
        `;
    }
    
    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 107, 107, 0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            font-family: 'Orbitron', monospace;
            text-align: center;
            z-index: 10000;
            max-width: 500px;
        `;
        
        errorDiv.innerHTML = `
            <h2>⚠️ Initialization Error</h2>
            <p style="margin: 20px 0;">Failed to start Taimuragu:</p>
            <p style="font-family: monospace; font-size: 0.9rem; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
                ${error.message}
            </p>
            <button onclick="location.reload()" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: #4ecdc4;
                border: none;
                border-radius: 5px;
                color: white;
                font-family: 'Orbitron', monospace;
                cursor: pointer;
            ">
                Reload Page
            </button>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('🚨 Global Error:', event.error);
            this.logError('Global Error', event.error);
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled Promise Rejection:', event.reason);
            this.logError('Unhandled Promise Rejection', event.reason);
        });
        
        // Audio context error handling
        if (window.AudioContext || window.webkitAudioContext) {
            const originalCreateBufferSource = AudioContext.prototype.createBufferSource;
            AudioContext.prototype.createBufferSource = function() {
                try {
                    return originalCreateBufferSource.call(this);
                } catch (error) {
                    console.error('🚨 Audio Error:', error);
                    throw error;
                }
            };
        }
    }
    
    setupPerformanceMonitoring() {
        let lastTime = performance.now();
        const targetFPS = 60;
        const fpsUpdateInterval = 1000; // Update FPS every second
        
        const monitorFrame = (currentTime) => {
            this.frameCount++;
            
            if (currentTime - this.lastFPSUpdate >= fpsUpdateInterval) {
                this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSUpdate));
                this.frameCount = 0;
                this.lastFPSUpdate = currentTime;
                
                // Warn if FPS is consistently low
                if (this.currentFPS < targetFPS * 0.8) {
                    console.warn(`⚠️ Low FPS detected: ${this.currentFPS}`);
                }
            }
            
            lastTime = currentTime;
            requestAnimationFrame(monitorFrame);
        };
        
        requestAnimationFrame(monitorFrame);
    }
    
    logError(type, error) {
        // In a production app, you'd send this to an error tracking service
        const errorLog = {
            type: type,
            message: error.message || error.toString(),
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store in local storage for debugging
        try {
            const existingLogs = JSON.parse(localStorage.getItem('taimuragu_error_logs') || '[]');
            existingLogs.push(errorLog);
            
            // Keep only last 50 errors
            if (existingLogs.length > 50) {
                existingLogs.splice(0, existingLogs.length - 50);
            }
            
            localStorage.setItem('taimuragu_error_logs', JSON.stringify(existingLogs));
        } catch (storageError) {
            console.warn('Failed to store error log:', storageError);
        }
    }
    
    loadSettings() {
        try {
            const stored = localStorage.getItem('taimuragu_settings');
            const defaultSettings = {
                volume: 0.7,
                effectsVolume: 0.8,
                showFPS: false,
                enableParticles: true,
                beatSensitivity: 1.0,
                inputLatency: 0, // ms
                visualEffects: true,
                autoPlay: false,
                difficulty: 'normal'
            };
            
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch (error) {
            console.warn('Failed to load settings, using defaults:', error);
            return this.getDefaultSettings();
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('taimuragu_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }
    
    applySettings() {
        // Apply volume settings
        if (this.uiController && this.uiController.gameEngine) {
            this.uiController.gameEngine.audioManager.setVolume(this.settings.volume);
        }
        
        // Apply visual settings
        document.documentElement.style.setProperty('--effects-enabled', 
            this.settings.visualEffects ? '1' : '0');
    }
    
    getDefaultSettings() {
        return {
            volume: 0.7,
            effectsVolume: 0.8,
            showFPS: false,
            enableParticles: true,
            beatSensitivity: 1.0,
            inputLatency: 0,
            visualEffects: true,
            autoPlay: false,
            difficulty: 'normal'
        };
    }
    
    showWelcomeMessage() {
        console.log(`
🎵 Welcome to TAIMURAGU! 🎵

The rhythm-reaction game of delayed precision.

🎯 How to play:
• Each target shows a countdown timer
• Click when the timer reaches zero
• Master the art of timing!

🛠️ Features:
• Built-in map editor
• Upload your own songs
• Beat detection
• Particle effects
• Responsive design

Made with ❤️ for rhythm game enthusiasts.
        `);
    }
    
    // Public API methods
    updateSetting(key, value) {
        if (this.settings.hasOwnProperty(key)) {
            this.settings[key] = value;
            this.saveSettings();
            this.applySettings();
            console.log(`Setting updated: ${key} = ${value}`);
        } else {
            console.warn(`Unknown setting: ${key}`);
        }
    }
    
    getSetting(key) {
        return this.settings[key];
    }
    
    getPerformanceInfo() {
        return {
            fps: this.currentFPS,
            initialized: this.initialized,
            version: this.version,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    }
    
    getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('taimuragu_error_logs') || '[]');
        } catch (error) {
            return [];
        }
    }
    
    clearErrorLogs() {
        localStorage.removeItem('taimuragu_error_logs');
    }
    
    // Debug methods
    enableDebugMode() {
        window.taimuraguDebug = {
            app: this,
            ui: this.uiController,
            game: this.uiController?.gameEngine,
            editor: this.uiController?.mapEditor,
            performance: this.getPerformanceInfo(),
            settings: this.settings,
            errors: this.getErrorLogs()
        };
        
        console.log('🔧 Debug mode enabled. Access via window.taimuraguDebug');
        
        // Add FPS counter if enabled
        if (this.settings.showFPS) {
            this.addFPSCounter();
        }
    }
    
    addFPSCounter() {
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'fps-counter';
        fpsCounter.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #4ecdc4;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            z-index: 9999;
            pointer-events: none;
        `;
        
        document.body.appendChild(fpsCounter);
        
        const updateFPS = () => {
            if (document.getElementById('fps-counter')) {
                fpsCounter.textContent = `FPS: ${this.currentFPS}`;
                requestAnimationFrame(updateFPS);
            }
        };
        
        updateFPS();
    }
    
    // Utility methods
    exportGameData() {
        const gameData = {
            version: this.version,
            settings: this.settings,
            timestamp: new Date().toISOString(),
            performance: this.getPerformanceInfo(),
            userAgent: navigator.userAgent
        };
        
        // Add game-specific data if available
        if (this.uiController?.gameEngine) {
            gameData.gameStats = {
                // Add any persistent game statistics here
            };
        }
        
        const blob = new Blob([JSON.stringify(gameData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taimuragu-data-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    // Public API for external integrations
    getAPI() {
        return {
            version: this.version,
            initialized: this.initialized,
            settings: {
                get: (key) => this.getSetting(key),
                set: (key, value) => this.updateSetting(key, value),
                getAll: () => ({ ...this.settings })
            },
            performance: () => this.getPerformanceInfo(),
            game: {
                getCurrentScreen: () => this.uiController?.getCurrentScreen(),
                getGameEngine: () => this.uiController?.getGameEngine(),
                getMapEditor: () => this.uiController?.getMapEditor()
            },
            debug: {
                enable: () => this.enableDebugMode(),
                exportData: () => this.exportGameData(),
                getErrors: () => this.getErrorLogs(),
                clearErrors: () => this.clearErrorLogs()
            }
        };
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.taimuragu = new TaimuraguApp();
    
    // Expose public API
    window.TaimuraguAPI = window.taimuragu.getAPI();
    
    // Enable debug mode in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.taimuragu.enableDebugMode();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.taimuragu && window.taimuragu.uiController) {
        const gameEngine = window.taimuragu.uiController.gameEngine;
        const mapEditor = window.taimuragu.uiController.mapEditor;
        
        if (document.hidden) {
            // Pause game/editor when page is hidden
            if (gameEngine && gameEngine.isPlaying) {
                gameEngine.pauseGame();
            }
            if (mapEditor && mapEditor.isPlaying) {
                mapEditor.play(); // This will pause if already playing
            }
        }
    }
});

// Handle beforeunload to clean up
window.addEventListener('beforeunload', () => {
    if (window.taimuragu && window.taimuragu.uiController) {
        const gameEngine = window.taimuragu.uiController.gameEngine;
        const mapEditor = window.taimuragu.uiController.mapEditor;
        
        if (gameEngine) {
            gameEngine.stopGame();
        }
        if (mapEditor) {
            mapEditor.deactivate();
        }
    }
});