import { useCallback, useRef, useEffect } from 'react';

// Sound generator using Web Audio API
class SoundEffect {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;

    constructor() {
        // Initialize on user interaction to comply with browser autoplay policies
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    private createOscillator(frequency: number, duration: number, type: OscillatorType = 'sine') {
        if (!this.audioContext || !this.enabled) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Success sound - gentle upward chime
    success() {
        if (!this.audioContext || !this.enabled) return;
        
        const now = this.audioContext.currentTime;
        
        // Two-tone ascending chime
        setTimeout(() => this.createOscillator(523.25, 0.1, 'sine'), 0);    // C5
        setTimeout(() => this.createOscillator(659.25, 0.15, 'sine'), 60);  // E5
    }

    // Error sound - gentle downward tone
    error() {
        if (!this.audioContext || !this.enabled) return;
        
        // Single descending tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    // Click sound - soft tap
    click() {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 800;

        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    // Notification sound - gentle ding
    notification() {
        if (!this.audioContext || !this.enabled) return;
        
        this.createOscillator(800, 0.15, 'sine');
    }

    // Call patient - more prominent success sound
    callPatient() {
        if (!this.audioContext || !this.enabled) return;
        
        // Three-tone ascending
        setTimeout(() => this.createOscillator(523.25, 0.12, 'sine'), 0);    // C5
        setTimeout(() => this.createOscillator(659.25, 0.12, 'sine'), 80);   // E5
        setTimeout(() => this.createOscillator(783.99, 0.18, 'sine'), 160);  // G5
    }
}

// Singleton instance
let soundEffectInstance: SoundEffect | null = null;

const getSoundInstance = () => {
    if (!soundEffectInstance) {
        soundEffectInstance = new SoundEffect();
    }
    return soundEffectInstance;
};

// React hook for using sound effects
export const useSound = () => {
    const soundRef = useRef<SoundEffect | null>(null);

    useEffect(() => {
        soundRef.current = getSoundInstance();
    }, []);

    const playSound = useCallback((soundName: 'success' | 'error' | 'click' | 'notification' | 'callPatient') => {
        if (soundRef.current) {
            soundRef.current[soundName]();
        }
    }, []);

    const toggleSound = useCallback((enabled: boolean) => {
        if (soundRef.current) {
            soundRef.current.setEnabled(enabled);
        }
    }, []);

    return { playSound, toggleSound };
};
