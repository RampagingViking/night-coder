// Generate DK Island Swing Metal as a WAV file - CORRECT MELODY
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 60;
const NUM_CHANNELS = 2;
const BYTES_PER_SAMPLE = 2;
const BLOCK_ALIGN = NUM_CHANNELS * BYTES_PER_SAMPLE;
const BYTE_RATE = SAMPLE_RATE * BLOCK_ALIGN;
const DATA_SIZE = SAMPLE_RATE * DURATION_SECONDS * BLOCK_ALIGN;

const buffer = Buffer.alloc(DATA_SIZE + 44);
let offset = 0;

// WAV Header
buffer.write('RIFF', offset); offset += 4;
buffer.writeUInt32LE(36 + DATA_SIZE, offset); offset += 4;
buffer.write('WAVE', offset); offset += 4;
buffer.write('fmt ', offset); offset += 4;
buffer.writeUInt32LE(16, offset); offset += 4;
buffer.writeUInt16LE(1, offset); offset += 2;
buffer.writeUInt16LE(NUM_CHANNELS, offset); offset += 2;
buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
buffer.writeUInt32LE(BYTE_RATE, offset); offset += 4;
buffer.writeUInt16LE(BLOCK_ALIGN, offset); offset += 2;
buffer.writeUInt16LE(16, offset); offset += 2;
buffer.write('data', offset); offset += 4;
buffer.writeUInt32LE(DATA_SIZE, offset); offset += 4;

function noteToFreq(note) {
    // Support sharp notation
    note = note.replace('#', 's');
    const notes = { 
        'C': 261.63, 'Cs': 277.18, 'D': 293.66, 'Ds': 311.13, 
        'E': 329.63, 'F': 349.23, 'Fs': 369.99, 'G': 392.00, 
        'Gs': 415.30, 'A': 440.00, 'As': 466.16, 'B': 493.88 
    };
    return notes[note.slice(0, -1)] * Math.pow(2, parseInt(note.slice(-1)) - 4);
}

function clamp(x) {
    return Math.max(-32768, Math.min(32767, Math.floor(x)));
}

let sampleIndex = 0;
const bpm = 160; // Original is around 160 BPM
const beatDur = 60 / bpm;
const sixteenthDur = beatDur / 4;

// The ACTUAL DK Island Swing melody (D minor)
// Main theme: D4, F4, G4, A4, G4, F4, E4, D4
const mainTheme = ['D4', 'F4', 'G4', 'A4', 'G4', 'F4', 'E4', 'D4'];
// Second phrase
const secondPhrase = ['A3', 'C4', 'D4', 'A3', 'G3', 'F3', 'E3', 'D3'];
// The iconic bouncy part
const bounce = ['D4', 'A4', 'D5', 'A4', 'D4', 'A4', 'D5', 'A4'];

function addDistortedGuitar(startSample, freq, durationSamples, distortion = 5, volume = 0.3) {
    for (let s = 0; s < durationSamples; s++) {
        const t = s / SAMPLE_RATE;
        const notePos = s / durationSamples;
        // Add some vibrato
        const vibrato = Math.sin(t * 10) * 0.02;
        let sample = Math.sin(2 * Math.PI * (freq * (1 + vibrato)) * t);
        
        // Aggressive envelope with pick attack
        let envelope = 1;
        if (notePos < 0.05) envelope = notePos / 0.05;
        else if (notePos > 0.8) envelope = (1 - notePos) / 0.2;
        
        // Distortion
        sample = Math.tanh(distortion * sample);
        
        const finalSample = sample * volume * envelope * 32767;
        
        if (sampleIndex + s * NUM_CHANNELS < DATA_SIZE) {
            for (let ch = 0; ch < NUM_CHANNELS; ch++) {
                buffer.writeInt16LE(clamp(finalSample), 44 + (sampleIndex + s * NUM_CHANNELS + ch) * BYTES_PER_SAMPLE);
            }
        }
    }
    sampleIndex += durationSamples;
}

