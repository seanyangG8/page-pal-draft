import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NoteType, MediaType, BookFormat } from '@/types';
import { Quote, Lightbulb, HelpCircle, CheckCircle, PenLine, Camera, Mic, Type, Lock, Globe, Wand2, ChevronDown, ChevronUp, Sparkles, Plus, Save } from 'lucide-react';
import { ImageCapture } from './ImageCapture';
import { VoiceMemoRecorder } from './VoiceMemoRecorder';
import { AITextActions } from './AITextActions';
import { TagInput } from './TagInput';
import { LocationInput, LocationData, formatLocation } from './LocationInput';
import { inferNoteType, getPlaceholderForType, getTypeStyles } from '@/lib/noteTypeInference';
import { getNotes, getBooks } from '@/lib/store';

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
    transcript?: string;
    tags?: string[];
    isPrivate?: boolean;
  }) => void;
  bookId: string;
  bookTitle: string;
  bookFormat?: BookFormat;
  initialRecording?: { url: string; duration: number; transcript?: string } | null;
  initialImage?: { url: string; extractedText?: string } | null;
}

const noteTypes: { type: NoteType; icon: typeof Quote; label: string }[] = [
  { type: 'quote', icon: Quote, label: 'Quote' },
  { type: 'idea', icon: Lightbulb, label: 'Idea' },
  { type: 'question', icon: HelpCircle, label: 'Question' },
  { type: 'action', icon: CheckCircle, label: 'Action' },
];

