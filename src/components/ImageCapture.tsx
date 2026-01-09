import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X, Pencil, Type, RotateCcw, FileText, Check } from 'lucide-react';

interface ImageCaptureProps {
  onCapture: (data: { url: string; extractedText?: string }) => void;
  capturedImage: { url: string; extractedText?: string } | null;
  onClear: () => void;
  onUseAsText?: (text: string) => void;
}

export function ImageCapture({ onCapture, capturedImage, onClear, onUseAsText }: ImageCaptureProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawPaths, setDrawPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onCapture({ url, extractedText: undefined });
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

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawMode) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawMode) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setCurrentPath(prev => [...prev, coords]);
    
    // Draw on canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || currentPath.length < 1) return;
    
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const lastPoint = currentPath[currentPath.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (currentPath.length > 0) {
      setDrawPaths(prev => [...prev, currentPath]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearDrawings = () => {
    setDrawPaths([]);
    setCurrentPath([]);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !capturedImage) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.drawImage(img, 0, 0, canvas!.width, canvas!.height);
    };
    img.src = capturedImage.url;
  };

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
    <div className="space-y-4">
      {/* Image preview with drawing canvas */}
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
          {/* Base image - always behind canvas */}
          <img 
            src={capturedImage.url} 
            alt="Captured" 
            className="w-full h-auto max-h-[300px] object-contain"
            onLoad={(e) => {
              const canvas = canvasRef.current;
              const img = e.currentTarget;
              if (canvas) {
                // Set canvas dimensions to match image
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const maxWidth = 600;
                const width = Math.min(img.naturalWidth, maxWidth);
                const height = width / aspectRatio;
                canvas.width = width;
                canvas.height = height;
              }
            }}
          />
          
          {/* Transparent canvas overlay for drawing */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full ${isDrawMode ? 'cursor-crosshair z-10' : 'pointer-events-none'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        {/* Drawing tools */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2 z-20">
          <Button
            type="button"
            variant={isDrawMode ? 'default' : 'secondary'}
            size="sm"
            className="gap-1.5"
            onClick={() => setIsDrawMode(!isDrawMode)}
          >
            <Pencil className="w-3 h-3" />
            {isDrawMode ? 'Done' : 'Mark up'}
          </Button>
          {isDrawMode && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={clearDrawings}
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Manual text extraction */}
      {showTextInput ? (
        <div className="space-y-2">
          <Textarea
            className="min-h-[80px] bg-background resize-none text-sm"
            placeholder="Type or paste the text from the image..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowTextInput(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSaveText} disabled={!manualText.trim()}>
              <Check className="w-3 h-3 mr-1" />
              Save text
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => setShowTextInput(true)}
        >
          <Type className="w-4 h-4" />
          Add extracted text manually
        </Button>
      )}

      {capturedImage.extractedText && (
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Extracted text:</p>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => {
                  setManualText(capturedImage.extractedText || '');
                  setShowTextInput(true);
                }}
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
              {onUseAsText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onUseAsText(capturedImage.extractedText || '')}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Use as note
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm">{capturedImage.extractedText}</p>
        </div>
      )}
    </div>
  );
}
