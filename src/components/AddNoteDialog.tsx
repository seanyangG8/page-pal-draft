import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteType, MediaType } from '@/types';
import { Quote, Lightbulb, HelpCircle, CheckCircle, PenLine, Camera, Mic, Clock, X, Image, Type } from 'lucide-react';
import { ImageCapture } from './ImageCapture';
import { VoiceMemoRecorder } from './VoiceMemoRecorder';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (note: { 
    type: NoteType; 
    mediaType: MediaType;
    content: string; 
    location?: string; 
    context?: string;
    timestamp?: string;
    imageUrl?: string;
    extractedText?: string;
    audioUrl?: string;
    audioDuration?: number;
    tags?: string[];
  }) => void;
  bookTitle: string;
  isAudiobook?: boolean;
}

const noteTypes: { type: NoteType; icon: typeof Quote; label: string }[] = [
  { type: 'quote', icon: Quote, label: 'Quote' },
  { type: 'idea', icon: Lightbulb, label: 'Idea' },
  { type: 'question', icon: HelpCircle, label: 'Question' },
  { type: 'action', icon: CheckCircle, label: 'Action' },
];

export function AddNoteDialog({ open, onOpenChange, onAdd, bookTitle, isAudiobook }: AddNoteDialogProps) {
  const [captureMode, setCaptureMode] = useState<'text' | 'image' | 'audio'>('text');
  const [type, setType] = useState<NoteType>('quote');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [context, setContext] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imageData, setImageData] = useState<{ url: string; extractedText?: string } | null>(null);
  const [audioData, setAudioData] = useState<{ url: string; duration: number } | null>(null);

  const resetForm = () => {
    setType('quote');
    setCaptureMode('text');
    setContent('');
    setLocation('');
    setTimestamp('');
    setContext('');
    setTagsInput('');
    setImageData(null);
    setAudioData(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasContent = content.trim() || imageData || audioData;
    if (!hasContent) return;
    
    const tags = tagsInput.trim() 
      ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      : undefined;

    onAdd({
      type,
      mediaType: captureMode,
      content: content.trim() || (imageData?.extractedText || audioData ? 'Voice memo' : ''),
      location: location.trim() || undefined,
      timestamp: timestamp.trim() || undefined,
      context: context.trim() || undefined,
      imageUrl: imageData?.url,
      extractedText: imageData?.extractedText,
      audioUrl: audioData?.url,
      audioDuration: audioData?.duration,
      tags,
    });
    
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <PenLine className="w-5 h-5 text-primary" />
            Add note to <span className="text-primary">{bookTitle}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Capture mode tabs */}
          <Tabs value={captureMode} onValueChange={(v) => setCaptureMode(v as typeof captureMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="gap-1.5">
                <Type className="w-4 h-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-1.5">
                <Camera className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="audio" className="gap-1.5">
                <Mic className="w-4 h-4" />
                Voice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              {/* Note type selector */}
              <div className="space-y-2">
                <Label>Note type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {noteTypes.map(({ type: t, icon: Icon, label }) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                        type === t 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  {type === 'quote' ? 'The passage' : type === 'question' ? 'Your question' : 'Your note'}
                </Label>
                <Textarea
                  id="content"
                  placeholder={type === 'quote' ? 'Type or paste the quote...' : 'Write your note...'}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] bg-background resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-4">
              <ImageCapture 
                onCapture={setImageData}
                capturedImage={imageData}
                onClear={() => setImageData(null)}
              />
              {imageData && (
                <div className="mt-4 space-y-2">
                  <Label>Note type</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {noteTypes.map(({ type: t, icon: Icon, label }) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          type === t 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="audio" className="mt-4">
              <VoiceMemoRecorder 
                onRecordingComplete={setAudioData}
                recordedAudio={audioData}
                onClear={() => setAudioData(null)}
              />
              {audioData && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Note type</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {noteTypes.map(({ type: t, icon: Icon, label }) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                            type === t 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audio-note">Additional notes (optional)</Label>
                    <Textarea
                      id="audio-note"
                      placeholder="Add a text note about this voice memo..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[60px] bg-background resize-none"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Location / Timestamp */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="location">
                {isAudiobook ? 'Chapter' : 'Location'}
              </Label>
              <Input
                id="location"
                placeholder={isAudiobook ? 'Chapter 3' : 'Page 42, Ch. 3...'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-background"
              />
            </div>
            {isAudiobook && (
              <div className="space-y-2">
                <Label htmlFor="timestamp" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Timestamp
                </Label>
                <Input
                  id="timestamp"
                  placeholder="1:23:45"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="bg-background"
                />
              </div>
            )}
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Why it matters (optional)</Label>
            <Input
              id="context"
              placeholder="Brief note on why you're saving this..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="motivation, chapter-1, important..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!(content.trim() || imageData || audioData)}
            >
              Save note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