function addBass(startSample, freq, durationSamples) {
    for (let s = 0; s < durationSamples; s++) {
        const t = s / SAMPLE_RATE;
        const notePos = s / durationSamples;
        let sample = Math.sin(2 * Math.PI * freq * t);
        // Add some grit
        sample = Math.sign(sample) * Math.abs(sample);
        
        let envelope = 1;
        if (notePos < 0.02) envelope = notePos / 0.02;
        else if (notePos > 0.85) envelope = (1 - notePos) / 0.15;
        
        sample = sample * 0.5 * envelope * 32767;
        
        if (sampleIndex + s * NUM_CHANNELS < DATA_SIZE) {
            for (let ch = 0; ch < NUM_CHANNELS; ch++) {
                buffer.writeInt16LE(clamp(sample), 44 + (sampleIndex + s * NUM_CHANNELS + ch) * BYTES_PER_SAMPLE);
            }
        }
    }
    sampleIndex += durationSamples;
}

function addDrums() {
    // Kick on beat 1 and 3
    for (let beat = 0; beat < 64; beat++) {
        if (beat % 4 === 0 || beat % 4 === 2) {
            const startSample = sampleIndex + beat * Math.floor(sixteenthDur * SAMPLE_RATE);
            for (let s = 0; s < SAMPLE_RATE * 0.15; s++) {
                const t = s / SAMPLE_RATE;
                const freq = 120 * Math.pow(40/120, t / 0.15);
                const envelope = 1 - (t / 0.15);
                let sample = Math.sin(2 * Math.PI * freq * t) * envelope * 32767 * 0.8;
                
                const idx = 44 + (startSample + s) * BYTES_PER_SAMPLE;
                if (idx < buffer.length) {
                    buffer.writeInt16LE(clamp(sample), idx);
                    buffer.writeInt16LE(clamp(sample), idx + BYTES_PER_SAMPLE);
                }
            }
        }
    }
}

console.log('Generating DK Island Swing METAL with CORRECT melody...');

// The structure: AABA (like the original)
// Section A - Main theme (4 times)
for (let repeat = 0; repeat < 4; repeat++) {
    const noteDur = Math.floor(sixteenthDur * 3 * SAMPLE_RATE);
    
    // Main theme - THE ACTUAL MELODY
    mainTheme.forEach(note => {
        addDistortedGuitar(sampleIndex, noteToFreq(note), noteDur, 8, 0.35);
    });
    
    // Second phrase
    secondPhrase.forEach(note => {
        addDistortedGuitar(sampleIndex, noteToFreq(note), noteDur, 8, 0.35);
    });
}

// Section B - The bounce (4 times)
for (let repeat = 0; repeat < 4; repeat++) {
    const noteDur = Math.floor(sixteenthDur * SAMPLE_RATE);
    bounce.forEach(note => {
        addDistortedGuitar(sampleIndex, noteToFreq(note), noteDur, 10, 0.4);
    });
}

// Add bass throughout
const bassNotes = ['D2', 'D2', 'A2', 'A2', 'D2', 'G2', 'A2', 'D2'];
for (let phrase = 0; phrase < 4; phrase++) {
    bassNotes.forEach(note => {
        addBass(sampleIndex, noteToFreq(note), Math.floor(sixteenthDur * 3 * SAMPLE_RATE));
    });
}

// Add drums
addDrums();

// A final section with more intensity
for (let repeat = 0; repeat < 2; repeat++) {
    const noteDur = Math.floor(sixteenthDur * 2 * SAMPLE_RATE);
    // Octave up for intensity
    const intenseTheme = mainTheme.map(n => n.slice(0, -1) + (parseInt(n.slice(-1)) + 1));
    intenseTheme.forEach(note => {
        addDistortedGuitar(sampleIndex, noteToFreq(note), noteDur, 12, 0.4);
    });
}

// Save WAV
const outputPath = path.join(__dirname, 'dk-island-swing-metal-v2.wav');
fs.writeFileSync(outputPath, buffer);

console.log('Done! Created:', outputPath);
console.log('Duration:', DURATION_SECONDS, 'seconds');
console.log('File size:', (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2), 'MB');
