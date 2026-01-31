// Generate DK Island Swing Metal as a WAV file
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 45; // How long the song is
const NUM_CHANNELS = 2;
const BYTES_PER_SAMPLE = 2;
const BLOCK_ALIGN = NUM_CHANNELS * BYTES_PER_SAMPLE;
const BYTE_RATE = SAMPLE_RATE * BLOCK_ALIGN;
const DATA_SIZE = SAMPLE_RATE * DURATION_SECONDS * BLOCK_ALIGN;

// Create buffer for audio data
const buffer = Buffer.alloc(DATA_SIZE + 44); // WAV header + data
let offset = 0;

// WAV Header
buffer.write('RIFF', offset); offset += 4;
buffer.writeUInt32LE(36 + DATA_SIZE, offset); offset += 4;
buffer.write('WAVE', offset); offset += 4;
buffer.write('fmt ', offset); offset += 4;
buffer.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size
buffer.writeUInt16LE(1, offset); offset += 2; // AudioFormat (PCM)
buffer.writeUInt16LE(NUM_CHANNELS, offset); offset += 2;
buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
buffer.writeUInt32LE(BYTE_RATE, offset); offset += 4;
buffer.writeUInt16LE(BLOCK_ALIGN, offset); offset += 2;
buffer.writeUInt16LE(16, offset); offset += 2; // BitsPerSample
buffer.write('data', offset); offset += 4;
buffer.writeUInt32LE(DATA_SIZE, offset); offset += 4;

