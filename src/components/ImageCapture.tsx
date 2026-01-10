import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Highlighter, Type, RotateCcw, Check, Wand2, Square, Copy, Plus } from 'lucide-react';

interface ImageCaptureProps {
  onCapture: (data: { url: string; extractedText?: string }) => void;
  capturedImage: { url: string; extractedText?: string } | null;
  onClear: () => void;
  onUseAsText?: (text: string) => void;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCapture({ onCapture, capturedImage, onClear, onUseAsText }: ImageCaptureProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selections, setSelections] = useState<SelectionRect[]>([]);
  const [currentSelection, setCurrentSelection] = useState<SelectionRect | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onCapture({ url, extractedText: undefined });
      setSelections([]);
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onCapture({ url, extractedText: undefined });
      setSelections([]);
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelectMode) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsSelecting(true);
    setStartPoint(coords);
    setCurrentSelection({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const updateSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelecting || !isSelectMode || !startPoint) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    
    setCurrentSelection({
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y),
    });
  };

  const endSelection = () => {
    if (currentSelection && currentSelection.width > 10 && currentSelection.height > 10) {
      setSelections(prev => [...prev, currentSelection]);
    }
    setIsSelecting(false);
    setCurrentSelection(null);
    setStartPoint(null);
  };

  const clearSelections = () => {
    setSelections([]);
    setCurrentSelection(null);
  };

  // Draw selections on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !capturedImage) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      
      // Draw all saved selections as highlights
      [...selections, currentSelection].filter(Boolean).forEach(sel => {
        if (!sel) return;
        // Yellow highlight overlay
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.fillRect(sel.x, sel.y, sel.width, sel.height);
        // Border
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(sel.x, sel.y, sel.width, sel.height);
        ctx.setLineDash([]);
      });
    };
    img.src = capturedImage.url;
  }, [capturedImage, selections, currentSelection]);

  const handleSaveText = () => {
    if (capturedImage && manualText.trim()) {
      onCapture({ ...capturedImage, extractedText: manualText.trim() });
      setShowTextInput(false);
    }
  };

  if (!capturedImage) {
    return (
      <div 
        className="border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors hover:border-primary/50 cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Capture or upload an image</p>
            <p className="text-sm text-muted-foreground mt-1">
              Take a photo of a book page or upload a screenshot
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" className="gap-2">
              <Camera className="w-4 h-4" />
              Take photo
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instruction text */}
      <p className="text-sm text-muted-foreground text-center">
        Drag to select the text you want to save
      </p>

      {/* Image preview with selection canvas */}
      <div className="relative rounded-xl overflow-hidden bg-secondary">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-20 bg-background/80 hover:bg-background"
          onClick={onClear}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="relative">
          {/* Base image */}
          <img 
            ref={imageRef}
            src={capturedImage.url} 
            alt="Captured" 
            className="w-full h-auto max-h-[300px] object-contain"
            onLoad={(e) => {
              const canvas = canvasRef.current;
              const img = e.currentTarget;
              if (canvas) {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const maxWidth = 600;
                const width = Math.min(img.naturalWidth, maxWidth);
                const height = width / aspectRatio;
                canvas.width = width;
                canvas.height = height;
              }
            }}
          />
          
          {/* Selection canvas overlay */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full ${isSelectMode ? 'cursor-crosshair z-10' : 'pointer-events-none'}`}
            onMouseDown={startSelection}
            onMouseMove={updateSelection}
            onMouseUp={endSelection}
            onMouseLeave={endSelection}
            onTouchStart={startSelection}
            onTouchMove={updateSelection}
            onTouchEnd={endSelection}
          />
        </div>
        
        {/* Selection tools */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2 z-20">
          <Button
            type="button"
            variant={isSelectMode ? 'default' : 'secondary'}
            size="sm"
            className="gap-1.5"
            onClick={() => setIsSelectMode(!isSelectMode)}
          >
            <Highlighter className="w-3 h-3" />
            {isSelectMode ? 'Done' : 'Select text to extract'}
          </Button>
          {selections.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={clearSelections}
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Selection hint */}
      {isSelectMode && selections.length === 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Draw a rectangle around the text you want to capture
        </p>
      )}

      {/* Selection count indicator */}
      {selections.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Square className="w-4 h-4 text-amber-500" />
          <span>{selections.length} region{selections.length > 1 ? 's' : ''} selected</span>
        </div>
      )}

      {/* Extracted text section - always show input when we have selections or text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Extracted text</Label>
          {capturedImage.extractedText && (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                onClick={() => setShowTextInput(true)}
              >
                <RotateCcw className="w-3 h-3" />
                Re-extract
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                onClick={() => navigator.clipboard.writeText(capturedImage.extractedText || '')}
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
              {selections.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2 gap-1"
                  onClick={() => {
                    const currentText = manualText || capturedImage.extractedText || '';
                    setManualText(currentText + '\n\n[Selection ' + (selections.length) + ']');
                    setShowTextInput(true);
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Append
                </Button>
              )}
            </div>
          )}
        </div>
        
        {showTextInput || !capturedImage.extractedText ? (
          <>
            <Textarea
              className="min-h-[80px] bg-background resize-none text-sm"
              placeholder="Type or paste the text from the image..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
            <div className="flex gap-2">
              {capturedImage.extractedText && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowTextInput(false)}>
                  Cancel
                </Button>
              )}
              <Button type="button" size="sm" onClick={handleSaveText} disabled={!manualText.trim()}>
                <Check className="w-3 h-3 mr-1" />
                Save text
              </Button>
            </div>
          </>
        ) : (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <Textarea
              className="min-h-[60px] bg-transparent resize-none text-sm border-0 p-0 focus-visible:ring-0"
              value={capturedImage.extractedText}
              onChange={(e) => onCapture({ ...capturedImage, extractedText: e.target.value })}
            />
            {onUseAsText && (
              <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => onUseAsText(capturedImage.extractedText || '')}
                >
                  <Wand2 className="w-3 h-3" />
                  Enhance with AI
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
