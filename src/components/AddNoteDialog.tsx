import { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NoteType, MediaType, BookFormat } from '@/types';
import { Quote, Lightbulb, HelpCircle, CheckCircle, PenLine, Camera, Mic, Type, Lock, Globe, Wand2, ChevronDown, ChevronUp, Plus, Save, Pencil } from 'lucide-react';
import { ImageCapture } from './ImageCapture';
import { VoiceMemoRecorder } from './VoiceMemoRecorder';
import { AITextActions } from './AITextActions';
import { TagInput } from './TagInput';
import { LocationInput, LocationData, formatLocation } from './LocationInput';
import { inferNoteType, getPlaceholderForType, getTypeStyles } from '@/lib/noteTypeInference';
import { getNotes } from '@/lib/store';
import { useHaptic } from '@/hooks/use-haptic';

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
  }) => string; // Returns note ID
  onUpdateLocation?: (noteId: string, location: string, timestamp?: string) => void;
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

// AI Enhance button component
function AIEnhanceButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="w-full gap-2 touch-manipulation" onClick={onClick}>
      <Wand2 className="w-4 h-4" />
      Enhance
    </Button>
  );
}

// Compact note type selector with "Change" toggle
function NoteTypeSelector({ 
  type, 
  typeManuallySet, 
  onTypeChange 
}: { 
  type: NoteType; 
  typeManuallySet: boolean; 
  onTypeChange: (type: NoteType) => void;
}) {
  const [showChips, setShowChips] = useState(false);
  const currentType = noteTypes.find(t => t.type === type);
  const Icon = currentType?.icon || Lightbulb;

  if (showChips) {
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {noteTypes.map(({ type: t, icon: TypeIcon, label }) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              onTypeChange(t);
              setShowChips(false);
            }}
            className={`${getTypeStyles(t, type === t)} touch-manipulation active:scale-95 transition-transform`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2 touch-manipulation"
          onClick={() => setShowChips(false)}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Type:</span>
      <span className="flex items-center gap-1.5 font-medium">
        <Icon className="w-3.5 h-3.5" />
        {currentType?.label}
        {!typeManuallySet && <span className="text-xs text-muted-foreground">(auto)</span>}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 text-xs px-2 gap-1 touch-manipulation"
        onClick={() => setShowChips(true)}
      >
        <Pencil className="w-3 h-3" />
        Change
      </Button>
    </div>
  );
}

export function AddNoteDialog({ 
  open, 
  onOpenChange, 
  onAdd, 
  onUpdateLocation,
  bookId,
  bookTitle, 
  bookFormat = 'physical',
  initialRecording, 
  initialImage 
}: AddNoteDialogProps) {
  const { success } = useHaptic();
  
  // Flow state: 'capture' or 'bookmark'
  const [step, setStep] = useState<'capture' | 'bookmark'>('capture');
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  
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
  const [isPrivate, setIsPrivate] = useState(true);
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
    setStep('capture');
    setSavedNoteId(null);
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
    
    success();
    
    // Remember location/tags for next note
    setLastLocation(location);
    setLastTags(tags);

    const noteId = onAdd({
      type,
      mediaType: captureMode,
      content: content.trim() || (imageData?.extractedText || audioData?.transcript || 'Voice memo'),
      location: undefined, // Don't include location yet - we'll add it in step 2
      timestamp: undefined,
      context: context.trim() || undefined,
      imageUrl: imageData?.url,
      extractedText: imageData?.extractedText,
      audioUrl: audioData?.url,
      audioDuration: audioData?.duration,
      transcript: audioData?.transcript,
      tags: tags.length > 0 ? tags : undefined,
      isPrivate: !isPrivate ? true : undefined,
    });
    
    if (addAnother) {
      resetForm(true);
    } else {
      // Show bookmark step
      setSavedNoteId(noteId);
      setStep('bookmark');
      setLocation({});
    }
  };

  const handleSaveBookmark = () => {
    if (savedNoteId && onUpdateLocation) {
      const locationString = formatLocation(location);
      if (locationString) {
        onUpdateLocation(savedNoteId, locationString, location.timestamp);
      }
    }
    resetForm();
    onOpenChange(false);
  };

  const handleSkipBookmark = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleTypeChange = (newType: NoteType) => {
    setType(newType);
    setTypeManuallySet(true);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        {step === 'capture' ? (
          <>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle className="flex items-start gap-2 font-display text-lg sm:text-xl min-w-0">
                <PenLine className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="min-w-0 flex-1 leading-tight text-balance">
                  Add note to <span className="text-primary break-words">{bookTitle}</span>
                </span>
              </ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            
            <ResponsiveDialogBody className="space-y-4 pb-6">
              {/* Capture Mode Tabs */}
              <Tabs value={captureMode} onValueChange={(v) => setCaptureMode(v as typeof captureMode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text" className="gap-1.5 touch-manipulation">
                    <Type className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="image" className="gap-1.5 touch-manipulation">
                    <Camera className="w-4 h-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="gap-1.5 touch-manipulation">
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
                          className="min-h-[100px] sm:min-h-[120px] bg-background resize-none text-base"
                          autoFocus
                        />
                      </div>

                      {/* AI Enhance button - only show when there's content */}
                      {content.trim() && (
                        <AIEnhanceButton onClick={() => setShowAIEditor(true)} />
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

              {/* Refinement section - collapsed by default */}
              {hasContent && !showAIEditor && (
                <Collapsible open={showRefine} onOpenChange={setShowRefine}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-between text-muted-foreground hover:text-foreground touch-manipulation"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add details
                        {!showRefine && <span className="text-xs">(type, tags)</span>}
                      </span>
                      {showRefine ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-3">
                    {/* Note Type */}
                    <NoteTypeSelector
                      type={type}
                      typeManuallySet={typeManuallySet}
                      onTypeChange={handleTypeChange}
                    />

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
                          className="text-xs text-muted-foreground hover:text-foreground px-0 touch-manipulation"
                        >
                          Advanced options
                          {showAdvanced ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
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
            </ResponsiveDialogBody>

            {/* Action Buttons */}
            {!showAIEditor && (
              <ResponsiveDialogFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!hasContent}
                    onClick={() => handleSave(true)}
                    className="flex-1 gap-1.5 touch-manipulation h-11"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Save & add another</span>
                    <span className="sm:hidden">+ Another</span>
                  </Button>
                  <Button 
                    type="button"
                    disabled={!hasContent}
                    onClick={() => handleSave(false)}
                    className="flex-1 gap-1.5 touch-manipulation h-11"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { resetForm(); onOpenChange(false); }}
                  className="w-full h-10 text-muted-foreground"
                >
                  Cancel
                </Button>
              </ResponsiveDialogFooter>
            )}
          </>
        ) : (
          /* Step 2: Bookmark */
          <>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle className="flex items-center gap-2 font-display text-lg sm:text-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Note saved!
              </ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            
            <ResponsiveDialogBody className="space-y-4 pb-6">
              <p className="text-sm text-muted-foreground">
                Where in the book is this from? (optional)
              </p>
              <LocationInput
                value={location}
                onChange={setLocation}
                bookFormat={bookFormat}
                compact={false}
              />
            </ResponsiveDialogBody>

            <ResponsiveDialogFooter>
              <div className="flex gap-2 w-full">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleSkipBookmark}
                  className="flex-1 h-11 touch-manipulation"
                >
                  Skip
                </Button>
                <Button 
                  type="button"
                  onClick={handleSaveBookmark}
                  className="flex-1 gap-1.5 touch-manipulation h-11"
                >
                  <Save className="w-4 h-4" />
                  Done
                </Button>
              </div>
            </ResponsiveDialogFooter>
          </>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
