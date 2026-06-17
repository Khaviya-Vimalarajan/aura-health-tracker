import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Download, Sparkles, Wind, Music, Check, Info 
} from 'lucide-react';

export default function AuraStudio({ todayLog, user, onQuestComplete }) {
  const canvasRef = useRef(null);
  
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [soundPreset, setSoundPreset] = useState('alpha'); // 'theta' | 'alpha' | 'ocean'
  const [volume, setVolume] = useState(0.5);
  
  // Visual state
  const [visualMode, setVisualMode] = useState('nebula'); // 'nebula' | 'sparkles' | 'quantum'
  const [customMood, setCustomMood] = useState(null); // Local override if guest or no log
  
  // Breathing state
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Inhale'); // 'Inhale' | 'Hold' | 'Exhale'
  const [breathScale, setBreathScale] = useState(0.6); // For visual scale
  const [breathingElapsed, setBreathingElapsed] = useState(0); // in seconds
  const [breathingGoalMet, setBreathingGoalMet] = useState(false);
  
  // Audio refs for Web Audio API
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const droneOscRef = useRef(null);
  const droneOsc2Ref = useRef(null);
  const padOscsRef = useRef([]);
  const delayNodeRef = useRef(null);
  const filterNodeRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const noiseGainRef = useRef(null);

  // Get active mood from log or local selector
  const activeMood = todayLog && !todayLog.message ? todayLog.mood : (customMood || 'good');

  // Mood style and color mapping
  const moodPresets = {
    great: {
      name: 'Vibrant Emerald',
      colors: ['#10B981', '#34D399', '#059669', '#06B6D4'],
      tagline: 'Radiant energy and peak performance! 🌟',
      chimes: [440.00, 493.88, 554.37, 659.25, 739.99, 880.00] // A Major Pentatonic
    },
    good: {
      name: 'Glowing Teal',
      colors: ['#14B8A6', '#2DD4BF', '#0D9488', '#3B82F6'],
      tagline: 'Flowing in harmony and focus. 🌊',
      chimes: [440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00] // A Minor Pentatonic
    },
    okay: {
      name: 'Serene Azure',
      colors: ['#3B82F6', '#60A5FA', '#2563EB', '#8B5CF6'],
      tagline: 'Steady, calm, and grounded. 🍃',
      chimes: [392.00, 440.00, 493.88, 587.33, 659.25, 783.99] // G Major Pentatonic
    },
    low: {
      name: 'Amber Glow',
      colors: ['#F97316', '#FBBF24', '#EA580C', '#EF4444'],
      tagline: 'Recharging and gathering strength. 🕯️',
      chimes: [349.23, 392.00, 440.00, 523.25, 587.33, 698.46] // F Major Pentatonic
    },
    exhausted: {
      name: 'Cosmic Twilight',
      colors: ['#8B5CF6', '#A78BFA', '#7C3AED', '#4B5563'],
      tagline: 'Resting deeply, renewing spirit. 🌙',
      chimes: [293.66, 329.63, 349.23, 440.00, 523.25, 587.33] // D Minor Pentatonic
    }
  };

  const currentPreset = moodPresets[activeMood] || moodPresets.good;

  // Web Audio Setup
  const initAudio = () => {
    if (audioCtxRef.current) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      
      // Delay effect for chimes
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.4;
      const delayGain = ctx.createGain();
      delayGain.gain.value = 0.35;
      
      // Feedback loop for delay
      delay.connect(delayGain);
      delayGain.connect(delay);
      
      // Filter for warm audio
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      // Connect graph
      filter.connect(masterGain);
      delay.connect(filter);
      masterGain.connect(ctx.destination);
      
      gainNodeRef.current = masterGain;
      delayNodeRef.current = delay;
      filterNodeRef.current = filter;

      startSynthesizer();
    } catch (e) {
      console.error('Failed to initialize Web Audio API:', e);
    }
  };

  const startSynthesizer = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Clear existing sound generators
    stopSynthesizerInstances();

    const time = ctx.currentTime;

    // 1. Create Drone (Base Frequencies)
    const baseFreq = soundPreset === 'theta' ? 73.42 : soundPreset === 'ocean' ? 110.00 : 146.83; // D2, A2, D3
    
    // Main Drone Osc
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, time);
    
    const droneGain1 = ctx.createGain();
    droneGain1.gain.setValueAtTime(0.3, time);
    
    osc1.connect(droneGain1);
    droneGain1.connect(filterNodeRef.current);
    osc1.start(time);
    
    droneOscRef.current = osc1;

    // Detuned Drone Osc (Creates binaural beat)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    // Add small beat frequency depending on preset (e.g. 4.5Hz for theta relaxation, 10Hz for alpha focus)
    const detuneHz = soundPreset === 'theta' ? 4.5 : soundPreset === 'ocean' ? 6.0 : 9.0;
    osc2.frequency.setValueAtTime(baseFreq + detuneHz, time);
    
    const droneGain2 = ctx.createGain();
    droneGain2.gain.setValueAtTime(0.25, time);
    
    osc2.connect(droneGain2);
    droneGain2.connect(filterNodeRef.current);
    osc2.start(time);
    
    droneOsc2Ref.current = osc2;

    // 2. Ambient Synthesizer Pads (Pentatonic chords)
    // Setup chords based on preset
    let chordFreqs = [];
    if (soundPreset === 'alpha') {
      chordFreqs = [220.00, 261.63, 329.63, 392.00]; // Am7 (A3, C4, E4, G4)
    } else if (soundPreset === 'theta') {
      chordFreqs = [196.00, 246.94, 293.66, 392.00]; // G Major (G3, B3, D4, G4)
    } else {
      chordFreqs = [174.61, 261.63, 349.23, 523.25]; // F Major/sus2 (F3, C4, F4, C5)
    }

    padOscsRef.current = chordFreqs.map((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const padGain = ctx.createGain();
      // Low volume for pads
      padGain.gain.setValueAtTime(0.01, time);
      
      osc.connect(padGain);
      padGain.connect(filterNodeRef.current);
      osc.start(time);

      // Slow volume modulation (LFO emulation) to make pads breathe
      const lfoSpeed = 0.1 + (idx * 0.05);
      const minGain = 0.02;
      const maxGain = 0.08;
      
      const modulate = () => {
        if (!audioCtxRef.current || osc.playbackState === 3) return; // check if stopped
        const t = ctx.currentTime;
        const targetGain = minGain + (Math.sin(t * lfoSpeed) * 0.5 + 0.5) * (maxGain - minGain);
        padGain.gain.linearRampToValueAtTime(targetGain, t + 0.5);
        setTimeout(modulate, 500);
      };
      
      setTimeout(modulate, 50);

      return { osc, gainNode: padGain };
    });

    // 3. Ocean Waves synthesis (for Ocean Breath preset)
    if (soundPreset === 'ocean') {
      // Create white noise buffer
      const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, time);

      // Lowpass filter specifically for the noise to sound like ocean waves
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(400, time);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gainNodeRef.current);
      noise.start(time);

      noiseNodeRef.current = noise;
      noiseGainRef.current = noiseGain;

      // Periodically sweep the filter frequency and noise volume to simulate sea waves
      const sweepWaves = () => {
        if (!audioCtxRef.current || !noiseGainRef.current) return;
        const t = ctx.currentTime;
        // 8-second cycle for waves
        const waveScale = Math.sin(t * (Math.PI / 4)) * 0.5 + 0.5; // 0 to 1
        const targetFreq = 150 + waveScale * 450; // 150Hz to 600Hz
        const targetVol = 0.01 + waveScale * 0.09; // volume sweep

        noiseFilter.frequency.exponentialRampToValueAtTime(targetFreq, t + 2);
        noiseGainRef.current.gain.linearRampToValueAtTime(targetVol, t + 2);

        setTimeout(sweepWaves, 2000);
      };
      sweepWaves();
    }
  };

  const stopSynthesizerInstances = () => {
    try {
      if (droneOscRef.current) {
        droneOscRef.current.stop();
        droneOscRef.current.disconnect();
        droneOscRef.current = null;
      }
      if (droneOsc2Ref.current) {
        droneOsc2Ref.current.stop();
        droneOsc2Ref.current.disconnect();
        droneOsc2Ref.current = null;
      }
      if (padOscsRef.current && padOscsRef.current.length > 0) {
        padOscsRef.current.forEach(item => {
          try {
            item.osc.stop();
            item.osc.disconnect();
          } catch(e) {}
        });
        padOscsRef.current = [];
      }
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (noiseGainRef.current) {
        noiseGainRef.current.disconnect();
        noiseGainRef.current = null;
      }
    } catch (e) {
      console.warn('Error clearing audio generators:', e);
    }
  };

  // Play a chime when clicking on the canvas
  const playChimeNote = (xFraction, yFraction) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPlayingAudio) return;

    const notes = currentPreset.chimes;
    
    // Map X coordinate to note index
    const noteIdx = Math.floor(xFraction * notes.length);
    const targetFreq = notes[Math.min(Math.max(noteIdx, 0), notes.length - 1)];

    // Map Y coordinate to brightness / filter cutoff
    const brightness = 300 + (1 - yFraction) * 2500; // 300Hz to 2800Hz

    const time = ctx.currentTime;
    
    // Create oscillator
    const osc = ctx.createOscillator();
    // Hexagonal crystal shapes sound crisp on sine+triangle mix
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(targetFreq, time);
    
    // Slightly detune to sound lush
    osc.detune.setValueAtTime((Math.random() - 0.5) * 10, time);

    // Filter to sweep decay
    const chimeFilter = ctx.createBiquadFilter();
    chimeFilter.type = 'lowpass';
    chimeFilter.frequency.setValueAtTime(brightness, time);
    chimeFilter.frequency.exponentialRampToValueAtTime(100, time + 2.0);

    // Envelope
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, time);
    // Instant attack, logarithmic decay
    envelope.gain.linearRampToValueAtTime(0.3, time + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 2.5);

    // Connect chime through delay
    osc.connect(chimeFilter);
    chimeFilter.connect(envelope);
    envelope.connect(delayNodeRef.current);
    // Also dry connect to main filter
    envelope.connect(filterNodeRef.current);

    osc.start(time);
    osc.stop(time + 2.6);
  };

  // Handle Play/Pause
  const togglePlayAudio = () => {
    if (!isPlayingAudio) {
      initAudio();
      setIsPlayingAudio(true);
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } else {
      stopSynthesizerInstances();
      setIsPlayingAudio(false);
    }
  };

  // Adjust volume
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(volume * 0.4, audioCtxRef.current.currentTime + 0.1);
    }
  }, [volume]);

  // Handle Preset change
  useEffect(() => {
    if (isPlayingAudio && audioCtxRef.current) {
      startSynthesizer();
    }
  }, [soundPreset]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopSynthesizerInstances();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Visual Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Responsive Canvas
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = 400; // fixed height
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Vital Stats variables for scaling visualization
    const steps = todayLog && !todayLog.message ? todayLog.steps || 0 : 4000;
    const energy = todayLog && !todayLog.message ? todayLog.energyScore || 0 : 60;
    const sleep = todayLog && !todayLog.message ? todayLog.sleepHours || 0 : 7;
    const water = todayLog && !todayLog.message ? todayLog.waterIntake || 0 : 1500;

    // Adjust velocities, density and size based on logs
    const speedFactor = 0.5 + (steps / 10000) * 1.5; // scale velocity by steps
    const orbScale = 0.6 + (energy / 100) * 0.6; // scale base aura size by energy
    const particleDensity = Math.min(Math.max(Math.floor(sleep * 10), 30), 120); // sleep affects particle count
    const rippleChance = 0.005 + (water / 3000) * 0.015; // water goal determines fluid ripple frequency

    // Setup Particles
    let particles = [];
    const createParticle = (initCenter = false) => {
      const angle = Math.random() * Math.PI * 2;
      // Start in center orb or randomly scattered
      const distance = initCenter ? Math.random() * 60 : 50 + Math.random() * 200;
      
      const colors = currentPreset.colors;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        x: canvas.width / 2 + Math.cos(angle) * distance,
        y: canvas.height / 2 + Math.sin(angle) * distance,
        radius: 1.5 + Math.random() * (visualMode === 'sparkles' ? 3.5 : 2.5),
        color: randomColor,
        alpha: 0.1 + Math.random() * 0.7,
        angle: angle,
        speed: (0.2 + Math.random() * 0.8) * speedFactor,
        orbitRadius: 40 + Math.random() * 140,
        orbitSpeed: (0.002 + Math.random() * 0.008) * (Math.random() > 0.5 ? 1 : -1) * speedFactor,
        decay: 0.001 + Math.random() * 0.004,
        wiggle: Math.random() * 100
      };
    };

    // Initialize particles
    for (let i = 0; i < particleDensity; i++) {
      particles.push(createParticle(false));
    }

    // Ripples array (Water intake simulation)
    let ripples = [];
    const triggerRipple = (x = canvas.width / 2, y = canvas.height / 2) => {
      const colors = currentPreset.colors;
      ripples.push({
        x,
        y,
        radius: 5,
        maxRadius: 100 + Math.random() * 120,
        alpha: 0.8,
        color: colors[0],
        speed: 1.5 + Math.random() * 2
      });
    };

    let frame = 0;

    // Render loop
    const render = () => {
      frame++;
      
      // Glassmorphic translucent trail to make particles glow
      ctx.fillStyle = 'rgba(17, 24, 39, 0.18)'; // dark mode trail
      if (document.body.classList.contains('light')) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'; // light mode trail
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Handle breathing expansion multiplier
      const scaleMultiplier = isBreathing ? breathScale : 1.0;
      const adjustedCenterRadius = 60 * orbScale * scaleMultiplier;

      // Draw Central Glowing Orb Aura
      const colors = currentPreset.colors;
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 5,
        centerX, centerY, adjustedCenterRadius * 2.5
      );
      gradient.addColorStop(0, colors[0] + 'CC'); // solid center
      gradient.addColorStop(0.3, colors[1] + '55'); // transparent mid
      gradient.addColorStop(0.7, colors[2] + '11'); // faint edge
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, adjustedCenterRadius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Trigger automatic water fluid ripples based on hydration stats
      if (Math.random() < rippleChance && ripples.length < 5) {
        triggerRipple();
      }

      // Update & Draw Fluid Water Ripples
      ripples.forEach((ripple, idx) => {
        ripple.radius += ripple.speed;
        ripple.alpha -= 0.008;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ripple.color + Math.floor(ripple.alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Remove dead ripples
        if (ripple.radius >= ripple.maxRadius || ripple.alpha <= 0) {
          ripples.splice(idx, 1);
        }
      });

      // Update & Draw Aura Particles
      particles.forEach((p, idx) => {
        // Mode 1: Nebula Wave (Floating cloud flow field)
        if (visualMode === 'nebula') {
          p.angle += 0.004 * p.speed;
          p.wiggle += 0.01;
          const wiggleOffset = Math.sin(p.wiggle) * 15;
          
          p.x = centerX + Math.cos(p.angle) * (p.orbitRadius * scaleMultiplier + wiggleOffset);
          p.y = centerY + Math.sin(p.angle) * (p.orbitRadius * scaleMultiplier + wiggleOffset);
          
          // Slow pulsing alpha
          p.alpha = 0.2 + (Math.sin(frame * 0.01 + p.orbitRadius) * 0.5 + 0.5) * 0.6;
        } 
        
        // Mode 2: Cosmic Sparkles (Exploding and recreating stars)
        else if (visualMode === 'sparkles') {
          // Move outward from center
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist === 0) {
            p.x += 1;
          }
          
          const vx = (dx / (dist || 1)) * p.speed * 2.5;
          const vy = (dy / (dist || 1)) * p.speed * 2.5;
          
          p.x += vx;
          p.y += vy;
          p.alpha -= p.decay;

          // Re-birth particles when faded
          if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            particles[idx] = createParticle(true); // spawn at center
          }
        } 
        
        // Mode 3: Quantum Ring (Orbiting rings with oscillations)
        else if (visualMode === 'quantum') {
          p.angle += p.orbitSpeed;
          // Quantum vibration
          const ringRadius = p.orbitRadius * scaleMultiplier;
          const quantumOsc = Math.sin(frame * 0.05 + p.wiggle) * 4;
          
          p.x = centerX + Math.cos(p.angle) * (ringRadius + quantumOsc);
          p.y = centerY + Math.sin(p.angle) * (ringRadius + quantumOsc);
          p.alpha = 0.3 + (Math.cos(p.angle) * 0.5 + 0.5) * 0.5; // bright on one side
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        
        const alphaHex = Math.min(Math.max(Math.floor(p.alpha * 255), 0), 255).toString(16).padStart(2, '0');
        ctx.fillStyle = p.color + alphaHex;
        
        // Glow effect for larger particles
        if (p.radius > 2.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
      });
      
      // Reset shadow blur
      ctx.shadowBlur = 0;

      // Draw Breathing Center Indicator Overlay if Breathing active
      if (isBreathing) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Canvas click event (Chime generation)
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Calculate fraction
      const xFrac = clickX / canvas.width;
      const yFrac = clickY / canvas.height;
      
      playChimeNote(xFrac, yFrac);
      
      // Add ripple at click site
      triggerRipple(clickX, clickY);

      // Create spark particles at click coordinates
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spark = {
          x: clickX,
          y: clickY,
          radius: 2 + Math.random() * 3,
          color: '#FFFFFF',
          alpha: 1.0,
          speed: 1.5 + Math.random() * 2,
          decay: 0.02 + Math.random() * 0.03,
          angle: angle
        };
        // Update sparkles logic array
        particles.push(spark);
        // Clean up excess particles to keep performance clean
        if (particles.length > 200) {
          particles.shift();
        }
      }
    };

    canvas.addEventListener('mousedown', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleCanvasClick);
    };
  }, [visualMode, activeMood, isPlayingAudio, isBreathing, breathScale]);

  // Breathing Box Timer logic (Inhale 4s -> Hold 4s -> Exhale 4s -> Hold 4s)
  useEffect(() => {
    if (!isBreathing) {
      setBreathingPhase('Inhale');
      setBreathScale(0.6);
      return;
    }

    let breathTimer;
    let phaseElapsed = 0;
    
    const interval = 100; // tick every 100ms
    const breathTick = () => {
      phaseElapsed += 0.1;
      setBreathingElapsed(prev => {
        const next = prev + 0.1;
        // Check if 60 seconds of breathing meditation are completed
        if (next >= 60 && !breathingGoalMet) {
          setBreathingGoalMet(true);
          // Trigger quest completion reward logic!
          if (onQuestComplete) {
            onQuestComplete();
          }
        }
        return next;
      });

      setBreathingPhase(currPhase => {
        // Inhale phase (4 seconds)
        if (currPhase === 'Inhale') {
          // Scale from 0.6 to 1.2
          const currentScale = 0.6 + (phaseElapsed / 4.0) * 0.6;
          setBreathScale(Math.min(currentScale, 1.2));
          if (phaseElapsed >= 4.0) {
            phaseElapsed = 0;
            return 'Hold';
          }
          return 'Inhale';
        } 
        
        // Hold phase (4 seconds)
        else if (currPhase === 'Hold') {
          setBreathScale(1.2);
          if (phaseElapsed >= 4.0) {
            phaseElapsed = 0;
            return 'Exhale';
          }
          return 'Hold';
        } 
        
        // Exhale phase (4 seconds)
        else if (currPhase === 'Exhale') {
          // Scale from 1.2 down to 0.6
          const currentScale = 1.2 - (phaseElapsed / 4.0) * 0.6;
          setBreathScale(Math.max(currentScale, 0.6));
          if (phaseElapsed >= 4.0) {
            phaseElapsed = 0;
            return 'Rest/Hold';
          }
          return 'Exhale';
        }
        
        // Hold on empty (4 seconds)
        else {
          setBreathScale(0.6);
          if (phaseElapsed >= 4.0) {
            phaseElapsed = 0;
            return 'Inhale';
          }
          return 'Rest/Hold';
        }
      });
    };

    breathTimer = setInterval(breathTick, 100);

    return () => clearInterval(breathTimer);
  }, [isBreathing, breathingGoalMet]);

  // Export "Vibe Card" custom canvas graphic
  const exportVibeCard = () => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;

    // Create virtual canvas for Card
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 600;
    cardCanvas.height = 750;
    const ctx = cardCanvas.getContext('2d');

    // 1. Draw solid dark background
    const isLightMode = document.body.classList.contains('light');
    
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, cardCanvas.height);
    if (isLightMode) {
      bgGrad.addColorStop(0, '#F8FAFC');
      bgGrad.addColorStop(1, '#EEF2F6');
    } else {
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(1, '#020617');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

    // 2. Draw modern glow accent behind the card
    const colors = currentPreset.colors;
    const glowGrad = ctx.createRadialGradient(
      cardCanvas.width / 2, cardCanvas.height / 2.5, 20,
      cardCanvas.width / 2, cardCanvas.height / 2.5, 300
    );
    glowGrad.addColorStop(0, colors[0] + '33');
    glowGrad.addColorStop(0.5, colors[1] + '11');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cardCanvas.width / 2, cardCanvas.height / 2.5, 300, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw active visual aura canvas onto card
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = colors[0] + '40';
    // Draw canvas visual circle
    ctx.beginPath();
    ctx.arc(cardCanvas.width / 2, cardCanvas.height / 2.5, 160, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw the actual particle frame from the active canvas
    // Copy the center block
    const size = Math.min(mainCanvas.width, mainCanvas.height);
    ctx.drawImage(
      mainCanvas, 
      mainCanvas.width / 2 - size / 2, mainCanvas.height / 2 - size / 2, size, size,
      cardCanvas.width / 2 - 160, cardCanvas.height / 2.5 - 160, 320, 320
    );
    ctx.restore();

    // Draw circular frame border
    ctx.beginPath();
    ctx.arc(cardCanvas.width / 2, cardCanvas.height / 2.5, 160, 0, Math.PI * 2);
    ctx.strokeStyle = colors[0] + '80';
    ctx.lineWidth = 5;
    ctx.stroke();

    // 4. Render typography text details
    const textTheme = isLightMode ? '#0F172A' : '#FFFFFF';
    const subTheme = isLightMode ? '#64748B' : '#94A3B8';

    // Header Card Brand
    ctx.fillStyle = colors[0];
    ctx.font = 'bold 20px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURA VIBE CARD', cardCanvas.width / 2, 60);

    // User details
    ctx.fillStyle = textTheme;
    ctx.font = 'bold 28px "Outfit", "Inter", sans-serif';
    ctx.fillText(user?.name || 'Aura Explorer', cardCanvas.width / 2, 490);

    ctx.fillStyle = subTheme;
    ctx.font = 'medium 14px "Inter", sans-serif';
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    ctx.fillText(dateStr, cardCanvas.width / 2, 515);

    // Divider Line
    ctx.beginPath();
    ctx.moveTo(100, 545);
    ctx.lineTo(500, 545);
    ctx.strokeStyle = isLightMode ? '#E2E8F0' : '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Grid of Today's Vital Stats
    const steps = todayLog && !todayLog.message ? todayLog.steps || 0 : 0;
    const energy = todayLog && !todayLog.message ? todayLog.energyScore || 0 : 0;
    const sleep = todayLog && !todayLog.message ? todayLog.sleepHours || 0 : 0;
    const water = todayLog && !todayLog.message ? todayLog.waterIntake || 0 : 0;

    const stats = [
      { label: 'Energy Rating', val: `${energy}%` },
      { label: 'Aura State', val: activeMood.toUpperCase() },
      { label: 'Sleep Hours', val: `${sleep} hrs` },
      { label: 'Hydration', val: `${water} ml` }
    ];

    ctx.textAlign = 'left';
    
    // Draw 2x2 grid stats
    stats.forEach((stat, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      
      const xPos = col === 0 ? 120 : 340;
      const yPos = 585 + row * 55;
      
      // Stat label
      ctx.fillStyle = subTheme;
      ctx.font = '500 11px "Inter", sans-serif';
      ctx.fillText(stat.label.toUpperCase(), xPos, yPos);
      
      // Stat value
      ctx.fillStyle = textTheme;
      ctx.font = 'bold 18px "Outfit", "Inter", sans-serif';
      ctx.fillText(stat.val, xPos, yPos + 22);
    });

    // Tagline footer note
    ctx.textAlign = 'center';
    ctx.fillStyle = colors[0];
    ctx.font = 'italic 15px "Inter", sans-serif';
    ctx.fillText(`"${currentPreset.tagline}"`, cardCanvas.width / 2, 705);

    // Save as local image file download
    const link = document.createElement('a');
    link.download = `Aura_Vibe_Card_${activeMood}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = cardCanvas.toDataURL('image/png');
    link.click();

    // Trigger quest completion reward logic!
    if (onQuestComplete) {
      onQuestComplete();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 animate-slide-up">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
            Aura Art & Sound Studio
          </h2>
          <p className="text-xs text-gray-400">Synthesize your mood into custom dynamic particle art and therapeutic frequency chords</p>
        </div>

        {/* Action Button Exporters */}
        <div className="flex gap-2 self-end sm:self-auto">
          <button
            onClick={exportVibeCard}
            className="py-1.5 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all hover:scale-105"
            title="Download Custom Vibe Art Card"
          >
            <Download className="w-3.5 h-3.5" />
            Export Vibe Card
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Toolbar Controls (Visuals and Audio presets) */}
        <div className="lg:col-span-1 space-y-5 flex flex-col justify-start">
          {/* Visual Mode Selector */}
          <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-extrabold text-gray-750 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Aura Visualizer
            </h4>
            
            <div className="flex flex-col gap-2">
              {[
                { id: 'nebula', name: 'Nebula Wave 🌌', desc: 'Floating cosmic cloud' },
                { id: 'sparkles', name: 'Cosmic Sparkles ✨', desc: 'Fading spark system' },
                { id: 'quantum', name: 'Quantum Ring 💫', desc: 'Oscillating orbit ring' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setVisualMode(mode.id)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                    visualMode === mode.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-850 text-gray-550 dark:text-gray-400 hover:border-gray-250'
                  }`}
                >
                  <p>{mode.name}</p>
                  <p className="text-[9px] text-gray-400 font-medium mt-0.5">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sound Synthesizer Panel */}
          <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-gray-750 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-emerald-500" />
                Vibe Synthesizer
              </h4>
              
              {/* Play / Mute button */}
              <button
                onClick={togglePlayAudio}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPlayingAudio 
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
                title={isPlayingAudio ? "Mute synth soundscape" : "Play synth soundscape"}
              >
                {isPlayingAudio ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {isPlayingAudio ? (
              <div className="space-y-3">
                {/* Audio presets selection */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-400 font-bold">Sound preset:</span>
                  {[
                    { id: 'alpha', name: 'Alpha Glow 🔔', desc: 'Warm melodic pentatonic chimes' },
                    { id: 'theta', name: 'Theta Calm 🧘‍♀️', desc: 'Binaural drone for relaxation' },
                    { id: 'ocean', name: 'Ocean Breath 🌊', desc: 'White noise tidal sweep generator' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setSoundPreset(preset.id)}
                      className={`p-2 rounded-lg text-left text-[11px] border transition-colors ${
                        soundPreset === preset.id
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Volume slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>Synth Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-2.5 px-1 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <button
                  onClick={togglePlayAudio}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-[10px] inline-flex items-center gap-1 shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Enable Soundscape
                </button>
                <p className="text-[9px] text-gray-400 mt-1.5 leading-relaxed px-2">Generates soothing real-time harmonics using your browser's audio nodes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Middle Interactive Canvas Area */}
        <div className="lg:col-span-2 relative bg-gray-950 dark:bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col items-center justify-center">
          <canvas 
            ref={canvasRef} 
            className="w-full block cursor-crosshair"
            style={{ minHeight: '400px' }}
          />

          {/* Interactive touch tip */}
          <div className="absolute bottom-3 right-4 flex items-center gap-1 text-[10px] text-white/50 bg-black/45 px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none select-none">
            <Info className="w-3 h-3 text-emerald-400" />
            <span>Click canvas to synthesize chime notes</span>
          </div>

          {/* Breathing Guide HUD Overlay */}
          {isBreathing && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center pointer-events-none select-none">
              {/* Pulsing visual element ring */}
              <div 
                className="w-40 h-40 rounded-full border-2 border-white/30 flex items-center justify-center transition-all duration-100 ease-linear shadow-[0_0_50px_rgba(255,255,255,0.15)]"
                style={{ transform: `scale(${breathScale})` }}
              >
                <div className="w-36 h-36 rounded-full bg-white/5 border border-white/20"></div>
              </div>

              {/* Instructions text HUD */}
              <div className="mt-8 space-y-1 z-10">
                <p className="text-white text-2xl font-black tracking-wide uppercase transition-all duration-300 scale-105">
                  {breathingPhase === 'Rest/Hold' ? 'HOLD' : breathingPhase}
                </p>
                <p className="text-white/60 text-xs font-semibold">
                  {breathingPhase === 'Inhale' && 'Slowly fill your lungs...'}
                  {breathingPhase === 'Hold' && 'Keep the air inside...'}
                  {breathingPhase === 'Exhale' && 'Let the stress float away...'}
                  {breathingPhase === 'Rest/Hold' && 'Relax before the next breath...'}
                </p>
                
                {/* Session countdown timer */}
                <div className="pt-2 text-[10px] text-emerald-400 font-bold bg-black/30 px-3 py-1 rounded-full max-w-[120px] mx-auto mt-2 backdrop-blur-sm">
                  Elapsed: {Math.floor(breathingElapsed)}s / 60s
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Info and Breath Session details */}
        <div className="lg:col-span-1 space-y-5 flex flex-col justify-between h-full">
          {/* Active Vibe Info Box */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-850 dark:to-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <div>
                <h4 className="text-xs font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">Aura Customization</h4>
                <p className="text-[10px] text-emerald-500 font-bold">Preset: {currentPreset.name}</p>
              </div>
            </div>

            {/* Custom Mood Override selector for Guest/Preview Mode */}
            {(!todayLog || todayLog.message) && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Preview Mood States:</span>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: 'great', emoji: '😃' },
                    { id: 'good', emoji: '🙂' },
                    { id: 'okay', emoji: '😐' },
                    { id: 'low', emoji: '🙁' },
                    { id: 'exhausted', emoji: '😩' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setCustomMood(m.id)}
                      className={`p-1.5 rounded-lg border text-sm transition-all ${
                        activeMood === m.id
                          ? 'bg-emerald-500/15 border-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-gray-950 border-gray-150 dark:border-gray-800 hover:border-gray-300'
                      }`}
                      title={m.id}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-2 leading-relaxed font-semibold">
              <p>Your aura reacts dynamically to today's logged vitals:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li><span className="text-emerald-500 font-bold">Steps</span> adjust particles velocity.</li>
                <li><span className="text-teal-500 font-bold">Energy</span> scales center glow size.</li>
                <li><span className="text-indigo-500 font-bold">Sleep</span> adjusts particle count.</li>
                <li><span className="text-blue-500 font-bold">Water</span> spawns fluid ripple waves.</li>
              </ul>
            </div>
          </div>

          {/* Guided Meditation Trigger */}
          <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800 space-y-3.5 text-center flex-1 flex flex-col justify-center">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Wind className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-white uppercase tracking-wider">Aura Breathing Guide</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed px-2 font-medium">Use our customized visual circle pacing to relax, inhale positive vibes, and exhale fatigue.</p>
            
            <div className="pt-2">
              {isBreathing ? (
                <button
                  onClick={() => setIsBreathing(false)}
                  className="w-full py-2 bg-red-500 hover:bg-red-650 text-white rounded-xl font-bold text-xs shadow-md shadow-red-500/10 transition-colors"
                >
                  Stop Session
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsBreathing(true);
                    setBreathingElapsed(0);
                    // Automatically enable audio preset synced to meditation
                    if (!isPlayingAudio) {
                      togglePlayAudio();
                    }
                    setSoundPreset('ocean');
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.03]"
                >
                  Start Breathing Session
                </button>
              )}
            </div>

            {/* Breathing Goal complete banner */}
            {breathingGoalMet && (
              <div className="mt-2.5 p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black flex items-center justify-center gap-1">
                <Check className="w-3 h-3" />
                <span>60s Breathing Session Completed!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
