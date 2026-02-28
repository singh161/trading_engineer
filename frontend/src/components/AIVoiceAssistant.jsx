import React, { useState, useEffect, useRef } from 'react';
import { executeVoiceAction } from '../services/voiceActionExecutor';
import api from '../services/api';

/**
 * AIVoiceAssistant Component
 * 
 * A Google Assistant-like voice interface that:
 * - Listens for "Radhe Radhe" wake word
 * - Showcases a beautiful animation when active
 * - Supports Hinglish/Hindi commands
 * - Executes real actions in the trading app
 */
function AIVoiceAssistant({ appState, isOpen, onClose }) {
    const [voiceProfile, setVoiceProfile] = useState(null);
    const [isTraining, setIsTraining] = useState(false);
    const [voiceAuthEnabled, setVoiceAuthEnabled] = useState(false);
    const [status, setStatus] = useState('Listening for "Radhe Radhe"...');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [recognitionError, setRecognitionError] = useState(null);

    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef('');
    const timeoutRef = useRef(null);
    const lastConfidenceRef = useRef(0);
    const wakeWordTriggeredRef = useRef(false);
    const isComponentMounted = useRef(true);

    // Load voice profile on mount
    useEffect(() => {
        isComponentMounted.current = true;
        const storedProfile = localStorage.getItem('voiceProfile');
        if (storedProfile) {
            try {
                const profile = JSON.parse(storedProfile);
                setVoiceProfile(profile);
                setVoiceAuthEnabled(true);
            } catch (e) {
                console.error('Error loading voice profile:', e);
            }
        }
        return () => { isComponentMounted.current = false; };
    }, []);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setRecognitionError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => {
            console.log('🎙️ Background Voice Listener Active');
            setIsListening(true);
            setRecognitionError(null);
        };

        recognition.onresult = (event) => {
            let currentInterim = '';
            let maxConfidence = 0;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptSegment = event.results[i][0].transcript;
                const confidence = event.results[i][0].confidence || 0;
                maxConfidence = Math.max(maxConfidence, confidence);
                lastConfidenceRef.current = maxConfidence;

                const lowerTranscript = transcriptSegment.toLowerCase();

                // Wake word variations
                const hasWakeWord =
                    lowerTranscript.includes('radhe radhe') ||
                    lowerTranscript.includes('राधे राधे') ||
                    lowerTranscript.includes('radhey radhey') ||
                    lowerTranscript.includes('radhe radhe.') ||
                    lowerTranscript.includes('hello commander');

                if (event.results[i].isFinal) {
                    finalTranscriptRef.current += transcriptSegment + ' ';
                    setTranscript(finalTranscriptRef.current);

                    if (hasWakeWord) {
                        handleWakeWord(maxConfidence, lowerTranscript);
                    } else if (wakeWordTriggeredRef.current || isOpen) {
                        handleCommand(transcriptSegment);
                    }
                } else {
                    currentInterim += transcriptSegment;
                    // Trigger on interim for faster response
                    if (hasWakeWord) {
                        handleWakeWord(maxConfidence, lowerTranscript);
                    }
                }
            }
            setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setRecognitionError('Microphone access denied. Please enable it in browser settings.');
            } else if (event.error === 'network') {
                setRecognitionError('Network error. Check your connection.');
            }
        };

        recognition.onend = () => {
            console.log('Voice recognition ended.');
            if (isComponentMounted.current) {
                // Only restart if we're still supposed to be listening
                console.log('Restarting voice recognition...');
                setTimeout(() => {
                    try {
                        if (isComponentMounted.current && recognitionRef.current) {
                            recognitionRef.current.start();
                        }
                    } catch (e) {
                        // Probably already started
                    }
                }, 300);
            }
        };

        recognitionRef.current = recognition;

        // Attempt to start - wrap in try to avoid crash on blocked autoplay
        try {
            recognition.start();
        } catch (e) {
            console.warn('Speech recognition failed to start automatically:', e);
        }

        return () => {
            isComponentMounted.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const verifyVoice = (confidence, transcript) => {
        if (!voiceAuthEnabled || !voiceProfile) return true;

        // Skip verification if confidence is 0 (interim) but only if it matches very closely
        if (confidence === 0) return true;

        const minConfidence = voiceProfile.minConfidence || 0.6;
        if (confidence < minConfidence) {
            console.log('❌ Voice trace: Confidence too low', confidence);
            return false;
        }

        const hasHindi = transcript.includes('राधे') || transcript.includes('राधेश्याम');
        if (voiceProfile.prefersHindi && !hasHindi && (transcript.includes('radhe') || transcript.includes('radhey'))) {
            console.log('❌ Voice trace: Dialect mismatch');
            return false;
        }

        return true;
    };

    const handleWakeWord = (confidence, text) => {
        if (wakeWordTriggeredRef.current) return;

        if (voiceAuthEnabled && !verifyVoice(confidence, text)) {
            console.log('🛑 Unauthorized voice detected');
            setStatus('🔒 Voice not recognized');
            return;
        }

        wakeWordTriggeredRef.current = true;

        if (appState.setShowVoiceCommand) {
            appState.setShowVoiceCommand(true);
        }

        setStatus('Radhe Radhe! Main aapki kaise madad kar sakta hoon?');
        speak('Radhey Radhey Boss, How can I help you?');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!isProcessing) setStatus('Listening for command...');
        }, 3000);
    };

    const trainVoiceIdentity = () => {
        setIsTraining(true);
        setStatus('🎤 Training: Please say "Radhe Radhe" 3 times clearly...');

        const samples = [];
        const trainingRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        trainingRecognition.lang = 'hi-IN';
        trainingRecognition.continuous = false;

        trainingRecognition.onresult = (event) => {
            const text = event.results[0][0].transcript.toLowerCase();
            const confidence = event.results[0][0].confidence;

            if (text.includes('radhe') || text.includes('राधे')) {
                samples.push({ confidence, hasHindi: text.includes('राधे') });
                setStatus(`✅ Sample ${samples.length}/3 recorded`);

                if (samples.length >= 3) {
                    const avgConf = samples.reduce((a, b) => a + b.confidence, 0) / 3;
                    const profile = {
                        minConfidence: Math.max(0.5, avgConf - 0.1),
                        prefersHindi: samples.filter(s => s.hasHindi).length >= 2,
                        trainedAt: new Date().toISOString()
                    };
                    localStorage.setItem('voiceProfile', JSON.stringify(profile));
                    setVoiceProfile(profile);
                    setVoiceAuthEnabled(true);
                    setIsTraining(false);
                    setStatus('✅ Voice Identity Locked!');
                    speak('Voice identity locked successfully.');

                    // Reset wake word flag so we can use it now
                    wakeWordTriggeredRef.current = false;
                } else {
                    setTimeout(() => trainingRecognition.start(), 1000);
                }
            } else {
                setStatus('⚠️ Please say "Radhe Radhe" clearly');
                setTimeout(() => trainingRecognition.start(), 1000);
            }
        };

        trainingRecognition.onerror = () => {
            setIsTraining(false);
            setStatus('❌ Training failed. Try again.');
        };

        trainingRecognition.start();
    };

    const toggleVoiceLock = () => {
        if (voiceAuthEnabled) {
            setVoiceAuthEnabled(false);
            localStorage.removeItem('voiceProfile');
            setVoiceProfile(null);
            setStatus('🔓 Voice Lock Disabled');
        } else {
            trainVoiceIdentity();
        }
    };

    const handleCommand = async (commandText) => {
        if (!commandText || commandText.trim().length < 2) return;

        // Filter out wake word
        const variations = [/radhe radhe/gi, /राधे राधे/gi, /radhey radhey/gi, /hello commander/gi];
        let cleanCommand = commandText;
        variations.forEach(r => { cleanCommand = cleanCommand.replace(r, ''); });
        cleanCommand = cleanCommand.trim();

        if (!cleanCommand) return;

        setIsProcessing(true);
        setStatus(`Processing: "${cleanCommand}"...`);

        try {
            const response = await api.post('/ai/voice-command', { command: cleanCommand });
            const actionResponse = response.data;

            if (actionResponse.action === 'ERROR') {
                setStatus(actionResponse.params?.message || 'I didn\'t understand that.');
                speak('Sorry, I couldn\'t understand that.');
            } else {
                setStatus(`Executing: ${actionResponse.action.replace(/_/g, ' ')}`);
                const result = await executeVoiceAction(actionResponse, appState);

                if (result.success) {
                    setStatus('✅ Task completed successfully');
                    speak(result.message || 'Done!');

                    // Auto close after success
                    setTimeout(() => {
                        onClose();
                    }, 3000);
                } else {
                    setStatus(`❌ ${result.message}`);
                    speak('Something went wrong.');
                }
            }
        } catch (error) {
            console.error('Command processing error:', error);
            setStatus('Failed to connect to server');
        } finally {
            setIsProcessing(false);
            wakeWordTriggeredRef.current = false;
            finalTranscriptRef.current = '';
        }
    };

    const speak = (text) => {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Use an Indian accent if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('hi')) ||
            voices.find(v => v.lang.includes('en-IN')) ||
            voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.lang = preferredVoice.lang;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/40 backdrop-blur-sm transition-all duration-300">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl mx-auto bg-dark-card border-t border-white/10 rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-500">
                {/* Handle */}
                <div className="w-12 h-1.5 bg-gray-600/50 rounded-full mx-auto mb-6" />

                <div className="flex flex-col items-center space-y-8 py-4">
                    {/* Status and Transcript */}
                    <div className="text-center space-y-2 px-4 max-w-lg w-full">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h2 className={`text-xl font-semibold transition-all duration-300 ${isSpeaking ? 'text-blue-400' : 'text-dark-text'}`}>
                                {status}
                            </h2>
                            <button
                                onClick={toggleVoiceLock}
                                className={`p-1.5 rounded-full transition-all ${voiceAuthEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400 opacity-50 hover:opacity-100'}`}
                                title={voiceAuthEnabled ? 'Voice Lock Active' : 'Enable Voice Lock'}
                            >
                                {voiceAuthEnabled ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                )}
                            </button>
                        </div>

                        {recognitionError ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-2">
                                <p className="text-sm text-red-400">{recognitionError}</p>
                                <button
                                    onClick={() => {
                                        try { recognitionRef.current?.start(); } catch (e) { }
                                    }}
                                    className="mt-2 text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-all font-bold"
                                >
                                    START MICROPHONE
                                </button>
                            </div>
                        ) : (
                            <div className="min-h-[1.5rem]">
                                {isTraining ? (
                                    <div className="flex justify-center space-x-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-2 h-2 rounded-full ${i <= (voiceProfile ? 3 : 0) ? 'bg-green-500' : 'bg-gray-600 animate-pulse'}`} />
                                        ))}
                                    </div>
                                ) : interimTranscript ? (
                                    <p className="text-lg text-dark-text-secondary italic">
                                        "{interimTranscript}"
                                    </p>
                                ) : transcript ? (
                                    <p className="text-lg text-blue-400/80">
                                        {transcript.split(' ').slice(-5).join(' ')}
                                    </p>
                                ) : (
                                    <p className="text-sm text-dark-text-secondary">
                                        {voiceAuthEnabled ? '🔒 Only your voice is accepted' : 'Try saying "Radhe Radhe, find best stocks"'}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Google Style Voice Animation */}
                    <div className="flex items-center justify-center h-20">
                        {isProcessing || isTraining ? (
                            <div className="flex space-x-3">
                                <div className="voice-dot voice-dot-blue !w-4 !h-4" />
                                <div className="voice-dot voice-dot-red !w-4 !h-4" />
                                <div className="voice-dot voice-dot-yellow !w-4 !h-4" />
                                <div className="voice-dot voice-dot-green !w-4 !h-4" />
                            </div>
                        ) : isListening ? (
                            <div className="flex items-center space-x-1.5 h-16">
                                <div className="voice-wave-bar voice-wave-1 !w-2" />
                                <div className="voice-wave-bar voice-wave-2 !w-2" />
                                <div className="voice-wave-bar voice-wave-3 !w-2" />
                                <div className="voice-wave-bar voice-wave-4 !w-2" />
                                <div className="voice-wave-bar voice-wave-2 !w-2" />
                                <div className="voice-wave-bar voice-wave-1 !w-2" />
                            </div>
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-blue-500 opacity-50" />
                        )}
                    </div>

                    {/* Quick Actions Support */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
                        {['Best Stocks', 'Check News', 'Run Analysis', 'Market Trend'].map(cmd => (
                            <button
                                key={cmd}
                                onClick={() => handleCommand(cmd)}
                                disabled={isProcessing || isTraining}
                                className="px-5 py-2.5 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-sm text-dark-text-secondary hover:text-white transition-all backdrop-blur-md disabled:opacity-30"
                            >
                                {cmd}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-dark-border text-dark-text-secondary"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default AIVoiceAssistant;
