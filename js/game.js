// Core game engine for Taimuragu
class Target {
    constructor(x, y, delay, type = 'circle', spawnTime = 0) {
        this.x = x;
        this.y = y;
        this.gridX = x;
        this.gridY = y;
        this.originalDelay = delay;
        this.delay = delay;
        this.type = type; // 'circle' or 'square'
        this.spawnTime = spawnTime;
        this.isActive = true;
        this.clickTime = null;
        this.result = null; // 'perfect', 'great', 'good', 'miss'
        
        // Visual properties
        this.size = 40;
        this.pulsePhase = 0;
        this.glowIntensity = 0;
        this.color = this.getColorFromDelay(delay);
        
        // Animation state
        this.scaleAnimation = 1;
        this.rotationAnimation = 0;
        this.disappearAnimation = 1;
        this.hitAnimation = null;
        this.hitAnimationTime = 0;
    }
    
    getColorFromDelay(delay) {
        // Color coding based on delay time
        if (delay <= 200) return '#ff6b6b'; // Red for short delays
        if (delay <= 500) return '#4ecdc4'; // Teal for medium delays
        if (delay <= 1000) return '#45b7d1'; // Blue for longer delays
        return '#96ceb4'; // Green for very long delays
    }
    
    update(currentTime, deltaTime) {
        if (!this.isActive) return;
        
        const timeAlive = currentTime - this.spawnTime;
        this.delay = Math.max(0, this.originalDelay - timeAlive * 1000);
        
        // Update visual effects
        this.pulsePhase += deltaTime * 3;
        this.rotationAnimation += deltaTime * 0.5;
        
        // Glow intensity based on how close to zero the delay is
        const delayRatio = this.delay / this.originalDelay;
        this.glowIntensity = Math.max(0, 1 - delayRatio);
        
        // Scale animation based on urgency
        if (this.delay <= 100) {
            this.scaleAnimation = 1 + Math.sin(this.pulsePhase * 8) * 0.1;
        } else if (this.delay <= 300) {
            this.scaleAnimation = 1 + Math.sin(this.pulsePhase * 4) * 0.05;
        } else {
            this.scaleAnimation = 1;
        }
        
        // Handle hit animation
        if (this.hitAnimation) {
            this.hitAnimationTime += deltaTime;
            if (this.hitAnimationTime >= 0.5) {
                this.isActive = false;
            } else {
                // Animate based on hit result
                const progress = this.hitAnimationTime / 0.5;
                switch (this.hitAnimation) {
                    case 'perfect':
                        this.scaleAnimation = 1 + Math.sin(progress * Math.PI) * 0.5;
                        this.disappearAnimation = 1 - progress * 0.5;
                        break;
                    case 'great':
                        this.scaleAnimation = 1 + Math.sin(progress * Math.PI) * 0.3;
                        this.disappearAnimation = 1 - progress * 0.3;
                        break;
                    case 'good':
                        this.scaleAnimation = 1 + Math.sin(progress * Math.PI) * 0.2;
                        this.disappearAnimation = 1 - progress * 0.2;
                        break;
                    case 'miss':
                        this.scaleAnimation = 1 - progress * 0.5;
                        this.rotationAnimation += deltaTime * 10;
                        this.disappearAnimation = 1 - progress;
                        break;
                }
            }
        }
        
        // Auto-miss if delay reaches 0 and not clicked
        if (this.delay <= 0 && !this.result) {
            this.result = 'miss';
            this.hitAnimation = 'miss';
            this.hitAnimationTime = 0;
        }
    }
    
    isReadyToClick() {
        return this.delay <= 50 && this.delay >= -50; // ±50ms window
    }
    
    getTimingAccuracy() {
        return Math.abs(this.delay);
    }
    
