import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, RotateCcw } from 'lucide-react';

interface VoiceMemoRecorderProps {
  onRecordingComplete: (data: { url: string; duration: number }) => void;
  recordedAudio: { url: string; duration: number } | null;
  onClear: () => void;
}

export function VoiceMemoRecorder({ onRecordingComplete, recordedAudio, onClear }: VoiceMemoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        onRecordingComplete({ url, duration: recordingTime });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

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
              className="h-12 w-12 rounded-full"
              onClick={playAudio}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <div className="flex-1">
              {/* Waveform visualization placeholder */}
              <div className="h-8 flex items-center gap-0.5">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 rounded-full transition-all"
                    style={{
                      height: `${Math.random() * 100}%`,
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
              className="text-destructive hover:text-destructive"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative">
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'default'}
          size="icon"
          className={`h-20 w-20 rounded-full transition-all ${isRecording ? 'animate-pulse' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Square className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
        {isRecording && (
          <div className="absolute -inset-2 rounded-full border-2 border-destructive animate-ping" />
        )}
      </div>

      <div className="text-center">
        {isRecording ? (
          <>
            <p className="text-2xl font-mono font-medium text-foreground">{formatTime(recordingTime)}</p>
            <p className="text-sm text-muted-foreground mt-1">Recording... Tap to stop</p>
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">Record a voice memo</p>
            <p className="text-sm text-muted-foreground mt-1">Capture your thoughts quickly</p>
          </>
        )}
      </div>
    </div>
  );
}
