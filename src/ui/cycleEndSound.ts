import type { SoundEvent } from "../domain/cycleEnd";

// The sounds are made by code (Web Audio): no audio files, works offline.
let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

const audio = (): AudioContext => (context ??= new AudioContext());

/** 50 ms of white noise: filtered, it becomes the metallic tick. */
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise) return noise;
  noise = ac.createBuffer(1, Math.round(ac.sampleRate * 0.05), ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noise;
}

/** A short filtered-noise tick that fades out fast. */
function tick(ac: AudioContext, t: number, freq: number, gain: number, len: number, q: number) {
  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const amp = ac.createGain();
  source.buffer = noiseBuffer(ac);
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + len);
  source.connect(filter).connect(amp).connect(ac.destination);
  source.start(t);
  source.stop(t + len + 0.01);
}

/** A sine note that rises quickly and fades over `len` seconds. */
function note(ac: AudioContext, t: number, from: number, to: number, gain: number, len: number) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + len * 0.7);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + len);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + len + 0.02);
}

/** Plays the pieces of a sound (from the domain) at the given volume, from 0 to 1. */
export function playSound(events: readonly SoundEvent[], volume: number): void {
  if (events.length === 0 || volume <= 0 || typeof AudioContext === "undefined") return;
  const ac = audio();
  void ac.resume();
  const start = ac.currentTime + 0.03;
  for (const event of events) {
    const t = start + event.atMs / 1000;
    const gain = event.gain * volume;
    if (event.kind === "click") tick(ac, t, event.freq, gain, 0.025, 6);
    else if (event.kind === "clack") {
      tick(ac, t, 1400, gain, 0.06, 3);
      note(ac, t, 180, 70, gain * 0.66, 0.12); // a low thump makes the clack heavier
    } else note(ac, t, event.freq, event.freq, gain, event.lengthMs / 1000);
  }
}

/**
 * The webview only lets a page make sound after the user clicked or pressed a key in it.
 * This wakes the audio on the first click or key, so the end-of-cycle sound can play later.
 * Returns a function that stops listening.
 */
export function wakeAudioOnFirstInput(): () => void {
  if (typeof AudioContext === "undefined") return () => undefined;
  const wake = () => {
    void audio().resume();
    stop();
  };
  const stop = () => {
    window.removeEventListener("pointerdown", wake, true);
    window.removeEventListener("keydown", wake, true);
  };
  window.addEventListener("pointerdown", wake, true);
  window.addEventListener("keydown", wake, true);
  return stop;
}