    hit(currentTime) {
        if (!this.isActive || this.result) return null;
        
        this.clickTime = currentTime;
        const accuracy = this.getTimingAccuracy();
        
        // Determine hit quality
        if (accuracy <= 25) {
            this.result = 'perfect';
        } else if (accuracy <= 50) {
            this.result = 'great';
        } else if (accuracy <= 100) {
            this.result = 'good';
        } else {
            this.result = 'miss';
        }
        
        this.hitAnimation = this.result;
        this.hitAnimationTime = 0;
        
        return this.result;
    }
}

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioManager = new AudioManager();
        
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.gameStartTime = 0;
        this.currentTime = 0;
        this.lastFrameTime = 0;
        
        // Grid system
        this.gridSize = 6;
        this.cellSize = 80;
        this.gridPadding = 20;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        
        // Game objects
        this.targets = [];
        this.beatMap = null;
        this.currentSong = null;
        
        // Scoring
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.missedHits = 0;
        this.totalHits = 0;
        
        // Visual effects
        this.particles = [];
        this.backgroundEffect = 0;
        this.beatPulse = 0;
        
        // Event callbacks
        this.onScoreUpdate = null;
        this.onGameEnd = null;
        
        this.setupCanvas();
        this.setupAudio();
        
        // Start render loop
        this.render();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        
        // Mouse event handling
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Touch event handling for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const clickEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            this.handleClick(clickEvent);
        });
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    setupAudio() {
        this.audioManager.onTimeUpdate = (time) => {
            this.currentTime = time;
            this.updateTargets();
        };
        
        this.audioManager.onEnded = () => {
            this.endGame();
        };
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Calculate canvas size to fit the game area
        const maxWidth = rect.width - 40;
        const maxHeight = rect.height - 200; // Leave room for UI
        
        const gridTotalSize = this.gridSize * this.cellSize + (this.gridSize - 1) * this.gridPadding;
        const canvasSize = Math.min(maxWidth, maxHeight, gridTotalSize + 100);
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        
        // Calculate grid positioning
        this.gridOffsetX = (canvasSize - gridTotalSize) / 2;
        this.gridOffsetY = (canvasSize - gridTotalSize) / 2;
        
        // Set canvas style
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
    }
    
    loadBeatMap(beatMap) {
        this.beatMap = beatMap;
        this.targets = [];
        
        // Pre-load targets from beat map
        if (beatMap && beatMap.targets) {
            beatMap.targets.forEach(targetData => {
                const target = new Target(
                    targetData.x,
                    targetData.y,
                    targetData.delay,
                    targetData.type || 'circle',
                    targetData.time
                );
                this.targets.push(target);
            });
        }
        
        console.log(`Loaded beat map with ${this.targets.length} targets`);
    }
    
    async loadSong(file) {
        const result = await this.audioManager.loadAudio(file);
        if (result.success) {
            this.currentSong = {
                name: result.name,
                duration: result.duration
            };
            
            // If no beat map is loaded, create a demo pattern
            if (!this.beatMap) {
                this.createDemoPattern();
            }
        }
        return result;
    }
    
    createDemoPattern() {
        // Create a demo pattern synchronized with detected beats
        const beats = this.audioManager.beats;
        const demoTargets = [];
        
        // Generate targets on every other beat with random delays
        for (let i = 0; i < beats.length; i += 2) {
            const beatTime = beats[i];
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            const delay = 200 + Math.random() * 800; // 200-1000ms delay
            const type = Math.random() > 0.5 ? 'circle' : 'square';
            
            demoTargets.push({
                time: beatTime,
                x: x,
                y: y,
                delay: delay,
                type: type
            });
        }
        
        this.beatMap = {
            name: 'Auto-generated',
            targets: demoTargets
        };
        
        this.loadBeatMap(this.beatMap);
    }
    
    startGame() {
        if (!this.currentSong) {
            console.error('No song loaded');
            return;
        }
        
        this.resetGameState();
        this.isPlaying = true;
        this.isPaused = false;
        this.gameStartTime = performance.now();
        
        this.audioManager.play();
        console.log('Game started');
    }
    
    pauseGame() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.audioManager.pause();
        } else {
            this.audioManager.play(this.currentTime);
        }
    }
    
    stopGame() {
        this.isPlaying = false;
        this.isPaused = false;
        this.audioManager.stop();
        this.resetGameState();
    }
    
    endGame() {
        this.isPlaying = false;
        this.isPaused = false;
        
        // Calculate final stats
        const accuracy = this.totalHits > 0 ? 
            ((this.perfectHits + this.greatHits + this.goodHits) / this.totalHits) * 100 : 100;
        
        const finalStats = {
            score: this.score,
            maxCombo: this.maxCombo,
            accuracy: Math.round(accuracy),
            perfectHits: this.perfectHits,
            greatHits: this.greatHits,
            goodHits: this.goodHits,
            missedHits: this.missedHits,
            totalHits: this.totalHits
        };
        
        if (this.onGameEnd) {
            this.onGameEnd(finalStats);
        }
        
        console.log('Game ended', finalStats);
    }
    
    resetGameState() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.missedHits = 0;
        this.totalHits = 0;
        this.currentTime = 0;
        this.particles = [];
        
        // Reset all targets
        if (this.beatMap) {
            this.loadBeatMap(this.beatMap);
        }
        
        if (this.onScoreUpdate) {
            this.onScoreUpdate({
                score: this.score,
                combo: this.combo,
                accuracy: 100
            });
        }
    }
    
    updateTargets() {
        if (!this.isPlaying || this.isPaused) return;
        
        const currentTime = this.currentTime;
        const deltaTime = (performance.now() - this.lastFrameTime) / 1000;
        this.lastFrameTime = performance.now();
        
        // Spawn new targets
        this.targets.forEach(target => {
            if (!target.isActive && currentTime >= target.spawnTime) {
                target.isActive = true;
                target.spawnTime = currentTime;
            }
        });
        
        // Update active targets
        this.targets.forEach(target => {
            if (target.isActive) {
                target.update(currentTime, deltaTime);
                
                // Check for auto-miss
                if (target.result === 'miss' && target.hitAnimation) {
                    this.handleTargetResult('miss');
                }
            }
        });
        
        // Remove inactive targets
        this.targets = this.targets.filter(target => 
            target.isActive || target.spawnTime > currentTime
        );
        
        // Update beat pulse effect
        if (this.audioManager.isNearBeat(0.1)) {
            this.beatPulse = 1;
        } else {
            this.beatPulse *= 0.95;
        }
        
        // Update background effect with bass
        const bassLevel = this.audioManager.getBassLevel();
        this.backgroundEffect = bassLevel * 0.3;
    }
    
    handleClick(event) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const gridPos = this.screenToGrid(x, y);
        if (!gridPos) return;
        
        // Find target at this grid position
        const target = this.findTargetAt(gridPos.x, gridPos.y);
        if (!target || !target.isActive || target.result) return;
        
        const result = target.hit(this.currentTime);
        if (result) {
            this.handleTargetResult(result);
            this.createHitEffect(x, y, result);
        }
    }
    
    handleMouseMove(event) {
        // Visual feedback for hovering over targets
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const gridPos = this.screenToGrid(x, y);
        if (gridPos) {
            this.canvas.style.cursor = this.findTargetAt(gridPos.x, gridPos.y) ? 'pointer' : 'default';
        } else {
            this.canvas.style.cursor = 'default';
        }
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
    
    findTargetAt(gridX, gridY) {
        return this.targets.find(target => 
            target.isActive && 
            target.gridX === gridX && 
            target.gridY === gridY &&
            !target.result
        );
    }
    
    handleTargetResult(result) {
        this.totalHits++;
        
        switch (result) {
            case 'perfect':
                this.score += 100;
                this.combo++;
                this.perfectHits++;
                break;
            case 'great':
                this.score += 75;
                this.combo++;
                this.greatHits++;
                break;
            case 'good':
                this.score += 50;
                this.combo++;
                this.goodHits++;
                break;
            case 'miss':
                this.score = Math.max(0, this.score - 10);
                this.combo = 0;
                this.missedHits++;
                break;
        }
        
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        if (this.onScoreUpdate) {
            const accuracy = this.totalHits > 0 ? 
                ((this.perfectHits + this.greatHits + this.goodHits) / this.totalHits) * 100 : 100;
            
            this.onScoreUpdate({
                score: this.score,
                combo: this.combo,
                accuracy: Math.round(accuracy)
            });
        }
    }
    
    createHitEffect(x, y, result) {
        // Create particle effect for hits
        const particleCount = result === 'perfect' ? 12 : result === 'great' ? 8 : 6;
        const colors = {
            perfect: ['#4ecdc4', '#45b7d1', '#96ceb4'],
            great: ['#45b7d1', '#667eea'],
            good: ['#96ceb4', '#4ecdc4'],
            miss: ['#ff6b6b', '#ee5a52']
        };
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const life = 0.5 + Math.random() * 0.5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life,
                maxLife: life,
                color: colors[result][Math.floor(Math.random() * colors[result].length)],
                size: 3 + Math.random() * 3
            });
        }
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas with background effect
        ctx.fillStyle = `rgba(10, 10, 15, ${0.9 + this.backgroundEffect})`;
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(ctx);
        
        // Draw targets
        this.drawTargets(ctx);
        
        // Draw particles
        this.updateAndDrawParticles(ctx);
        
        // Draw beat pulse effect
        if (this.beatPulse > 0.1) {
            ctx.save();
            ctx.globalAlpha = this.beatPulse * 0.3;
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, width, height);
            ctx.restore();
        }
        
        requestAnimationFrame(() => this.render());
    }
    
    drawGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
    
    drawTargets(ctx) {
        this.targets.forEach(target => {
            if (!target.isActive) return;
            
            const screenPos = this.gridToScreen(target.gridX, target.gridY);
            this.drawTarget(ctx, target, screenPos.x, screenPos.y);
        });
    }
    
    drawTarget(ctx, target, x, y) {
        ctx.save();
        
        // Apply transformations
        ctx.translate(x, y);
        ctx.scale(target.scaleAnimation * target.disappearAnimation, target.scaleAnimation * target.disappearAnimation);
        ctx.rotate(target.rotationAnimation);
        
        // Draw glow effect
        if (target.glowIntensity > 0) {
            const glowSize = target.size * (1 + target.glowIntensity);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            gradient.addColorStop(0, target.color + '40');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
        }
        
        // Draw target shape
        ctx.fillStyle = target.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        if (target.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, target.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            const size = target.size;
            ctx.fillRect(-size / 2, -size / 2, size, size);
            ctx.strokeRect(-size / 2, -size / 2, size, size);
        }
        
        // Draw delay text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const delayText = Math.ceil(target.delay).toString();
        ctx.fillText(delayText, 0, 0);
        
        // Draw countdown ring
        if (target.delay > 0) {
            const progress = 1 - (target.delay / target.originalDelay);
            ctx.strokeStyle = target.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, target.size / 2 + 10, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    updateAndDrawParticles(ctx) {
        const deltaTime = 1/60; // Approximate frame time
        
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 200 * deltaTime; // Gravity
            
            if (particle.life > 0) {
                ctx.save();
                ctx.globalAlpha = particle.life / particle.maxLife;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            }
            return false;
        });
    }
    
    // Utility methods for external access
    getCurrentTime() {
        return this.currentTime;
    }
    
    getDuration() {
        return this.currentSong ? this.currentSong.duration : 0;
    }
    
    getActiveTargetCount() {
        return this.targets.filter(target => target.isActive && !target.result).length;
    }
    
    getUpcomingTargets(lookAhead = 5) {
        const currentTime = this.currentTime;
        return this.targets.filter(target => 
            target.spawnTime > currentTime && 
            target.spawnTime <= currentTime + lookAhead
        ).length;
    }
}

// Export for use in other modules
window.GameEngine = GameEngine;
window.Target = Target;