// Helper functions
function noteToFreq(note) {
    const notes = { 'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23, 'G': 392.00, 'A': 440.00, 'B': 493.88 };
    return notes[note.slice(0, -1)] * Math.pow(2, parseInt(note.slice(-1)) - 4);
}

function clamp(x) {
    return Math.max(-32768, Math.min(32767, Math.floor(x)));
}

// Generate audio samples
let sampleIndex = 0;
const bpm = 180;
const beatDur = 60 / bpm;

// Melody for one pass
const melody = [
    { note: 'A3', dur: beatDur * 0.5 }, { note: 'E4', dur: beatDur * 0.5 },
    { note: 'C4', dur: beatDur * 0.5 }, { note: 'E4', dur: beatDur * 0.5 },
    { note: 'A4', dur: beatDur * 0.5 }, { note: 'G4', dur: beatDur * 0.5 },
    { note: 'E4', dur: beatDur * 0.5 }, { note: 'C4', dur: beatDur * 0.5 },
];
const bassLine = ['A2', 'A2', 'E2', 'E2', 'A2', 'G2', 'E2', 'E2'];
const soloNotes = ['A5', 'E5', 'A5', 'E5', 'A5', 'G5', 'E5', 'G5', 'A5', 'E5', 'A5', 'E5', 'A5', 'G5', 'E5', 'C5'];

function addDistortedGuitar(startSample, freq, durationSamples, distortion = 5) {
    for (let s = 0; s < durationSamples; s++) {
        const t = s / SAMPLE_RATE;
        const envelope = Math.max(0, 1 - (s / durationSamples));
        let sample = Math.sin(2 * Math.PI * freq * t);
        
        // Distortion
        sample = Math.tanh(distortion * sample);
        
        const finalSample = sample * 0.3 * envelope * 32767;
        
        if (sampleIndex + s * NUM_CHANNELS < DATA_SIZE) {
            buffer.writeInt16LE(clamp(finalSample), 44 + (sampleIndex + s * NUM_CHANNELS) * BYTES_PER_SAMPLE);
            buffer.writeInt16LE(clamp(finalSample), 44 + (sampleIndex + s * NUM_CHANNELS + 1) * BYTES_PER_SAMPLE);
        }
    }
    sampleIndex += durationSamples;
}

function addBass(startSample, freq, durationSamples) {
    for (let s = 0; s < durationSamples; s++) {
        const t = s / SAMPLE_RATE;
        const envelope = Math.max(0, 1 - (s / durationSamples));
        let sample = Math.sin(2 * Math.PI * freq * t);
        sample = sample * 0.4 * envelope * 32767;
        
        if (sampleIndex + s * NUM_CHANNELS < DATA_SIZE) {
            buffer.writeInt16LE(clamp(sample), 44 + (sampleIndex + s * NUM_CHANNELS) * BYTES_PER_SAMPLE);
            buffer.writeInt16LE(clamp(sample), 44 + (sampleIndex + s * NUM_CHANNELS + 1) * BYTES_PER_SAMPLE);
        }
    }
    sampleIndex += durationSamples;
}

function addKick(startSample) {
    for (let s = 0; s < SAMPLE_RATE * 0.2; s++) {
        const t = s / SAMPLE_RATE;
        const freq = 150 * Math.pow(30/150, t / 0.2);
        const envelope = 1 - (t / 0.2);
        let sample = Math.sin(2 * Math.PI * freq * t);
        sample = sample * envelope * 32767;
        
        if (sampleIndex + s * NUM_CHANNELS < DATA_SIZE) {
            buffer.writeInt16LE(clamp(sample), 44 + (sampleIndex + s * NUM_CHANNELS) * BYTES_PER_SAMPLE);
            buffer.writeInt16LE(clamp(sample), 44 + (sampleIndex + s * NUM_CHANNELS + 1) * BYTES_PER_SAMPLE);
        }
    }
    sampleIndex += SAMPLE_RATE * 0.2;
}

function addSnare(startSample) {
    for (let s = 0; s < SAMPLE_RATE * 0.1; s++) {
        const t = s / SAMPLE_RATE;
        const envelope = 1 - (t / 0.1);
        let sample = Math.sin(2 * Math.PI * 200 * t) + (Math.random() * 2 - 1);
        sample = sample * 0.5 * envelope * 32767;
        
        if (sampleIndex + s * NUM_CHANNELS < DATA_SIZE) {
            buffer.writeInt16LE(clamp(sample), 44 + (sampleIndex + s * NUM_CHANNELS) * BYTES_PER_SAMPLE);
            buffer.writeInt16LE(clamp(sample), 44 + (sampleIndex + s * NUM_CHANNELS + 1) * BYTES_PER_SAMPLE);
        }
    }
    sampleIndex += SAMPLE_RATE * 0.1;
}

console.log('Generating DK Island Swing METAL...');

// Main riff - 4 passes
for (let repeat = 0; repeat < 4; repeat++) {
    const startSample = sampleIndex;
    const noteDurationSamples = Math.floor(beatDur * 0.5 * SAMPLE_RATE);
    
    // Guitar
    for (let i = 0; i < melody.length; i++) {
        const freq = noteToFreq(melody[i].note);
        addDistortedGuitar(sampleIndex, freq, Math.floor(noteDurationSamples * 0.8), 8);
    }
    
    // Bass
    for (let i = 0; i < bassLine.length; i++) {
        const freq = noteToFreq(bassLine[i]);
        addBass(sampleIndex, freq, noteDurationSamples);
    }
    
    // Drums - 16th notes
    for (let i = 0; i < 16; i++) {
        const drumTime = startSample + i * Math.floor(beatDur * 0.25 * SAMPLE_RATE);
        if (i % 4 === 0) addKick(drumTime);
        if (i % 4 === 2) addSnare(drumTime);
    }
}

// Guitar solo
const soloStart = sampleIndex;
for (let i = 0; i < soloNotes.length; i++) {
    const soloTime = soloStart + i * Math.floor(beatDur * 0.25 * SAMPLE_RATE);
    addDistortedGuitar(soloTime, noteToFreq(soloNotes[i]), Math.floor(beatDur * 0.2 * SAMPLE_RATE), 15);
}

// Final riff - MAXIMUM OVERDRIVE
const finalStart = sampleIndex;
for (let i = 0; i < 16; i++) {
    const time = finalStart + i * Math.floor(beatDur * 0.25 * SAMPLE_RATE);
    const freqs = [noteToFreq('A3'), noteToFreq('A4'), noteToFreq('E4'), noteToFreq('C4')];
    freqs.forEach((f, j) => {
        addDistortedGuitar(time + j * Math.floor(beatDur * 0.0625 * SAMPLE_RATE), f, Math.floor(beatDur * 0.2 * SAMPLE_RATE), 20);
    });
}

// Save WAV file
const outputPath = path.join(__dirname, 'dk-island-swing-metal.wav');
fs.writeFileSync(outputPath, buffer);

console.log('Done! Created:', outputPath);
console.log('File size:', (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2), 'MB');
