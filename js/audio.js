// Audio management and beat detection system
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.source = null;
        this.analyser = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.7;
        this.onTimeUpdate = null;
        this.onEnded = null;
        
        // Beat detection
        this.beatThreshold = 1.3;
        this.lastBeatTime = 0;
        this.beatSensitivity = 100; // ms minimum between beats
        this.beats = [];
        
        // Frequency analysis
        this.frequencyData = null;
        this.bassSum = 0;
        this.lastBassSum = 0;
        
        this.initAudioContext();
    }
    
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Connect analyser to destination
            this.analyser.connect(this.audioContext.destination);
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    
    async loadAudio(file) {
        if (!this.audioContext) {
            await this.initAudioContext();
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            // Pre-analyze for beats
            this.analyzeBeats();
            
            return {
                success: true,
                duration: this.duration,
                name: file.name
            };
        } catch (error) {
            console.error('Failed to load audio:', error);
            return { success: false, error: error.message };
        }
    }
    
    analyzeBeats() {
        if (!this.audioBuffer) return;
        
        const sampleRate = this.audioBuffer.sampleRate;
        const channelData = this.audioBuffer.getChannelData(0);
        const bufferLength = channelData.length;
        
        // Beat detection using energy-based algorithm
        const windowSize = Math.floor(sampleRate * 0.1); // 100ms window
        const hopSize = Math.floor(windowSize / 4);
        
        this.beats = [];
        let localEnergies = [];
        
        // Calculate local energies
        for (let i = 0; i < bufferLength - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += channelData[i + j] * channelData[i + j];
            }
            localEnergies.push({
                time: i / sampleRate,
                energy: energy / windowSize
            });
        }
        
        // Find beats using local energy peaks
        const historySize = 43; // ~1 second of history
        for (let i = historySize; i < localEnergies.length; i++) {
            const current = localEnergies[i];
            
            // Calculate average energy in history window
            let avgEnergy = 0;
            for (let j = i - historySize; j < i; j++) {
                avgEnergy += localEnergies[j].energy;
            }
            avgEnergy /= historySize;
            
            // Beat detected if current energy > threshold * average
            if (current.energy > this.beatThreshold * avgEnergy) {
                // Avoid duplicate beats too close together
                if (this.beats.length === 0 || 
                    current.time - this.beats[this.beats.length - 1] > 0.1) {
                    this.beats.push(current.time);
                }
            }
        }
        
        console.log(`Detected ${this.beats.length} beats`);
    }
    
    play(startTime = 0) {
        if (!this.audioBuffer || this.isPlaying) return;
        
        this.stop(); // Stop any existing playback
        
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.volume;
        
        this.source.connect(gainNode);
        gainNode.connect(this.analyser);
        
        this.source.start(0, startTime);
        this.isPlaying = true;
        this.currentTime = startTime;
        
        // Update current time
        const startTimestamp = this.audioContext.currentTime;
        this.updateTime(startTimestamp, startTime);
        
        this.source.onended = () => {
            this.isPlaying = false;
            if (this.onEnded) this.onEnded();
        };
    }
    
    updateTime(startTimestamp, startTime) {
        if (!this.isPlaying) return;
        
        this.currentTime = startTime + (this.audioContext.currentTime - startTimestamp);
        
        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.currentTime);
        }
        
        if (this.currentTime < this.duration) {
            requestAnimationFrame(() => this.updateTime(startTimestamp, startTime));
        }
    }
    
    pause() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.isPlaying = false;
        }
    }
    
    stop() {
        if (this.source) {
            try {
                this.source.stop();
            } catch (e) {
                // Source might already be stopped
            }
            this.source = null;
        }
        this.isPlaying = false;
        this.currentTime = 0;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    seekTo(time) {
        const wasPlaying = this.isPlaying;
        this.stop();
        this.currentTime = Math.max(0, Math.min(this.duration, time));
        
        if (wasPlaying) {
            this.play(this.currentTime);
        }
    }
    
    // Get the closest beat to a given time
    getClosestBeat(time) {
        if (this.beats.length === 0) return null;
        
        let closest = this.beats[0];
        let minDiff = Math.abs(time - closest);
        
        for (const beat of this.beats) {
            const diff = Math.abs(time - beat);
            if (diff < minDiff) {
                minDiff = diff;
                closest = beat;
            }
        }
        
        return closest;
    }
    
    // Get all beats within a time range
    getBeatsInRange(startTime, endTime) {
        return this.beats.filter(beat => beat >= startTime && beat <= endTime);
    }
    
    // Check if current time is near a beat
    isNearBeat(tolerance = 0.1) {
        const closestBeat = this.getClosestBeat(this.currentTime);
        return closestBeat && Math.abs(this.currentTime - closestBeat) <= tolerance;
    }
    
    // Get frequency analysis data
    getFrequencyData() {
        if (this.analyser && this.isPlaying) {
            this.analyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
    }
    
    // Get bass level for visual effects
    getBassLevel() {
        const freqData = this.getFrequencyData();
        if (!freqData) return 0;
        
        // Calculate bass energy (low frequencies)
        let bassSum = 0;
        const bassRange = Math.floor(freqData.length * 0.1); // Lower 10% of frequencies
        
        for (let i = 0; i < bassRange; i++) {
            bassSum += freqData[i];
        }
        
        return bassSum / (bassRange * 255); // Normalize to 0-1
    }
    
    // Format time for display
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Create a simple metronome for testing
    createMetronome(bpm = 120) {
        const interval = 60 / bpm; // seconds per beat
        this.beats = [];
        
        // Generate beats for a 3-minute track
        for (let time = 0; time < 180; time += interval) {
            this.beats.push(time);
        }
        
        this.duration = 180;
        console.log(`Created metronome with ${this.beats.length} beats at ${bpm} BPM`);
    }
}

// Export for use in other modules
window.AudioManager = AudioManager;