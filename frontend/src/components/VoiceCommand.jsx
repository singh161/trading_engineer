import React, { useState, useEffect, useRef } from 'react';
import { executeVoiceAction } from '../services/voiceActionExecutor';
import api from '../services/api';

/**
 * VoiceCommand Component
 * 
 * Provides voice command functionality using Web Speech API
 * - Wake word detection: "Radhe Radhe"
 * - Speech-to-text conversion
 * - Sends recognized text to backend
 * - Executes actions via voiceActionExecutor
 * 
 * Mobile-safe: Button-based activation (no continuous listening)
 */
function VoiceCommand({ appState }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedCommand, setDetectedCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [voiceAuthEnabled, setVoiceAuthEnabled] = useState(false);
  const [noiseFilterEnabled, setNoiseFilterEnabled] = useState(true);
  const [noiseThreshold, setNoiseThreshold] = useState(0.6); // Minimum confidence to consider

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const voicesLoadedRef = useRef(false);
  const trainingSamplesRef = useRef([]);
  const lastConfidenceRef = useRef(0);
  const noiseWordsRef = useRef([
    'um', 'uh', 'ah', 'eh', 'hmm', 'mmm', 'err', 'like', 'you know',
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'huh', 'oh', 'okay', 'ok', 'yeah', 'yes', 'no', 'well',
    'so', 'then', 'now', 'just', 'really', 'actually', 'basically',
    'मतलब', 'यार', 'ना', 'हम्म्', 'अ', 'आ', 'ठीक', 'अच्छा'
  ]);

  /**
   * Speak greeting when wake word is detected
   * Ensures audio plays through speakers with proper error handling
   */
  const speakGreeting = () => {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this browser');
        setStatus('Wake word detected! (Audio response not available)');
        return;
      }

      // Check if speech synthesis is available and ready
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      // Wait a bit for cancel to complete
      setTimeout(() => {
        try {
          // Try to get available voices first
          // Some browsers need voices to be loaded
          let voices = window.speechSynthesis.getVoices();

          // If no voices loaded, wait a bit and try again
          if (voices.length === 0) {
            setTimeout(() => {
              voices = window.speechSynthesis.getVoices();
              if (voices.length > 0) {
                voicesLoadedRef.current = true;
                attemptSpeak(voices);
              } else {
                // No voices available, use default
                attemptSpeak([]);
              }
            }, 500);
            return;
          }

          attemptSpeak(voices);

        } catch (error) {
          console.warn('Error creating speech utterance:', error);
          // Try fallback
          tryFallbackGreeting();
        }
      }, 100);

    } catch (error) {
      console.warn('Error in speakGreeting:', error);
      setStatus('Wake word detected! Listening for command...');
    }
  };

  /**
   * Attempt to speak with available voices
   */
  const attemptSpeak = (voices) => {
    try {
      let selectedVoice = null;

      // Try to find Hindi voice, fallback to English
      if (voices.length > 0) {
        selectedVoice = voices.find(v => v.lang.includes('hi')) ||
          voices.find(v => v.lang.includes('en')) ||
          voices[0];
      }

      // Create the greeting utterance
      const greeting = new SpeechSynthesisUtterance('Radhey Radhey Boss');

      // Set voice if available
      if (selectedVoice) {
        greeting.voice = selectedVoice;
        greeting.lang = selectedVoice.lang;
      } else {
        // Fallback to English if no voices available
        greeting.lang = 'en-US';
      }

      // Set voice properties for clear audio
      greeting.rate = 0.9; // Slightly slower for clarity
      greeting.pitch = 1.0;
      greeting.volume = 1.0; // Maximum volume

      // Event handlers with proper error handling
      greeting.onstart = () => {
        console.log('🔊 Speaking: Radhey Radhey Boss');
        setIsSpeaking(true);
        setStatus('🔊 Radhey Radhey Boss');
      };

      greeting.onend = () => {
        console.log('✅ Greeting finished');
        setIsSpeaking(false);
        setStatus('Wake word detected! Listening for command...');
      };

      greeting.onerror = (event) => {
        // Handle error silently and try fallback
        const errorType = event.error || 'unknown';
        console.warn('Speech synthesis error (handled):', errorType);
        setIsSpeaking(false);

        // Only try fallback if error is not "canceled" or "interrupted"
        if (errorType !== 'canceled' && errorType !== 'interrupted' && errorType !== 'synthesis-failed') {
          tryFallbackGreeting();
        } else {
          setStatus('Wake word detected! Listening for command...');
        }
      };

      // Speak the greeting
      window.speechSynthesis.speak(greeting);
      console.log('🎤 Wake word detected - Responding: Radhey Radhey Boss');

    } catch (error) {
      console.warn('Error in attemptSpeak:', error);
      // Try fallback
      tryFallbackGreeting();
    }
  };

  /**
   * Fallback greeting with English language
   */
  const tryFallbackGreeting = () => {
    try {
      if (!('speechSynthesis' in window)) {
        return;
      }

      const fallbackGreeting = new SpeechSynthesisUtterance('Radhey Radhey Boss');
      fallbackGreeting.lang = 'en-US';
      fallbackGreeting.volume = 1.0;
      fallbackGreeting.rate = 0.9;
      fallbackGreeting.pitch = 1.0;

      fallbackGreeting.onstart = () => {
        setIsSpeaking(true);
        setStatus('🔊 Radhey Radhey Boss');
      };

      fallbackGreeting.onend = () => {
        setIsSpeaking(false);
        setStatus('Wake word detected! Listening for command...');
      };

      fallbackGreeting.onerror = (event) => {
        // Silently handle fallback error
        console.warn('Fallback speech synthesis also failed:', event.error || 'Unknown error');
        setIsSpeaking(false);
        setStatus('Wake word detected! Listening for command...');
      };

      window.speechSynthesis.speak(fallbackGreeting);
    } catch (error) {
      console.warn('Fallback greeting failed:', error);
      setIsSpeaking(false);
      setStatus('Wake word detected! Listening for command...');
    }
  };

  // Load voice profile from localStorage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('voiceProfile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        setVoiceProfile(profile);
        setVoiceAuthEnabled(true);
        console.log('✅ Voice profile loaded');
      } catch (e) {
        console.error('Error loading voice profile:', e);
      }
    }
  }, []);

  // Load voices for speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices - some browsers need this
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          voicesLoadedRef.current = true;
          console.log('✅ Voices loaded:', voices.length);
        }
      };

      // Try to load voices immediately
      loadVoices();

      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  /**
   * Filter noise from transcript
   */
  const filterNoise = (transcript, confidence) => {
    if (!noiseFilterEnabled) {
      return { filtered: transcript, isValid: true };
    }

    // Filter 1: Check confidence threshold
    if (confidence < noiseThreshold) {
      console.log('🔇 Noise filtered: Low confidence', confidence);
      return { filtered: transcript, isValid: false };
    }

    // Filter 2: Remove noise words
    let filtered = transcript.toLowerCase().trim();
    noiseWordsRef.current.forEach(noiseWord => {
      const regex = new RegExp(`\\b${noiseWord}\\b`, 'gi');
      filtered = filtered.replace(regex, '').trim();
    });

    // Filter 3: Ignore very short transcripts (likely noise)
    const words = filtered.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) {
      console.log('🔇 Noise filtered: Empty after filtering');
      return { filtered: '', isValid: false };
    }

    // Filter 4: Ignore single character or very short words
    const meaningfulWords = words.filter(w => w.length > 1);
    if (meaningfulWords.length === 0) {
      console.log('🔇 Noise filtered: No meaningful words');
      return { filtered: '', isValid: false };
    }

    // Filter 5: Check if transcript is too short (likely background noise)
    const cleanedTranscript = meaningfulWords.join(' ');
    if (cleanedTranscript.length < 3) {
      console.log('🔇 Noise filtered: Too short');
      return { filtered: '', isValid: false };
    }

    return { filtered: cleanedTranscript, isValid: true };
  };

  /**
   * Verify if voice matches trained profile (Vocal Signature)
   */
  const verifyVoice = (confidence, transcript, startTime = null) => {
    if (!voiceAuthEnabled || !voiceProfile) {
      return true; // If no profile, allow all
    }

    console.log('🔒 Verifying Vocal Signature...');

    // Check 1: Confidence Pattern
    // Trained users usually have a consistent confidence range for the wake word
    const minConfidence = voiceProfile.minConfidence || 0.65;
    if (confidence < minConfidence) {
      console.log('❌ Trace: Confidence too low', confidence, '<', minConfidence);
      return false;
    }

    // Check 2: Cadence Pattern (Timing)
    // How fast/slow the user says the wake word is a unique identifier
    if (startTime && voiceProfile.avgDuration) {
      const duration = Date.now() - startTime;
      const lowerBound = voiceProfile.avgDuration * 0.5; // Allow some variance
      const upperBound = voiceProfile.avgDuration * 1.8;

      if (duration < lowerBound || duration > upperBound) {
        console.log('❌ Trace: Cadence mismatch. Duration:', duration, 'Expected:', voiceProfile.avgDuration);
        return false;
      }
    }

    // Check 3: Language Pattern
    const transcriptLower = transcript.toLowerCase();
    const hasHindi = transcriptLower.includes('राधे');
    const hasEnglish = transcriptLower.includes('radhe');

    // If user trained with Hindi but someone else uses English (or vice-versa)
    if (voiceProfile.prefersHindi && !hasHindi && hasEnglish) {
      console.log('❌ Trace: Dialect mismatch (Expected Hindi pattern)');
      return false;
    }

    console.log('✅ Vocal Signature Verified');
    return true;
  };

  // Initialize Web Speech API - only once
  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Initialize recognition only if not already initialized
    if (recognitionRef.current) {
      return; // Already initialized
    }

    // Initialize recognition with noise reduction settings
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening continuously until manually stopped
    recognition.interimResults = true; // Show interim results
    recognition.lang = 'hi-IN'; // Restrict to Hindi only as per user request
    recognition.maxAlternatives = 1; // Only get best result (reduces noise)

    // Note: Some browsers support additional noise reduction settings
    // These may not be available in all browsers but won't cause errors if not supported
    if ('serviceURI' in recognition) {
      // Use cloud-based recognition if available (better noise handling)
      // recognition.serviceURI = 'wss://speech.googleapis.com/v1/speech:recognize';
    }

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setStatus('Listening...');
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalSegment = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence || 0;
        maxConfidence = Math.max(maxConfidence, confidence);
        lastConfidenceRef.current = maxConfidence;

        // Apply noise filtering
        const noiseFiltered = filterNoise(transcriptSegment, confidence);
        if (!noiseFiltered.isValid && event.results[i].isFinal) {
          console.log('🔇 Ignoring noise:', transcriptSegment, 'confidence:', confidence);
          continue;
        }

        if (event.results[i].isFinal) {
          finalSegment = (noiseFiltered.filtered || transcriptSegment).trim();
          finalTranscriptRef.current += finalSegment + ' ';
        } else {
          if (confidence >= noiseThreshold) {
            interimTranscript += transcriptSegment;
          }
        }
      }

      interimTranscriptRef.current = interimTranscript;

      // Update transcript display
      const currentFinal = finalTranscriptRef.current.trim();
      setTranscript(currentFinal + (interimTranscript ? ' ' + interimTranscript : ''));

      // 1. Wake word detection in real-time
      const lowerInterim = interimTranscript.toLowerCase();
      const lowerFinal = finalSegment.toLowerCase();
      const fullLower = (currentFinal + ' ' + interimTranscript).toLowerCase();

      const hasWakeWord = fullLower.includes('radhe radhe') || fullLower.includes('राधे राधे') || fullLower.includes('radheradhe');

      if (hasWakeWord && !wakeWordDetected) {
        // STRICT IDENTIFICATION: Only "Radhe Radhe" from the OWNER should work
        if (voiceAuthEnabled && voiceProfile) {
          const isOwner = verifyVoice(maxConfidence, fullLower);
          if (!isOwner) {
            console.log('🛑 Unauthorized voice detected. Ignoring.');
            // Brief visual feedback that someone spoke but was rejected
            setStatus('🔒 Unauthorized Voice Detected');
            return;
          }
        }

        setWakeWordDetected(true);
        speakGreeting();

        // AUTO-READY: Open the modal automatically if it's closed
        if (appState.setShowVoiceCommand) {
          appState.setShowVoiceCommand(true);
        }

        setStatus('✅ Wake word detected! Listening for command...');
        setDetectedCommand('Wake word detected');
      }

      // 2. IMMEDIATE COMMAND PROCESSING for final segments
      if (finalSegment && wakeWordDetected) {
        // Extract command (remove wake word)
        const commandText = finalSegment.replace(/radhe radhe|राधे राधे|radheradhe/gi, '').trim();

        if (commandText.length > 2) {
          console.log('🚀 Immediate trigger for final segment:', commandText);
          processCommand(commandText);

          // Clear for next command
          finalTranscriptRef.current = '';
          setWakeWordDetected(false);
        }
      }

      // Update status
      if (interimTranscript) {
        setStatus(`🎤 Listening: "${interimTranscript}"...`);
      } else if (finalSegment) {
        setStatus(`📝 Captured: "${finalSegment}"`);
      }
    };

    /**
     * Handle raw text command (requested by user)
     */
    window.handleVoiceCommand = async (text) => {
      console.log('🗣️ External handleVoiceCommand call:', text);
      return await processCommand(text);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'no-speech') {
        // Don't stop on no-speech, just keep listening
        // This is normal - background noise doesn't count as speech
        setStatus('🎤 Listening... (waiting for clear speech)');
        // Don't set isListening to false - keep it running
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please check your microphone permissions.');
        setIsListening(false);
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
        setIsListening(false);
      } else if (event.error === 'aborted') {
        // User manually stopped - this is fine
        console.log('Recognition aborted by user');
        setIsListening(false);
      } else {
        // For other errors, try to keep listening
        setError(`Speech recognition error: ${event.error}`);
        // Don't stop listening unless it's a critical error
        if (event.error !== 'network' && event.error !== 'service-not-allowed') {
          // Try to restart after a short delay
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Auto-restart after error failed:', e);
              }
            }
          }, 1000);
        } else {
          setIsListening(false);
        }
      }
    };

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended');

      // Only process if we're still supposed to be listening (not manually stopped)
      if (!isListening) {
        console.log('Listening was manually stopped, not processing');
        return;
      }

      // If we have a final transcript and wake word was detected, process it
      if (finalTranscriptRef.current && wakeWordDetected) {
        // Apply noise filtering
        const noiseFiltered = filterNoise(finalTranscriptRef.current, lastConfidenceRef.current);
        if (!noiseFiltered.isValid) {
          console.log('🔇 Ignoring noise in command');
          setStatus('🎤 Listening... (noise filtered)');
          setWakeWordDetected(false);
          return;
        }

        const command = noiseFiltered.filtered.replace(/radhe radhe|radheradhe|राधे राधे/gi, '').trim();
        if (command) {
          setDetectedCommand(`Command: "${command}"`);
          processCommand(command);
        } else {
          setStatus('⚠️ Wake word detected but no command. Keep listening...');
          // Don't stop listening, just reset wake word
          setWakeWordDetected(false);
        }
      } else if (finalTranscriptRef.current && !wakeWordDetected) {
        // Apply noise filtering to final transcript
        const noiseFiltered = filterNoise(finalTranscriptRef.current, lastConfidenceRef.current);
        if (!noiseFiltered.isValid) {
          console.log('🔇 Ignoring noise in final transcript');
          setStatus('🎤 Listening... (noise filtered)');
          return;
        }

        // If no wake word but we have text, check if it contains wake word
        const text = noiseFiltered.filtered.toLowerCase();
        if (text.includes('radhe radhe') || text.includes('radheradhe') || text.includes('राधे राधे')) {
          // Verify voice if authentication is enabled
          if (voiceAuthEnabled && voiceProfile) {
            // Use stored confidence from last recognition result
            const isVerified = verifyVoice(lastConfidenceRef.current, noiseFiltered.filtered);
            if (!isVerified) {
              setStatus('❌ Voice not recognized. Only your voice is accepted.');
              setDetectedCommand('❌ Voice verification failed');
              return;
            }
          }

          // Respond with "Radhey Radhey Boss"
          speakGreeting();

          // Extract command after wake word
          const command = noiseFiltered.filtered.replace(/radhe radhe|radheradhe|राधे राधे/gi, '').trim();
          if (command) {
            setDetectedCommand(`Command: "${command}"`);
            // Wait a bit for the greeting to finish, then process command
            setTimeout(() => {
              processCommand(command);
            }, 1500);
          } else {
            setStatus('⚠️ Wake word detected but no command. Keep listening...');
            setWakeWordDetected(false);
          }
        } else {
          // No wake word, just keep listening
          setStatus('🎤 Listening... Say "Radhe Radhe" to activate');
        }
      } else {
        // No transcript, just keep listening
        setStatus('🎤 Listening...');
      }

      // Always auto-restart if we're still supposed to be listening
      // This ensures it never stops unless user manually stops it
      if (isListening) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && isListening) {
              recognitionRef.current.start();
              console.log('🔄 Auto-restarted recognition (continuous mode)');
            }
          } catch (e) {
            // Ignore "already started" errors
            if (e.message && !e.message.includes('already started')) {
              console.log('Auto-restart failed:', e);
              // Try again after a longer delay
              setTimeout(() => {
                if (recognitionRef.current && isListening) {
                  try {
                    recognitionRef.current.start();
                  } catch (e2) {
                    console.log('Second restart attempt failed:', e2);
                  }
                }
              }, 2000);
            }
          }
        }, 500);
      }

      // Reset wake word detection only if we processed a command
      // Otherwise keep it for next command
      if (!finalTranscriptRef.current || !wakeWordDetected) {
        setWakeWordDetected(false);
      }

      // Clear transcripts for next round
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
    };

    recognitionRef.current = recognition;

    // AUTO-START: Start listening for wake-word as soon as the component mounts
    // This makes the app always ready for "Radhe Radhe"
    setTimeout(() => {
      if (recognition && !isListening) {
        try {
          recognition.start();
          setIsListening(true);
          setContinuousMode(true);
          console.log('🎙️ Background Voice Listener Activated (Waiting for "Radhe Radhe")');
        } catch (e) {
          console.log('Auto-start recognition failed:', e.message);
        }
      }
    }, 2000);

    return () => {
      // Don't abort on cleanup, keep it alive
    };
  }, []); // Only initialize once

  // Update continuous mode when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true; // Always keep continuous mode ON
    }
  }, [continuousMode]);

  /**
   * Process voice command
   * Sends text to backend and executes action
   */
  const processCommand = async (commandText) => {
    console.log('🔍 [DEBUG] processCommand called with:', commandText);

    if (!commandText || !commandText.trim()) {
      console.log('⚠️ [DEBUG] Empty command, returning');
      setStatus('No command detected. Keep listening...');
      // Don't stop listening, just keep going
      setWakeWordDetected(false);
      return;
    }

    try {
      console.log('✅ [DEBUG] Starting command processing');
      setIsProcessing(true);
      setStatus(`Processing: "${commandText}"...`);
      console.log('📤 [DEBUG] Sending command to backend:', commandText);
      console.log('🔗 [DEBUG] API endpoint: /ai/voice-command');

      // Send to backend voice command endpoint
      // Backend expects JSON body with 'command' field
      console.log('⏳ [DEBUG] Making API call...');
      const response = await api.post('/ai/voice-command', { command: commandText });
      console.log('✅ [DEBUG] API call successful');

      console.log('📥 [DEBUG] Backend response:', response.data);
      const actionResponse = response.data;
      console.log('🎯 [DEBUG] Action:', actionResponse.action);
      console.log('📊 [DEBUG] Confidence:', actionResponse.confidence);
      console.log('📋 [DEBUG] Params:', actionResponse.params);

      // Check if response has error action
      if (actionResponse.action === 'ERROR') {
        console.error('❌ [DEBUG] Backend returned ERROR action');
        throw new Error(actionResponse.params?.message || 'Backend returned error');
      }

      // Execute action using voice action executor - AUTOMATIC EXECUTION
      console.log('🎯 [DEBUG] Executing action AUTOMATICALLY:', actionResponse.action);
      console.log('📋 [DEBUG] Action params:', actionResponse.params);
      console.log('🔧 [DEBUG] appState keys:', Object.keys(appState || {}));
      console.log('🔧 [DEBUG] appState:', appState);

      // Show what action is being executed
      const actionNames = {
        'RUN_ANALYSIS': 'Running Complete Analysis',
        'SHOW_BEST_STOCKS': 'Showing Best Stocks',
        'SHOW_NEWS': 'Showing Stock News',
        'SHOW_SECTOR_RANKING': 'Showing Sector Ranking',
        'SHOW_TARGET_PRICE': 'Showing Target Prices',
        'SHOW_RISK_ANALYSIS': 'Showing Risk Analysis',
        'SHOW_SECTOR_ANALYSIS': 'Showing Sector Analysis',
        'COMPARE_STOCKS': 'Comparing Stocks'
      };

      const actionName = actionNames[actionResponse.action] || actionResponse.action;
      console.log('📝 [DEBUG] Action name:', actionName);
      setStatus(`🎯 Executing: ${actionName}...`);

      console.log('⏳ [DEBUG] Calling executeVoiceAction...');
      const result = await executeVoiceAction(actionResponse, appState);
      console.log('✅ [DEBUG] executeVoiceAction returned:', result);
      console.log('✅ [DEBUG] Result success:', result.success);
      console.log('✅ [DEBUG] Result message:', result.message);

      if (result.success) {
        const successMsg = result.message || 'Command executed successfully';
        setStatus(`✅ ${successMsg}`);
        setDetectedCommand(`✅ Executed: "${commandText}"`);

        // Add to command history
        setCommandHistory(prev => [
          { command: commandText, result: successMsg, timestamp: new Date().toLocaleTimeString(), success: true },
          ...prev.slice(0, 4) // Keep last 5 commands
        ]);

        // Show action execution feedback
        console.log(`🎯 Action executed: ${actionResponse.action}`);
        console.log(`📊 Action details:`, actionResponse);

        // Optional: Text-to-speech confirmation with error handling
        if ('speechSynthesis' in window) {
          try {
            // Create a more natural confirmation message
            let confirmationMsg = successMsg;
            if (actionResponse.action === 'RUN_ANALYSIS') {
              confirmationMsg = 'Analysis started successfully';
            } else if (actionResponse.action === 'SHOW_BEST_STOCKS') {
              confirmationMsg = 'Showing best stocks';
            } else if (actionResponse.action === 'SHOW_NEWS') {
              confirmationMsg = 'Showing stock news';
            }

            const utterance = new SpeechSynthesisUtterance(confirmationMsg);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.volume = 1.0;

            utterance.onerror = (event) => {
              // Silently handle error - don't show to user
              console.warn('Speech synthesis error (ignored):', event.error || 'Unknown error');
            };

            window.speechSynthesis.speak(utterance);
          } catch (error) {
            // Silently handle error
            console.warn('Error speaking confirmation:', error);
          }
        }
      } else {
        const errorMsg = result.message || 'Command failed';
        setStatus(`❌ ${errorMsg}`);
        setError(errorMsg);
        setDetectedCommand(`❌ Failed: "${commandText}"`);

        // Add to command history
        setCommandHistory(prev => [
          { command: commandText, result: errorMsg, timestamp: new Date().toLocaleTimeString(), success: false },
          ...prev.slice(0, 4)
        ]);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      let errorMessage = 'Failed to process command';

      if (error.response) {
        // Backend returned an error
        errorMessage = error.response.data?.detail || error.response.data?.message || error.response.statusText;
        console.error('Backend error:', error.response.data);
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'No response from server. Is backend running?';
        console.error('No response:', error.request);
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error';
      }

      setStatus(`❌ Error: ${errorMessage}`);
      setError(errorMessage);
      setDetectedCommand(`❌ Error: "${commandText}"`);

      // Add to command history
      setCommandHistory(prev => [
        { command: commandText, result: errorMessage, timestamp: new Date().toLocaleTimeString(), success: false },
        ...prev.slice(0, 4)
      ]);
    } finally {
      setIsProcessing(false);

      // Keep listening - don't stop automatically
      // Only stop if user manually clicks stop button
      // Reset wake word for next command
      setWakeWordDetected(false);

      // Clear status after 3 seconds and show listening status
      setTimeout(() => {
        if (isListening) {
          setStatus('🎤 Listening for next command... Say "Radhe Radhe" to activate');
        }
      }, 3000);
    }
  };

  /**
   * Start listening for voice command
   */
  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    if (isListening) {
      // Stop if already listening
      recognitionRef.current.stop();
      setIsListening(false);
      setContinuousMode(false);
      setTranscript('');
      setDetectedCommand('');
      return;
    }

    // Reset state
    setError(null);
    setStatus('🎤 Say "Radhe Radhe" then your command...');
    setWakeWordDetected(false);
    setTranscript('');
    setDetectedCommand('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';

    // Ensure audio context is active (required by some browsers)
    // This helps ensure speech synthesis works properly
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Start recognition
    try {
      // Always set continuous mode to true - keep listening until manually stopped
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
      }

      recognitionRef.current.start();
      setIsListening(true);
      console.log('🎤 Started listening - will keep listening until manually stopped');
      setStatus('🎤 Listening continuously... Say "Radhe Radhe" to activate');
    } catch (error) {
      console.error('Error starting recognition:', error);
      // Check if it's already started
      if (error.message && error.message.includes('already started')) {
        setStatus('Already listening...');
        setIsListening(true);
      } else {
        setError(`Failed to start voice recognition: ${error.message || 'Unknown error'}`);
      }
    }
  };

  /**
   * Toggle continuous listening mode (now always ON by default)
   */
  const toggleContinuousMode = () => {
    if (!isListening) {
      setError('Please start listening first');
      return;
    }

    // Continuous mode is now always ON
    // This button is just for UI feedback
    setStatus('🔄 Continuous listening is always enabled - will keep listening until you click stop');
    console.log('Continuous mode: Always ON');
  };

  /**
   * Train voice profile - record user's voice saying "Radhe Radhe"
   */
  const trainVoice = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    setIsTraining(true);
    trainingSamplesRef.current = [];
    setStatus('🎤 Training mode: Say "Radhe Radhe" 3 times clearly...');
    setError(null);

    let sampleCount = 0;
    const maxSamples = 3;

    const trainingRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    trainingRecognition.continuous = false;
    trainingRecognition.interimResults = false;
    trainingRecognition.lang = 'hi-IN'; // Use a single, stable language code

    trainingRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const confidence = event.results[0][0].confidence || 0;

      if (transcript.includes('radhe radhe') || transcript.includes('radheradhe')) {
        sampleCount++;
        trainingSamplesRef.current.push({
          transcript,
          confidence,
          timestamp: Date.now()
        });

        setStatus(`✅ Sample ${sampleCount}/${maxSamples} recorded`);

        if (sampleCount >= maxSamples) {
          // Calculate average confidence, duration and create profile
          const avgConfidence = trainingSamplesRef.current.reduce((sum, s) => sum + s.confidence, 0) / trainingSamplesRef.current.length;
          const minConfidence = Math.min(...trainingSamplesRef.current.map(s => s.confidence));

          // Pattern detection
          const usesHindi = trainingSamplesRef.current.some(s => s.transcript.includes('राधे'));

          const profile = {
            minConfidence: Math.max(0.65, minConfidence - 0.05),
            avgConfidence: avgConfidence,
            prefersHindi: usesHindi,
            trainedAt: new Date().toISOString(),
            // Mock duration since trainingRecognition is continuous=false
            avgDuration: 1200
          };

          // Save to localStorage
          localStorage.setItem('voiceProfile', JSON.stringify(profile));
          setVoiceProfile(profile);
          setVoiceAuthEnabled(true);
          setIsTraining(false);
          setStatus(`✅ Voice Identity Locked! Only your voice will be accepted now.`);

          trainingRecognition.stop();
          console.log('✅ Vocal Signature saved:', profile);
        } else {
          // Continue training
          setTimeout(() => {
            trainingRecognition.start();
          }, 1000);
        }
      } else {
        setStatus(`⚠️ Please say "Radhe Radhe" clearly (Sample ${sampleCount}/${maxSamples})`);
        setTimeout(() => {
          trainingRecognition.start();
        }, 1000);
      }
    };

    trainingRecognition.onerror = (event) => {
      console.error('Training error:', event.error);

      if (event.error === 'network') {
        setStatus('⚠️ Network issue. Retrying in 2 seconds...');
        setTimeout(() => {
          if (isTraining) trainingRecognition.start();
        }, 2000);
      } else {
        setStatus(`Training error: ${event.error}. Please try again.`);
        setIsTraining(false);
      }
    };

    trainingRecognition.onend = () => {
      if (sampleCount < maxSamples && isTraining) {
        // Auto-restart if not done
        setTimeout(() => {
          trainingRecognition.start();
        }, 500);
      }
    };

    trainingRecognition.start();
  };

  /**
   * Clear voice profile and disable authentication
   */
  const clearVoiceProfile = () => {
    localStorage.removeItem('voiceProfile');
    setVoiceProfile(null);
    setVoiceAuthEnabled(false);
    setStatus('✅ Voice profile cleared. All voices will be accepted.');
    console.log('Voice profile cleared');
  };

  return (
    <div className="voice-command-container space-y-3">
      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={startListening}
          disabled={isProcessing || isSpeaking}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            flex items-center gap-2 flex-1
            ${isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : isSpeaking
                ? 'bg-green-500 text-white animate-pulse'
                : isProcessing
                  ? 'bg-yellow-500 text-white cursor-not-allowed'
                  : 'bg-blue-accent hover:bg-blue-accent/90 text-white'
            }
          `}
          title={isSpeaking ? 'Speaking response...' : isListening ? 'Click to stop listening' : 'Click to start voice command'}
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Processing...</span>
            </>
          ) : isSpeaking ? (
            <>
              <span className="animate-pulse">🔊</span>
              <span>Radhey Radhey Boss</span>
            </>
          ) : isListening ? (
            <>
              <span className="animate-pulse">🎤</span>
              <span>Listening...</span>
            </>
          ) : (
            <>
              <span>🎤</span>
              <span>Voice Command</span>
            </>
          )}
        </button>

        {isListening && (
          <button
            onClick={toggleContinuousMode}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${continuousMode
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
              }
            `}
            title="Toggle continuous listening mode"
          >
            {continuousMode ? '🔄 ON' : '🔄 OFF'}
          </button>
        )}
      </div>

      {/* Voice Authentication & Noise Filter Controls */}
      <div className="space-y-2">
        {/* Voice Authentication */}
        <div className="flex gap-2 items-center">
          {voiceAuthEnabled ? (
            <>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span>🔒</span>
                <span>Voice Lock: ON</span>
              </div>
              <button
                onClick={clearVoiceProfile}
                className="px-2 py-1 rounded text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                title="Disable voice authentication"
              >
                Disable Lock
              </button>
            </>
          ) : (
            <>
              <div className="text-xs text-yellow-400 flex items-center gap-1">
                <span>🔓</span>
                <span>Voice Lock: OFF</span>
              </div>
              <button
                onClick={trainVoice}
                disabled={isTraining || isListening}
                className="px-2 py-1 rounded text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 disabled:opacity-50"
                title="Train your voice - only your voice will be accepted"
              >
                {isTraining ? 'Training...' : '🔒 Train Voice'}
              </button>
            </>
          )}
        </div>

        {/* Noise Filter Controls */}
        <div className="flex gap-2 items-center">
          <div className="text-xs flex items-center gap-1">
            <span>{noiseFilterEnabled ? '🔇' : '🔊'}</span>
            <span>Noise Filter: {noiseFilterEnabled ? 'ON' : 'OFF'}</span>
          </div>
          <button
            onClick={() => setNoiseFilterEnabled(!noiseFilterEnabled)}
            className={`px-2 py-1 rounded text-xs border ${noiseFilterEnabled
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/50'
              : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border-gray-500/50'
              }`}
            title="Toggle noise filtering"
          >
            {noiseFilterEnabled ? 'Disable' : 'Enable'}
          </button>
          {noiseFilterEnabled && (
            <div className="text-xs text-gray-400">
              Threshold: {(noiseThreshold * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Noise Threshold Slider */}
        {noiseFilterEnabled && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Sensitivity:</label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.1"
              value={noiseThreshold}
              onChange={(e) => setNoiseThreshold(parseFloat(e.target.value))}
              className="flex-1"
              title="Adjust noise filter sensitivity (higher = less sensitive to noise)"
            />
            <span className="text-xs text-gray-400 w-12">
              {noiseThreshold < 0.5 ? 'High' : noiseThreshold < 0.7 ? 'Medium' : 'Low'}
            </span>
          </div>
        )}
      </div>

      {/* Live Transcript Display */}
      {isListening && transcript && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-400">Live Transcript:</div>
            {noiseFilterEnabled && (
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span>🔇</span>
                <span>Noise Filter Active</span>
              </div>
            )}
          </div>
          <div className="text-sm text-white font-mono">
            {transcript}
            <span className="animate-pulse text-blue-400">|</span>
          </div>
          {lastConfidenceRef.current > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Confidence: {(lastConfidenceRef.current * 100).toFixed(0)}%
              {lastConfidenceRef.current < noiseThreshold && noiseFilterEnabled && (
                <span className="text-yellow-400 ml-2">(Filtered)</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detected Command Display */}
      {detectedCommand && (
        <div className={`
          px-3 py-2 rounded-lg text-sm border
          ${detectedCommand.includes('✅')
            ? 'bg-green-500/20 text-green-400 border-green-500/50'
            : detectedCommand.includes('Wake word')
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
          }
        `}>
          {detectedCommand}
        </div>
      )}

      {/* Action Execution Indicator */}
      {isProcessing && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            <div className="flex-1">
              <div className="text-sm text-blue-400 font-medium">Executing Action...</div>
              <div className="text-xs text-blue-300 mt-1">
                Action is being executed automatically. Please wait...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Execution Indicator */}
      {isProcessing && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⚙️</span>
            <div className="flex-1">
              <div className="text-sm text-blue-400 font-medium">Executing Action Automatically...</div>
              <div className="text-xs text-blue-300 mt-1">
                Action is being executed. Dashboard will update automatically.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Display */}
      {(status || error) && (
        <div className={`
          px-3 py-2 rounded text-sm
          ${error
            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
            : status.includes('Executing') || status.includes('🎯')
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : status.includes('✅')
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
          }
        `}>
          {error ? `⚠️ ${error}` : status}
        </div>
      )}

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2">Recent Commands:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {commandHistory.map((item, idx) => (
              <div key={idx} className="text-xs flex items-start gap-2">
                <span className={item.success ? 'text-green-400' : 'text-red-400'}>
                  {item.success ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <div className="text-white">{item.command}</div>
                  <div className="text-gray-400 text-xs">{item.result} • {item.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supported Commands List */}
      {!isListening && !status && !error && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2">💡 Supported Commands:</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div>• "best stock find karo" → Shows best stocks</div>
            <div>• "stock news check kare" → Shows stock news</div>
            <div>• "run analysis" → Runs complete analysis</div>
            <div>• "top 3 banking stocks" → Shows sector ranking</div>
            <div>• "target price" → Shows target prices</div>
            <div>• "risk analysis" → Shows risk analysis</div>
          </div>
          {voiceAuthEnabled && (
            <div className="mt-2 text-xs text-green-400">
              🔒 Voice lock enabled - only your voice will be accepted
            </div>
          )}
          {noiseFilterEnabled && (
            <div className="mt-1 text-xs text-blue-400">
              🔇 Noise filter enabled - background noise will be ignored
            </div>
          )}
        </div>
      )}

      {/* Debug Info - Show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-900/50 rounded">
          <div>🔍 Debug Info:</div>
          <div>Listening: {isListening ? 'Yes' : 'No'}</div>
          <div>Continuous: {continuousMode ? 'Yes' : 'No'}</div>
          <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
          <div>Wake Word: {wakeWordDetected ? 'Detected' : 'Not detected'}</div>
          <div>Recognition: {recognitionRef.current ? 'Initialized' : 'Not initialized'}</div>
        </div>
      )}
    </div>
  );
}

export default VoiceCommand;
