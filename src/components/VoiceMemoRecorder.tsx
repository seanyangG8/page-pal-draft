import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';

interface VoiceMemoRecorderProps {
  onRecordingComplete: (data: { url: string; duration: number; transcript?: string }) => void;
  recordedAudio: { url: string; duration: number; transcript?: string } | null;
  onClear: () => void;
}

// Check for Web Speech API support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function VoiceMemoRecorder({ onRecordingComplete, recordedAudio, onClear }: VoiceMemoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setLiveTranscript('');
      setFinalTranscript('');

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        const transcript = finalTranscript.trim();
        onRecordingComplete({ url, duration: recordingTime, transcript: transcript || undefined });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      // Start speech recognition if available
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript + ' ';
            } else {
              interim += result[0].transcript;
            }
          }
          
          setFinalTranscript(prev => {
            // Only update if we have new final text
            if (final && !prev.includes(final.trim())) {
              return prev + final;
            }
            return prev;
          });
          setLiveTranscript(interim);
        };

        recognition.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
        };

        recognition.start();
      }

      mediaRecorder.start(100); // Collect data every 100ms for smoother stopping
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [onRecordingComplete, recordingTime, finalTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Stop speech recognition first
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const playAudio = () => {
    if (!recordedAudio) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(recordedAudio.url);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(audioRef.current?.currentTime || 0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleClear = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    setRecordingTime(0);
    setLiveTranscript('');
    setFinalTranscript('');
    onClear();
  };

  if (recordedAudio) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full flex-shrink-0"
              onClick={playAudio}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <div className="flex-1 min-w-0">
              {/* Waveform visualization placeholder */}
              <div className="h-8 flex items-center gap-0.5">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 rounded-full transition-all"
                    style={{
                      height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 50}%`,
                      opacity: playbackTime / recordedAudio.duration > i / 40 ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(recordedAudio.duration)}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive flex-shrink-0"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Show transcript if available */}
          {recordedAudio.transcript && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Transcribed:</p>
              <p className="text-sm text-foreground">{recordedAudio.transcript}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const displayTranscript = finalTranscript + liveTranscript;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative">
        <button
          type="button"
          className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
              : 'bg-primary hover:bg-primary/90'
          }`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Square className="w-8 h-8 text-destructive-foreground" />
          ) : (
            <Mic className="w-8 h-8 text-primary-foreground" />
          )}
        </button>
        {isRecording && (
          <div className="absolute -inset-2 rounded-full border-2 border-destructive animate-ping pointer-events-none" />
        )}
      </div>

      <div className="text-center w-full max-w-sm">
        {isRecording ? (
          <>
            <p className="text-2xl font-mono font-medium text-foreground">{formatTime(recordingTime)}</p>
            <p className="text-sm text-muted-foreground mt-1">Recording... Tap to stop</p>
            
            {/* Live transcript preview */}
            {(displayTranscript || SpeechRecognition) && (
              <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border/50 text-left min-h-[60px]">
                <p className="text-xs text-muted-foreground mb-1">
                  {SpeechRecognition ? 'Live transcription:' : 'Transcription not available in this browser'}
                </p>
                {displayTranscript ? (
                  <p className="text-sm text-foreground">
                    {finalTranscript}
                    <span className="text-muted-foreground">{liveTranscript}</span>
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Start speaking...</p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">Record a voice memo</p>
            <p className="text-sm text-muted-foreground mt-1">Capture your thoughts quickly</p>
            {!SpeechRecognition && (
              <p className="text-xs text-amber-600 mt-2">
                Live transcription not supported in this browser
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