export function AddNoteDialog({ 
  open, 
  onOpenChange, 
  onAdd, 
  bookId,
  bookTitle, 
  bookFormat = 'physical',
  initialRecording, 
  initialImage 
}: AddNoteDialogProps) {
  // Core capture state
  const [captureMode, setCaptureMode] = useState<'text' | 'image' | 'audio'>('text');
  const [content, setContent] = useState('');
  const [imageData, setImageData] = useState<{ url: string; extractedText?: string } | null>(null);
  const [audioData, setAudioData] = useState<{ url: string; duration: number; transcript?: string } | null>(null);
  
  // Refine state (optional, shown after capture or on expand)
  const [showRefine, setShowRefine] = useState(false);
  const [type, setType] = useState<NoteType>('idea');
  const [typeManuallySet, setTypeManuallySet] = useState(false);
  const [location, setLocation] = useState<LocationData>({});
  const [context, setContext] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true); // Default OFF (private = true means not public)
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // AI state
  const [showAIEditor, setShowAIEditor] = useState(false);

  // Get existing tags for autocomplete
  const existingTags = useMemo(() => {
    const allNotes = getNotes();
    const tagSet = new Set<string>();
    allNotes.forEach(note => note.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [open]);

  // Get suggested tags for this book
  const suggestedTags = useMemo(() => {
    const bookNotes = getNotes().filter(n => n.bookId === bookId);
    const tagCounts = new Map<string, number>();
    bookNotes.forEach(note => note.tags?.forEach(t => {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }));
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [bookId, open]);

  // Get last used location/tags for "Save & add another"
  const [lastLocation, setLastLocation] = useState<LocationData>({});
  const [lastTags, setLastTags] = useState<string[]>([]);

  // Handle initial recording from floating recorder
  useEffect(() => {
    if (open && initialRecording) {
      setAudioData(initialRecording);
      setCaptureMode('audio');
    }
  }, [open, initialRecording]);

  // Handle initial image from floating camera
  useEffect(() => {
    if (open && initialImage) {
      setImageData(initialImage);
      setCaptureMode('image');
    }
  }, [open, initialImage]);

  // Auto-infer note type as user types (unless manually set)
  useEffect(() => {
    if (!typeManuallySet) {
      const textContent = content || imageData?.extractedText || audioData?.transcript || '';
      if (textContent.trim()) {
        setType(inferNoteType(textContent));
      }
    }
  }, [content, imageData?.extractedText, audioData?.transcript, typeManuallySet]);

  // Auto-set to Quote when OCR yields substantial text
  useEffect(() => {
    if (imageData?.extractedText && imageData.extractedText.length > 50 && !typeManuallySet) {
      setType('quote');
    }
  }, [imageData?.extractedText, typeManuallySet]);

  const resetForm = (keepLocationTags = false) => {
    setCaptureMode('text');
    setContent('');
    setImageData(null);
    setAudioData(null);
    setShowRefine(false);
    setType('idea');
    setTypeManuallySet(false);
    setLocation(keepLocationTags ? lastLocation : {});
    setContext('');
    setTags(keepLocationTags ? lastTags : []);
    setIsPrivate(true);
    setShowAdvanced(false);
    setShowAIEditor(false);
  };

  const hasContent = content.trim() || imageData || audioData;

  const handleSave = (addAnother = false) => {
    if (!hasContent) return;
    
    const locationString = formatLocation(location);
    
    // Remember location/tags for next note
    setLastLocation(location);
    setLastTags(tags);

    onAdd({
      type,
      mediaType: captureMode,
      content: content.trim() || (imageData?.extractedText || audioData?.transcript || 'Voice memo'),
      location: locationString || undefined,
      timestamp: location.timestamp || undefined,
      context: context.trim() || undefined,
      imageUrl: imageData?.url,
      extractedText: imageData?.extractedText,
      audioUrl: audioData?.url,
      audioDuration: audioData?.duration,
      transcript: audioData?.transcript,
      tags: tags.length > 0 ? tags : undefined,
      isPrivate: !isPrivate ? true : undefined, // isPrivate in state means "not public"
    });
    
    if (addAnother) {
      resetForm(true);
    } else {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleTypeChange = (newType: NoteType) => {
    setType(newType);
    setTypeManuallySet(true);
  };

  // Get the main text content for display
  const mainContent = content || imageData?.extractedText || audioData?.transcript || '';

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <PenLine className="w-5 h-5 text-primary" />
            <span className="truncate">Add note to <span className="text-primary">{bookTitle}</span></span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          {/* Step 1: Capture Mode Tabs */}
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

            {/* TEXT CAPTURE */}
            <TabsContent value="text" className="space-y-3 mt-4">
              {showAIEditor && content.trim() ? (
                <AITextActions
                  originalText={content}
                  onTextChange={(text) => {
                    setContent(text);
                    setShowAIEditor(false);
                  }}
                  onBack={() => setShowAIEditor(false)}
                  showBackButton
                />
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-medium">Content</Label>
                    <Textarea
                      id="content"
                      placeholder={getPlaceholderForType(type)}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[120px] bg-background resize-none text-base"
                      autoFocus
                    />
                  </div>

                  {/* AI Enhance button - only show when there's content */}
                  {content.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setShowAIEditor(true)}
                    >
                      <Wand2 className="w-4 h-4" />
                      Enhance with AI
                    </Button>
                  )}
                </>
              )}
            </TabsContent>

            {/* IMAGE CAPTURE */}
            <TabsContent value="image" className="mt-4">
              {showAIEditor && imageData?.extractedText ? (
                <AITextActions
                  originalText={imageData.extractedText}
                  onTextChange={(text) => {
                    setContent(text);
                    setShowAIEditor(false);
                    setCaptureMode('text');
                  }}
                  onBack={() => setShowAIEditor(false)}
                  showBackButton
                />
              ) : (
                <ImageCapture 
                  onCapture={setImageData}
                  capturedImage={imageData}
                  onClear={() => setImageData(null)}
                  onUseAsText={(text) => {
                    setContent(text);
                    setShowAIEditor(true);
                  }}
                />
              )}
            </TabsContent>

            {/* VOICE CAPTURE */}
            <TabsContent value="audio" className="mt-4">
              {showAIEditor && audioData?.transcript ? (
                <AITextActions
                  originalText={audioData.transcript}
                  onTextChange={(text) => {
                    setContent(text);
                    setShowAIEditor(false);
                    setCaptureMode('text');
                  }}
                  onBack={() => setShowAIEditor(false)}
                  showBackButton
                />
              ) : (
                <VoiceMemoRecorder 
                  onRecordingComplete={setAudioData}
                  recordedAudio={audioData}
                  onClear={() => setAudioData(null)}
                  onTranscriptEdit={(transcript) => {
                    if (audioData) {
                      setAudioData({ ...audioData, transcript });
                    }
                  }}
                  onUseAsText={(text) => {
                    setContent(text);
                    setShowAIEditor(true);
                  }}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Note Type - shown as "Change type" chips below content */}
          {hasContent && !showAIEditor && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                {typeManuallySet ? 'Note type' : 'Auto-detected type'} 
                <span className="text-muted-foreground/60">• tap to change</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {noteTypes.map(({ type: t, icon: Icon, label }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={getTypeStyles(t, type === t)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Refine Section - collapsible */}
          {hasContent && !showAIEditor && (
            <Collapsible open={showRefine} onOpenChange={setShowRefine}>
              <CollapsibleTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Refine note (location, tags, context)
                  </span>
                  {showRefine ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-sm">Location</Label>
                  <LocationInput
                    value={location}
                    onChange={setLocation}
                    bookFormat={bookFormat}
                    compact
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-sm">Tags</Label>
                  <TagInput
                    tags={tags}
                    onChange={setTags}
                    existingTags={existingTags}
                    suggestedTags={suggestedTags}
                    placeholder="Add tags..."
                  />
                </div>

                {/* Why it matters */}
                <div className="space-y-2">
                  <Label htmlFor="context" className="text-sm">Why it matters <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="context"
                    placeholder="Brief note on why you're saving this..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="bg-background"
                  />
                </div>

                {/* Advanced section with privacy */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground hover:text-foreground px-0"
                    >
                      Advanced options
                      {showAdvanced ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        {isPrivate ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <Label htmlFor="private-toggle" className="text-sm font-medium cursor-pointer">
                            {isPrivate ? 'Private note' : 'Public note'}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {isPrivate ? 'Only you can see this' : 'Visible on your profile'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="private-toggle"
                        checked={!isPrivate}
                        onCheckedChange={(checked) => setIsPrivate(!checked)}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action Buttons */}
          {!showAIEditor && (
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => { resetForm(); onOpenChange(false); }}
                className="flex-shrink-0"
              >
                Cancel
              </Button>
              <div className="flex-1 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasContent}
                  onClick={() => handleSave(true)}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Save & add another
                </Button>
                <Button 
                  type="button"
                  disabled={!hasContent}
                  onClick={() => handleSave(false)}
                  className="gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
