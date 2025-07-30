// UI Controller for managing screens and user interactions
class UIController {
    constructor() {
        this.currentScreen = 'main-menu';
        this.gameEngine = null;
        this.mapEditor = null;
        
        // Song library
        this.songs = this.loadSongLibrary();
        
        this.setupEventListeners();
        this.showScreen('main-menu');
    }
    
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            this.showScreen('song-select');
        });
        
        document.getElementById('editor-btn').addEventListener('click', () => {
            this.showScreen('editor-screen');
            this.initializeEditor();
        });
        
        document.getElementById('how-to-play-btn').addEventListener('click', () => {
            this.showScreen('how-to-play');
        });
        
        // Song selection
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        document.getElementById('audio-upload').addEventListener('change', (e) => {
            this.handleSongUpload(e);
        });
        
        // Game controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (this.gameEngine) {
                this.gameEngine.pauseGame();
                this.showOverlay('pause-menu');
            }
        });
        
        document.getElementById('back-to-select').addEventListener('click', () => {
            if (this.gameEngine) {
                this.gameEngine.stopGame();
            }
            this.showScreen('song-select');
        });
        
        // Pause menu
        document.getElementById('resume-btn').addEventListener('click', () => {
            if (this.gameEngine) {
                this.gameEngine.pauseGame();
            }
            this.hideOverlay('pause-menu');
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            if (this.gameEngine) {
                this.gameEngine.startGame();
            }
            this.hideOverlay('pause-menu');
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            if (this.gameEngine) {
                this.gameEngine.stopGame();
            }
            this.hideOverlay('pause-menu');
            this.showScreen('song-select');
        });
        
        // Game over
        document.getElementById('play-again-btn').addEventListener('click', () => {
            if (this.gameEngine) {
                this.gameEngine.startGame();
            }
            this.hideOverlay('game-over');
        });
        
        document.getElementById('game-over-menu').addEventListener('click', () => {
            this.hideOverlay('game-over');
            this.showScreen('main-menu');
        });
        
        // Instructions
        document.getElementById('instructions-back').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        // Editor controls
        this.setupEditorControls();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });
    }
    
    setupEditorControls() {
        const loadSongBtn = document.getElementById('load-song');
        const playPauseBtn = document.getElementById('play-pause');
        const saveMapBtn = document.getElementById('save-map');
        const loadMapBtn = document.getElementById('load-map');
        const clearMapBtn = document.getElementById('clear-map');
        const editorBackBtn = document.getElementById('editor-back');
        
        const editorAudioUpload = document.getElementById('editor-audio-upload');
        const mapFileInput = document.getElementById('map-file-input');
        
        const targetTypeSelect = document.getElementById('target-type');
        const delayInput = document.getElementById('delay-input');
        const gridSizeSelect = document.getElementById('grid-size');
        const timelineSlider = document.getElementById('timeline-slider');
        
        // Button event listeners
        loadSongBtn.addEventListener('click', () => {
            editorAudioUpload.click();
        });
        
        playPauseBtn.addEventListener('click', () => {
            if (this.mapEditor) {
                this.mapEditor.play();
            }
        });
        
        saveMapBtn.addEventListener('click', () => {
            if (this.mapEditor) {
                this.mapEditor.saveMap();
            }
        });
        
        loadMapBtn.addEventListener('click', () => {
            mapFileInput.click();
        });
        
        clearMapBtn.addEventListener('click', () => {
            if (this.mapEditor && confirm('Clear all targets? This cannot be undone.')) {
                this.mapEditor.clearMap();
            }
        });
        
        editorBackBtn.addEventListener('click', () => {
            if (this.mapEditor) {
                this.mapEditor.deactivate();
            }
            this.showScreen('main-menu');
        });
        
        // File input handlers
        editorAudioUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && this.mapEditor) {
                const result = await this.mapEditor.loadSong(file);
                if (result.success) {
                    this.updateTimelineUI();
                    this.showNotification(`Loaded: ${result.name}`, 'success');
                } else {
                    this.showNotification(`Failed to load song: ${result.error}`, 'error');
                }
            }
        });
        
        mapFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && this.mapEditor) {
                const result = await this.mapEditor.loadMap(file);
                if (result.success) {
                    this.showNotification(`Loaded map: ${result.map.name}`, 'success');
                } else {
                    this.showNotification(`Failed to load map: ${result.error}`, 'error');
                }
            }
        });
        
        // Settings change handlers
        targetTypeSelect.addEventListener('change', (e) => {
            if (this.mapEditor) {
                this.mapEditor.updateSettings({ targetType: e.target.value });
            }
        });
        
        delayInput.addEventListener('change', (e) => {
            if (this.mapEditor) {
                this.mapEditor.updateSettings({ delay: e.target.value });
            }
        });
        
        gridSizeSelect.addEventListener('change', (e) => {
            if (this.mapEditor) {
                this.mapEditor.updateSettings({ gridSize: e.target.value });
            }
        });
        
        // Timeline slider
        timelineSlider.addEventListener('input', (e) => {
            if (this.mapEditor && this.mapEditor.currentSong) {
                const time = (e.target.value / 100) * this.mapEditor.currentSong.duration;
                this.mapEditor.seekTo(time);
            }
        });
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Screen-specific setup
            switch (screenId) {
                case 'song-select':
                    this.populateSongList();
                    break;
                case 'game-screen':
                    this.initializeGame();
                    break;
                case 'editor-screen':
                    this.initializeEditor();
                    break;
            }
        }
    }
    
    showOverlay(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    hideOverlay(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    populateSongList() {
        const songList = document.getElementById('song-list');
        songList.innerHTML = '';
        
        // Add demo songs
        this.songs.forEach(song => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.innerHTML = `
                <div class="song-title">${song.title}</div>
                <div class="song-duration">${song.duration}</div>
            `;
            
            songItem.addEventListener('click', () => {
                this.selectSong(song);
            });
            
            songList.appendChild(songItem);
        });
        
        // Add demo metronome option
        const metronomeItem = document.createElement('div');
        metronomeItem.className = 'song-item';
        metronomeItem.innerHTML = `
            <div class="song-title">🎵 Demo Metronome (120 BPM)</div>
            <div class="song-duration">3:00</div>
        `;
        
        metronomeItem.addEventListener('click', () => {
            this.startMetronomeDemo();
        });
        
        songList.appendChild(metronomeItem);
    }
    
    async handleSongUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Add to song list temporarily
        const customSong = {
            title: file.name,
            duration: 'Unknown',
            file: file,
            isCustom: true
        };
        
        this.selectSong(customSong);
    }
    
    async selectSong(song) {
        this.showScreen('game-screen');
        
        // Initialize game if not already done
        if (!this.gameEngine) {
            const canvas = document.getElementById('game-canvas');
            this.gameEngine = new GameEngine(canvas);
            this.setupGameCallbacks();
        }
        
        // Load song
        let loadResult;
        if (song.file) {
            loadResult = await this.gameEngine.loadSong(song.file);
        } else if (song.isMetronome) {
            // Special case for metronome demo
            this.gameEngine.audioManager.createMetronome(120);
            this.gameEngine.currentSong = { name: 'Demo Metronome', duration: 180 };
            this.gameEngine.createDemoPattern();
            loadResult = { success: true };
        } else {
            this.showNotification('Song type not supported in demo', 'error');
            return;
        }
        
        if (loadResult.success) {
            // Update UI
            document.getElementById('current-song').textContent = song.title;
            document.getElementById('total-time').textContent = 
                this.gameEngine.audioManager.formatTime(this.gameEngine.getDuration());
            
            // Start game
            setTimeout(() => {
                this.gameEngine.startGame();
            }, 500);
        } else {
            this.showNotification(`Failed to load song: ${loadResult.error}`, 'error');
            this.showScreen('song-select');
        }
    }
    
    startMetronomeDemo() {
        const metronomeDemo = {
            title: 'Demo Metronome (120 BPM)',
            duration: '3:00',
            isMetronome: true
        };
        this.selectSong(metronomeDemo);
    }
    
    initializeGame() {
        if (!this.gameEngine) {
            const canvas = document.getElementById('game-canvas');
            this.gameEngine = new GameEngine(canvas);
            this.setupGameCallbacks();
        }
    }
    
    setupGameCallbacks() {
        this.gameEngine.onScoreUpdate = (stats) => {
            document.getElementById('score').textContent = stats.score;
            document.getElementById('combo').textContent = stats.combo;
            document.getElementById('accuracy').textContent = stats.accuracy + '%';
        };
        
        this.gameEngine.onGameEnd = (finalStats) => {
            document.getElementById('final-score').textContent = finalStats.score;
            document.getElementById('max-combo').textContent = finalStats.maxCombo;
            document.getElementById('final-accuracy').textContent = finalStats.accuracy + '%';
            this.showOverlay('game-over');
        };
        
        // Update time display
        this.gameEngine.audioManager.onTimeUpdate = (time) => {
            document.getElementById('current-time').textContent = 
                this.gameEngine.audioManager.formatTime(time);
        };
    }
    
    initializeEditor() {
        if (!this.mapEditor) {
            const canvas = document.getElementById('editor-canvas');
            this.mapEditor = new MapEditor(canvas);
            this.setupEditorCallbacks();
        }
        this.mapEditor.activate();
    }
    
    setupEditorCallbacks() {
        this.mapEditor.onTimeUpdate = (time) => {
            document.getElementById('timeline-time').textContent = 
                this.mapEditor.audioManager.formatTime(time);
            
            // Update timeline slider
            if (this.mapEditor.currentSong) {
                const progress = (time / this.mapEditor.currentSong.duration) * 100;
                document.getElementById('timeline-slider').value = progress;
            }
        };
    }
    
    updateTimelineUI() {
        const timelineSlider = document.getElementById('timeline-slider');
        if (this.mapEditor && this.mapEditor.currentSong) {
            timelineSlider.max = 100;
            timelineSlider.value = 0;
            timelineSlider.disabled = false;
        } else {
            timelineSlider.disabled = true;
        }
    }
    
    handleGlobalKeydown(event) {
        // Global keyboard shortcuts
        switch (event.key) {
            case 'Escape':
                if (this.currentScreen === 'game-screen' && this.gameEngine && this.gameEngine.isPlaying) {
                    this.gameEngine.pauseGame();
                    this.showOverlay('pause-menu');
                }
                break;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 'bold',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'error' ? '#ff6b6b' : 
                           type === 'success' ? '#4ecdc4' : '#45b7d1'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    loadSongLibrary() {
        // Demo song library - in a real app, this would come from a database
        return [
            {
                title: 'Electronic Beat 1',
                duration: '2:45',
                artist: 'Demo Artist',
                bpm: 128,
                difficulty: 'Easy'
            },
            {
                title: 'Jazz Fusion',
                duration: '3:20',
                artist: 'Demo Composer',
                bpm: 140,
                difficulty: 'Medium'
            },
            {
                title: 'Drum & Bass',
                duration: '4:15',
                artist: 'Demo Producer',
                bpm: 174,
                difficulty: 'Hard'
            }
        ];
    }
    
    // Utility methods
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Public API for external access
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    getGameEngine() {
        return this.gameEngine;
    }
    
    getMapEditor() {
        return this.mapEditor;
    }
}

// Export for use in other modules
window.UIController = UIController;