import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingRecorderProps {
  onRecordingComplete: (data: { url: string; duration: number; transcript?: string }) => void;
  className?: string;
}

// Check for Web Speech API support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function FloatingRecorder({ onRecordingComplete, className }: FloatingRecorderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
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
        
        // Reset state
        setIsExpanded(false);
        setRecordingTime(0);
        setLiveTranscript('');
        setFinalTranscript('');
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

      mediaRecorder.start(100);
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

  const handleCancel = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsRecording(false);
    setIsExpanded(false);
    setRecordingTime(0);
    setLiveTranscript('');
    setFinalTranscript('');
    audioChunksRef.current = [];
  };

  const handleExpand = () => {
    setIsExpanded(true);
    startRecording();
  };

  const displayTranscript = finalTranscript + liveTranscript;

  // Collapsed state - just the mic button
  if (!isExpanded) {
    return (
      <Button
        onClick={handleExpand}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105",
          className
        )}
      >
        <Mic className="w-6 h-6" />
      </Button>
    );
  }

  // Expanded recording state
  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-2xl shadow-xl p-4 w-72 animate-in fade-in zoom-in-95 duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isRecording ? "bg-destructive animate-pulse" : "bg-muted"
          )} />
          <span className="font-mono font-medium text-lg">{formatTime(recordingTime)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={handleCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Live transcript preview */}
      <div className="min-h-[60px] max-h-[100px] overflow-y-auto mb-4 p-2 rounded-lg bg-secondary/50 text-sm">
        {displayTranscript ? (
          <p className="text-foreground">
            {finalTranscript}
            <span className="text-muted-foreground">{liveTranscript}</span>
            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
          </p>
        ) : (
          <p className="text-muted-foreground italic">
            {SpeechRecognition ? 'Start speaking...' : 'Recording...'}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={handleCancel}
        >
          <X className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full",
            isRecording ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Square className="w-6 h-6 fill-current" />
          ) : (
            <Check className="w-6 h-6" />
          )}
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-3">
        {isRecording ? 'Tap stop when done' : 'Recording stopped'}
      </p>
    </div>
  );
}