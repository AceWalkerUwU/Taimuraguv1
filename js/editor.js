// Map Editor for creating custom Taimuragu levels
class MapEditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioManager = new AudioManager();
        
        // Editor state
        this.isActive = false;
        this.currentSong = null;
        this.beatMap = {
            name: 'Untitled Map',
            targets: []
        };
        
        // Grid system
        this.gridSize = 6;
        this.cellSize = 60;
        this.gridPadding = 15;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        
        // Editor settings
        this.selectedTargetType = 'circle';
        this.selectedDelay = 300;
        this.snapToBeat = true;
        this.beatTolerance = 0.1; // seconds
        
        // Playback state
        this.isPlaying = false;
        this.currentTime = 0;
        
        // Selection and editing
        this.selectedTargets = [];
        this.hoveredCell = null;
        this.dragState = null;
        
        // Visual aids
        this.showBeats = true;
        this.showGrid = true;
        this.playbackLine = 0;
        
        this.setupCanvas();
        this.setupAudio();
        this.render();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        
        // Mouse event handling
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0
            });
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp({ button: 0 });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    setupAudio() {
        this.audioManager.onTimeUpdate = (time) => {
            this.currentTime = time;
            this.updatePlaybackLine();
        };
        
        this.audioManager.onEnded = () => {
            this.isPlaying = false;
        };
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Calculate canvas size
        const maxWidth = rect.width - 40;
        const maxHeight = 500; // Fixed height for editor
        
        const gridTotalSize = this.gridSize * this.cellSize + (this.gridSize - 1) * this.gridPadding;
        const canvasSize = Math.min(maxWidth, maxHeight, gridTotalSize + 100);
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        
        // Calculate grid positioning
        this.gridOffsetX = (canvasSize - gridTotalSize) / 2;
        this.gridOffsetY = (canvasSize - gridTotalSize) / 2;
        
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
    }
    
    async loadSong(file) {
        const result = await this.audioManager.loadAudio(file);
        if (result.success) {
            this.currentSong = {
                name: result.name,
                duration: result.duration
            };
            
            // Reset beat map
            this.beatMap = {
                name: `${result.name} - Map`,
                targets: []
            };
            
            console.log('Song loaded in editor:', this.currentSong);
        }
        return result;
    }
    
    updateSettings(settings) {
        if (settings.targetType !== undefined) {
            this.selectedTargetType = settings.targetType;
        }
        if (settings.delay !== undefined) {
            this.selectedDelay = parseInt(settings.delay);
        }
        if (settings.gridSize !== undefined) {
            this.gridSize = parseInt(settings.gridSize);
            this.resizeCanvas();
        }
    }
    
    play() {
        if (!this.currentSong) return;
        
        if (this.isPlaying) {
            this.audioManager.pause();
            this.isPlaying = false;
        } else {
            this.audioManager.play(this.currentTime);
            this.isPlaying = true;
        }
    }
    
    seekTo(time) {
        this.currentTime = Math.max(0, Math.min(this.currentSong.duration, time));
        this.audioManager.seekTo(this.currentTime);
        this.updatePlaybackLine();
    }
    
    handleClick(event) {
        if (!this.isActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const gridPos = this.screenToGrid(x, y);
        if (!gridPos) return;
        
        // Check if there's already a target here
        const existingTarget = this.findTargetAt(gridPos.x, gridPos.y, this.currentTime);
        
        if (existingTarget) {
            // Select or deselect target
            const index = this.selectedTargets.indexOf(existingTarget);
            if (index >= 0) {
                this.selectedTargets.splice(index, 1);
            } else {
                this.selectedTargets = [existingTarget];
            }
        } else {
            // Create new target
            this.createTarget(gridPos.x, gridPos.y, this.currentTime);
        }
    }
    
    handleRightClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const gridPos = this.screenToGrid(x, y);
        if (!gridPos) return;
        
        // Delete target at this position
        const target = this.findTargetAt(gridPos.x, gridPos.y, this.currentTime);
        if (target) {
            this.deleteTarget(target);
        }
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const gridPos = this.screenToGrid(x, y);
        this.hoveredCell = gridPos;
        
        // Update cursor
        if (gridPos) {
            const target = this.findTargetAt(gridPos.x, gridPos.y, this.currentTime);
            this.canvas.style.cursor = target ? 'pointer' : 'crosshair';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleMouseDown(event) {
        // Start drag operation for multi-select or moving
        this.dragState = {
            startX: event.clientX,
            startY: event.clientY,
            button: event.button
        };
    }
    
    handleMouseUp(event) {
        this.dragState = null;
    }
    
    handleKeyDown(event) {
        if (!this.isActive) return;
        
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelectedTargets();
                break;
            case 'Escape':
                this.selectedTargets = [];
                break;
            case ' ': // Spacebar
                event.preventDefault();
                this.play();
                break;
            case 'c':
                if (event.ctrlKey) {
                    this.copySelectedTargets();
                }
                break;
            case 'v':
                if (event.ctrlKey) {
                    this.pasteTargets();
                }
                break;
            case 'a':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.selectAllTargets();
                }
                break;
        }
    }
    
    createTarget(gridX, gridY, time) {
        // Snap to beat if enabled
        let targetTime = time;
        if (this.snapToBeat && this.currentSong) {
            const closestBeat = this.audioManager.getClosestBeat(time);
            if (closestBeat && Math.abs(closestBeat - time) <= this.beatTolerance) {
                targetTime = closestBeat;
            }
        }
        
        const target = {
            x: gridX,
            y: gridY,
            time: targetTime,
            delay: this.selectedDelay,
            type: this.selectedTargetType,
            id: this.generateTargetId()
        };
        
        this.beatMap.targets.push(target);
        this.selectedTargets = [target];
        
        console.log('Created target:', target);
    }
    
    deleteTarget(target) {
        const index = this.beatMap.targets.indexOf(target);
        if (index >= 0) {
            this.beatMap.targets.splice(index, 1);
        }
        
        const selectedIndex = this.selectedTargets.indexOf(target);
        if (selectedIndex >= 0) {
            this.selectedTargets.splice(selectedIndex, 1);
        }
    }
    
    deleteSelectedTargets() {
        this.selectedTargets.forEach(target => this.deleteTarget(target));
        this.selectedTargets = [];
    }
    
    selectAllTargets() {
        this.selectedTargets = [...this.beatMap.targets];
    }
    
    copySelectedTargets() {
        if (this.selectedTargets.length > 0) {
            this.clipboard = this.selectedTargets.map(target => ({...target}));
        }
    }
    
    pasteTargets() {
        if (!this.clipboard || this.clipboard.length === 0) return;
        
        const timeOffset = this.currentTime - this.clipboard[0].time;
        this.selectedTargets = [];
        
        this.clipboard.forEach(clipTarget => {
            const target = {
                ...clipTarget,
                time: clipTarget.time + timeOffset,
                id: this.generateTargetId()
            };
            this.beatMap.targets.push(target);
            this.selectedTargets.push(target);
        });
    }
    
    findTargetAt(gridX, gridY, time, tolerance = 0.5) {
        return this.beatMap.targets.find(target => 
            target.x === gridX && 
            target.y === gridY && 
            Math.abs(target.time - time) <= tolerance
        );
    }
    
    screenToGrid(screenX, screenY) {
        const x = Math.floor((screenX - this.gridOffsetX) / (this.cellSize + this.gridPadding));
        const y = Math.floor((screenY - this.gridOffsetY) / (this.cellSize + this.gridPadding));
        
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            return { x, y };
        }
        return null;
    }
    
    gridToScreen(gridX, gridY) {
        const x = this.gridOffsetX + gridX * (this.cellSize + this.gridPadding) + this.cellSize / 2;
        const y = this.gridOffsetY + gridY * (this.cellSize + this.gridPadding) + this.cellSize / 2;
        return { x, y };
    }
    
    generateTargetId() {
        return 'target_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    updatePlaybackLine() {
        // Update any UI elements that depend on playback position
        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.currentTime);
        }
    }
    
    clearMap() {
        this.beatMap.targets = [];
        this.selectedTargets = [];
    }
    
    saveMap() {
        const mapData = {
            ...this.beatMap,
            songName: this.currentSong ? this.currentSong.name : 'Unknown',
            songDuration: this.currentSong ? this.currentSong.duration : 0,
            createdAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(mapData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.beatMap.name}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('Map saved:', mapData);
    }
    
    async loadMap(file) {
        try {
            const text = await file.text();
            const mapData = JSON.parse(text);
            
            // Validate map data
            if (!mapData.targets || !Array.isArray(mapData.targets)) {
                throw new Error('Invalid map format');
            }
            
            this.beatMap = {
                name: mapData.name || 'Loaded Map',
                targets: mapData.targets
            };
            
            this.selectedTargets = [];
            console.log('Map loaded:', this.beatMap);
            
            return { success: true, map: this.beatMap };
        } catch (error) {
            console.error('Failed to load map:', error);
            return { success: false, error: error.message };
        }
    }
    
    getMapData() {
        return {
            ...this.beatMap,
            songName: this.currentSong ? this.currentSong.name : 'Unknown',
            songDuration: this.currentSong ? this.currentSong.duration : 0
        };
    }
    
    getVisibleTargets() {
        const lookAhead = 2; // seconds
        const lookBehind = 1; // seconds
        
        return this.beatMap.targets.filter(target => 
            target.time >= this.currentTime - lookBehind &&
            target.time <= this.currentTime + lookAhead
        );
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
        ctx.fillRect(0, 0, width, height);
        
        if (this.showGrid) {
            this.drawGrid(ctx);
        }
        
        if (this.showBeats && this.currentSong) {
            this.drawBeats(ctx);
        }
        
        this.drawTargets(ctx);
        this.drawHoveredCell(ctx);
        this.drawSelection(ctx);
        
        requestAnimationFrame(() => this.render());
    }
    
    drawGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const screenPos = this.gridToScreen(x, y);
                const cellX = screenPos.x - this.cellSize / 2;
                const cellY = screenPos.y - this.cellSize / 2;
                
                ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
            }
        }
        
        ctx.restore();
    }
    
    drawBeats(ctx) {
        const beats = this.audioManager.getBeatsInRange(
            this.currentTime - 1, 
            this.currentTime + 2
        );
        
        ctx.save();
        beats.forEach(beatTime => {
            const timeDiff = beatTime - this.currentTime;
            const alpha = Math.max(0, 1 - Math.abs(timeDiff) / 2);
            
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 2;
            
            // Draw beat indicators around the grid
            const margin = 10;
            ctx.strokeRect(
                this.gridOffsetX - margin,
                this.gridOffsetY - margin,
                this.gridSize * (this.cellSize + this.gridPadding) - this.gridPadding + margin * 2,
                this.gridSize * (this.cellSize + this.gridPadding) - this.gridPadding + margin * 2
            );
        });
        ctx.restore();
    }
    
    drawTargets(ctx) {
        const visibleTargets = this.getVisibleTargets();
        
        visibleTargets.forEach(target => {
            const screenPos = this.gridToScreen(target.x, target.y);
            this.drawTarget(ctx, target, screenPos.x, screenPos.y);
        });
    }
    
    drawTarget(ctx, target, x, y) {
        ctx.save();
        ctx.translate(x, y);
        
        // Calculate alpha based on time distance
        const timeDiff = Math.abs(target.time - this.currentTime);
        const alpha = Math.max(0.3, 1 - timeDiff / 2);
        ctx.globalAlpha = alpha;
        
        // Determine color
        const isSelected = this.selectedTargets.includes(target);
        const color = isSelected ? '#ff6b6b' : this.getTargetColor(target.delay);
        
        // Draw target
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSelected ? 3 : 2;
        
        const size = this.cellSize * 0.6;
        
        if (target.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(-size / 2, -size / 2, size, size);
            ctx.strokeRect(-size / 2, -size / 2, size, size);
        }
        
        // Draw delay text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(size * 0.25)}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(target.delay.toString(), 0, 0);
        
        // Draw time indicator for current target
        if (Math.abs(target.time - this.currentTime) < 0.1) {
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, size / 2 + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawHoveredCell(ctx) {
        if (!this.hoveredCell) return;
        
        ctx.save();
        const screenPos = this.gridToScreen(this.hoveredCell.x, this.hoveredCell.y);
        const cellX = screenPos.x - this.cellSize / 2;
        const cellY = screenPos.y - this.cellSize / 2;
        
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
        
        // Show preview of target to be placed
        if (!this.findTargetAt(this.hoveredCell.x, this.hoveredCell.y, this.currentTime)) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = this.getTargetColor(this.selectedDelay);
            
            const size = this.cellSize * 0.6;
            ctx.translate(screenPos.x, screenPos.y);
            
            if (this.selectedTargetType === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-size / 2, -size / 2, size, size);
            }
        }
        
        ctx.restore();
    }
    
    drawSelection(ctx) {
        if (this.selectedTargets.length === 0) return;
        
        // Draw selection outline around selected targets
        ctx.save();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        this.selectedTargets.forEach(target => {
            const screenPos = this.gridToScreen(target.x, target.y);
            const size = this.cellSize * 0.8;
            ctx.strokeRect(
                screenPos.x - size / 2,
                screenPos.y - size / 2,
                size,
                size
            );
        });
        
        ctx.restore();
    }
    
    getTargetColor(delay) {
        if (delay <= 200) return '#ff6b6b';
        if (delay <= 500) return '#4ecdc4';
        if (delay <= 1000) return '#45b7d1';
        return '#96ceb4';
    }
    
    activate() {
        this.isActive = true;
    }
    
    deactivate() {
        this.isActive = false;
        this.isPlaying = false;
        this.audioManager.stop();
    }
}

// Export for use in other modules
window.MapEditor = MapEditor;