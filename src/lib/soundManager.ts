class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playStart() {
    this.playTone(660, 'sine', 0.1, 0.05);
  }

  playMove() {
    this.playTone(440, 'sine', 0.05, 0.02);
  }

  playComplete() {
    this.playTone(523.25, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.05), 50);
    setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.05), 100);
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.2, 0.05);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 'triangle', 0.4, 0.05), i * 100);
    });
  }
}

export const soundManager = new SoundManager();
