
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from '@/components/ui/use-toast';
import {
  Camera,
  Upload,
  X,
  RotateCcw,
  Highlighter,
  Square,
  Copy,
  MoreVertical,
  Type,
  Undo2,
} from 'lucide-react';

interface ImageCaptureProps {
  onCapture: (data: { url: string; extractedText?: string }) => void;
  capturedImage: { url: string; extractedText?: string } | null;
  onClear: () => void;
  onUseAsText?: (text: string) => void;
  onRequestOCR?: (base64: string, mimeType?: string, instruction?: string) => Promise<string | undefined>;
}

type Point = { x: number; y: number }; // normalized (0..1) in canvas space
type Stroke = {
  points: Point[];
  lineWidth: number;
  bbox: { minX: number; minY: number; maxX: number; maxY: number }; // normalized
};
type SelectionRect = { x: number; y: number; width: number; height: number }; // normalized

const ENABLE_REFINEMENT_DEBUG = true;
const REFINEMENT_CONFIG = {
  thresholding: 'adaptive' as const,
  fixedThreshold: 165,
  adaptiveOffset: 18,
  contrast: 1.15,
  denoise: true,
  denoiseMinNeighbors: 2,
  strokePadMultiplier: 0.5,
  inkPaddingPx: 4,
  verticalPaddingPx: 4,
  horizontalPaddingPx: 4,
  bandWindowPadPx: 12,
  smoothingWindow: 5,
  peakRelativeThreshold: 0.18,
  peakStdMultiplier: 0.6,
  maxPeakCoverage: 0.6,
  minLineHeightPx: 6,
  minInkPerRow: 8,
  maxExpansionPx: 6,
  minRectWidthPx: 20,
  minRectHeightPx: 14,
  minInkCoverage: 0.002,
  lineOverlapRatio: 0.3,
  lineOverlapMinPx: 10,
  smallStrokeHeightRatio: 0.8,
  smallStrokeMaxPx: 16,
  wordRoiPadPx: 10,
  minComponentPixels: 12,
  minBandStrokeRatio: 0.18,
  minBandStrokePoints: 3,
};

const MAX_OCR_RECTS = 5;
const OCR_STRICT_INSTRUCTION =
  'Extract ONLY text that is visible (non-white) in the image. Do NOT guess missing words. Return exactly what you can see. If text is partial, return partial.';

export function ImageCapture({
  onCapture,
  capturedImage,
  onClear,
  onUseAsText,
  onRequestOCR,
}: ImageCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [mode, setMode] = useState<'highlight' | 'select' | 'text'>('text');
  const [size, setSize] = useState(12); // px thickness
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<Point | null>(null);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsText, setResultsText] = useState('');
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'full' | 'highlight' | 'select' | null>(null);

  const debugRectsRef = useRef<{
    initial?: SelectionRect;
    tightened?: SelectionRect;
    refined?: SelectionRect;
    window?: SelectionRect;
    roi?: SelectionRect;
    wordBox?: SelectionRect;
    bands?: Array<{ start: number; end: number }>;
    included?: Array<{ start: number; end: number }>;
  } | null>(null);

  const sizePresets = [
    { label: 'S', value: 8 },
    { label: 'M', value: 12 },
    { label: 'L', value: 18 },
  ];

  const hasHighlights = strokes.length > 0;
  const hasSelection = !!selectionRect && selectionRect.width > 0 && selectionRect.height > 0;

  const stripCodeFences = (value: string) =>
    value.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();

  const extractTextFromJsonLike = (value: string) => {
    const match = value.match(/"text"\s*:\s*"([\s\S]*?)"\s*(?:,|})/);
    if (!match) return '';
    return match[1]
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .trim();
  };

  const normalizeExtractedText = (value?: string) => {
    if (!value) return '';
    const cleaned = stripCodeFences(value);
    if (!cleaned) return '';
    if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object' && typeof parsed.text === 'string') {
          return parsed.text.trim();
        }
      } catch {
        const fallback = extractTextFromJsonLike(cleaned);
        if (fallback) return fallback;
        return '';
      }
    }
    return cleaned.trim();
  };

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const rectFromBounds = (minX: number, minY: number, maxX: number, maxY: number): SelectionRect => ({
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  });
  const clampRectToUnit = (rect: SelectionRect): SelectionRect => ({
    x: clamp(rect.x, 0, 1),
    y: clamp(rect.y, 0, 1),
    width: clamp(rect.width, 0, 1 - clamp(rect.x, 0, 1)),
    height: clamp(rect.height, 0, 1 - clamp(rect.y, 0, 1)),
  });

  const normalizedToImageRect = (rect: SelectionRect, img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const scaleX = img.naturalWidth / (canvas.width || img.naturalWidth);
    const scaleY = img.naturalHeight / (canvas.height || img.naturalHeight);
    return {
      x: rect.x * canvas.width * scaleX,
      y: rect.y * canvas.height * scaleY,
      width: rect.width * canvas.width * scaleX,
      height: rect.height * canvas.height * scaleY,
    };
  };

  const imageToNormalizedRect = (rect: { x: number; y: number; width: number; height: number }, img: HTMLImageElement) => ({
    x: rect.x / img.naturalWidth,
    y: rect.y / img.naturalHeight,
    width: rect.width / img.naturalWidth,
    height: rect.height / img.naturalHeight,
  });

  const clampRectToBounds = (
    rect: { x: number; y: number; width: number; height: number },
    bounds: { x: number; y: number; width: number; height: number },
  ) => {
    const left = clamp(rect.x, bounds.x, bounds.x + bounds.width);
    const top = clamp(rect.y, bounds.y, bounds.y + bounds.height);
    const right = clamp(rect.x + rect.width, bounds.x, bounds.x + bounds.width);
    const bottom = clamp(rect.y + rect.height, bounds.y, bounds.y + bounds.height);
    return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
  };

  const buildHighlightMaskedImage = (
    baseImage: HTMLImageElement,
    strokeList: Stroke[],
    canvasSize: { width: number; height: number },
  ): { base64: string; mimeType: string } | null => {
    if (!strokeList.length || !canvasSize.width || !canvasSize.height) return null;
    const { naturalWidth: imgW, naturalHeight: imgH } = baseImage;
    if (!imgW || !imgH) return null;

    const widthScale = imgW / canvasSize.width;
    const heightScale = imgH / canvasSize.height;
    const lineScale = Math.max(widthScale, heightScale);

    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = imgW;
    imgCanvas.height = imgH;
    const imgCtx = imgCanvas.getContext('2d');
    if (!imgCtx) return null;
    imgCtx.drawImage(baseImage, 0, 0, imgW, imgH);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = imgW;
    maskCanvas.height = imgH;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return null;
    maskCtx.strokeStyle = 'black';
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';

    const drawStrokeToCtx = (ctx: CanvasRenderingContext2D, pts: Point[], width: number) => {
      if (pts.length < 2) return;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x * imgW, pts[0].y * imgH);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = ((pts[i].x + pts[i + 1].x) / 2) * imgW;
        const midY = ((pts[i].y + pts[i + 1].y) / 2) * imgH;
        ctx.quadraticCurveTo(pts[i].x * imgW, pts[i].y * imgH, midX, midY);
      }
      ctx.lineTo(pts[pts.length - 1].x * imgW, pts[pts.length - 1].y * imgH);
      ctx.stroke();
    };

    strokeList.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      const baseWidth = stroke.lineWidth * lineScale;
      drawStrokeToCtx(maskCtx, stroke.points, baseWidth);
      drawStrokeToCtx(maskCtx, stroke.points, baseWidth + 4); // small expansion to keep full glyphs
    });

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = imgW;
    resultCanvas.height = imgH;
    const resultCtx = resultCanvas.getContext('2d');
    if (!resultCtx) return null;

    resultCtx.fillStyle = '#ffffff';
    resultCtx.fillRect(0, 0, imgW, imgH);
    resultCtx.drawImage(imgCanvas, 0, 0);
    resultCtx.globalCompositeOperation = 'destination-in';
    resultCtx.drawImage(maskCanvas, 0, 0);
    resultCtx.globalCompositeOperation = 'destination-over';
    resultCtx.fillStyle = '#ffffff';
    resultCtx.fillRect(0, 0, imgW, imgH);
    resultCtx.globalCompositeOperation = 'source-over';

    const dataUrl = resultCanvas.toDataURL('image/png');
    if (ENABLE_REFINEMENT_DEBUG) {
      console.log('[ImageCapture] highlight mask preview', dataUrl);
    }
    const [, base64] = dataUrl.split(',');
    return { base64, mimeType: 'image/png' };
  };
  const buildInkMask = (
    imageData: ImageData,
    width: number,
    height: number,
    config = REFINEMENT_CONFIG,
  ): { mask: Uint8Array; inkCount: number; meanLuminance: number } => {
    const total = width * height;
    const luminance = new Uint8ClampedArray(total);
    let sum = 0;
    for (let i = 0, p = 0; i < total; i++, p += 4) {
      const r = imageData.data[p];
      const g = imageData.data[p + 1];
      const b = imageData.data[p + 2];
      let l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (config.contrast !== 1) {
        l = clamp((l - 128) * config.contrast + 128, 0, 255);
      }
      luminance[i] = l;
      sum += l;
    }
    const mean = sum / total;
    const threshold =
      config.thresholding === 'adaptive' ? clamp(mean - config.adaptiveOffset, 40, 220) : config.fixedThreshold;
    const mask = new Uint8Array(total);
    let inkCount = 0;
    for (let i = 0; i < total; i++) {
      if (luminance[i] < threshold) {
        mask[i] = 1;
        inkCount += 1;
      }
    }
    if (config.denoise) {
      const cleaned = new Uint8Array(total);
      const minNeighbors = config.denoiseMinNeighbors;
      let cleanedCount = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (!mask[idx]) continue;
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ny = y + dy;
              const nx = x + dx;
              if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
              if (mask[ny * width + nx]) neighbors += 1;
            }
          }
          if (neighbors >= minNeighbors) {
            cleaned[idx] = 1;
            cleanedCount += 1;
          }
        }
      }
      return { mask: cleaned, inkCount: cleanedCount, meanLuminance: mean };
    }
    return { mask, inkCount, meanLuminance: mean };
  };

  // Build one or more tight rects around highlights; multi-line highlights are split per line
  const refineRectFromStrokes = async (): Promise<SelectionRect[] | null> => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || strokes.length === 0) return null;

    const scaleX = img.naturalWidth / (canvas.width || img.naturalWidth);
    const scaleY = img.naturalHeight / (canvas.height || img.naturalHeight);
    const maxLineWidth = strokes.reduce((acc, s) => Math.max(acc, s.lineWidth), 0) || size;
    const padX = maxLineWidth * REFINEMENT_CONFIG.strokePadMultiplier * scaleX;
    const padY = maxLineWidth * REFINEMENT_CONFIG.strokePadMultiplier * scaleY;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    strokes.forEach((stroke) => {
      stroke.points.forEach((pt) => {
        const x = pt.x * canvas.width * scaleX;
        const y = pt.y * canvas.height * scaleY;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });

    const rawStrokeBounds = {
      x: clamp(minX, 0, img.naturalWidth - 1),
      y: clamp(minY, 0, img.naturalHeight - 1),
      width: clamp(maxX, 0, img.naturalWidth) - clamp(minX, 0, img.naturalWidth),
      height: clamp(maxY, 0, img.naturalHeight) - clamp(minY, 0, img.naturalHeight),
    };

    const strokeBounds = {
      x: clamp(minX - padX, 0, img.naturalWidth - 1),
      y: clamp(minY - padY, 0, img.naturalHeight - 1),
      width: clamp(maxX + padX, 0, img.naturalWidth) - clamp(minX - padX, 0, img.naturalWidth),
      height: clamp(maxY + padY, 0, img.naturalHeight) - clamp(minY - padY, 0, img.naturalHeight),
    };

    if (
      strokeBounds.width < REFINEMENT_CONFIG.minRectWidthPx ||
      strokeBounds.height < REFINEMENT_CONFIG.minRectHeightPx
    ) {
      return [clampRectToUnit(imageToNormalizedRect(strokeBounds, img))];
    }

    const cropX = Math.floor(strokeBounds.x);
    const cropY = Math.floor(strokeBounds.y);
    const cropW = clamp(Math.ceil(strokeBounds.width), 1, img.naturalWidth - cropX);
    const cropH = clamp(Math.ceil(strokeBounds.height), 1, img.naturalHeight - cropY);

    const temp = document.createElement('canvas');
    temp.width = cropW;
    temp.height = cropH;
    const ctx = temp.getContext('2d');
    if (!ctx) return [clampRectToUnit(imageToNormalizedRect(strokeBounds, img))];

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const imageData = ctx.getImageData(0, 0, cropW, cropH);
    const { mask, inkCount } = buildInkMask(imageData, cropW, cropH);
    const totalPixels = cropW * cropH;

    if (inkCount / totalPixels < REFINEMENT_CONFIG.minInkCoverage) {
      return null;
    }

    let inkMinX = cropW - 1;
    let inkMaxX = 0;
    let inkMinY = cropH - 1;
    let inkMaxY = 0;
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        if (!mask[y * cropW + x]) continue;
        if (x < inkMinX) inkMinX = x;
        if (x > inkMaxX) inkMaxX = x;
        if (y < inkMinY) inkMinY = y;
        if (y > inkMaxY) inkMaxY = y;
      }
    }

    const padInk = REFINEMENT_CONFIG.inkPaddingPx;
    inkMinX = clamp(inkMinX - padInk, 0, cropW - 1);
    inkMaxX = clamp(inkMaxX + padInk, 0, cropW - 1);
    inkMinY = clamp(inkMinY - padInk, 0, cropH - 1);
    inkMaxY = clamp(inkMaxY + padInk, 0, cropH - 1);

    let tightenedImageRect = {
      x: cropX + inkMinX,
      y: cropY + inkMinY,
      width: inkMaxX - inkMinX + 1,
      height: inkMaxY - inkMinY + 1,
    };

    const tightenedTopLocal = inkMinY;
    const tightenedBottomLocal = inkMaxY;

    const rowCounts: number[] = [];
    const windowPad = REFINEMENT_CONFIG.bandWindowPadPx;
    const strokeLocalTop = clamp(Math.floor(rawStrokeBounds.y - cropY), 0, cropH - 1);
    const strokeLocalBottom = clamp(
      Math.ceil(rawStrokeBounds.y + rawStrokeBounds.height - 1 - cropY),
      0,
      cropH - 1,
    );
    const strokeLocalLeft = clamp(Math.floor(rawStrokeBounds.x - cropX), 0, cropW - 1);
    const strokeLocalRight = clamp(Math.ceil(rawStrokeBounds.x + rawStrokeBounds.width - 1 - cropX), 0, cropW - 1);
    const startRow = clamp(strokeLocalTop - windowPad, 0, cropH - 1);
    const endRow = clamp(strokeLocalBottom + windowPad, 0, cropH - 1);
    const startCol = strokeLocalLeft <= strokeLocalRight ? strokeLocalLeft : inkMinX;
    const endCol = strokeLocalLeft <= strokeLocalRight ? strokeLocalRight : inkMaxX;

    for (let y = startRow; y <= endRow; y++) {
      let count = 0;
      const rowOffset = y * cropW;
      for (let x = startCol; x <= endCol; x++) {
        if (mask[rowOffset + x]) count += 1;
      }
      rowCounts.push(count);
    }

    const window = Math.max(1, REFINEMENT_CONFIG.smoothingWindow);
    const smoothed: number[] = [];
    for (let i = 0; i < rowCounts.length; i++) {
      let sum = 0;
      let samples = 0;
      for (let k = -Math.floor(window / 2); k <= Math.floor(window / 2); k++) {
        const idx = i + k;
        if (idx < 0 || idx >= rowCounts.length) continue;
        sum += rowCounts[idx];
        samples += 1;
      }
      smoothed[i] = samples ? sum / samples : 0;
    }

    let maxVal = 0;
    let sumVal = 0;
    for (const val of smoothed) {
      maxVal = Math.max(maxVal, val);
      sumVal += val;
    }
    const meanVal = smoothed.length ? sumVal / smoothed.length : 0;
    let variance = 0;
    for (const val of smoothed) {
      variance += (val - meanVal) ** 2;
    }
    const stdVal = smoothed.length ? Math.sqrt(variance / smoothed.length) : 0;

    const peakThreshold = Math.max(
      maxVal * REFINEMENT_CONFIG.peakRelativeThreshold,
      meanVal + REFINEMENT_CONFIG.peakStdMultiplier * stdVal,
    );
    let rowsAbove = 0;
    const bandRows: number[] = [];
    for (let i = 0; i < smoothed.length; i++) {
      if (smoothed[i] >= peakThreshold && smoothed[i] >= REFINEMENT_CONFIG.minInkPerRow) {
        bandRows.push(i);
        rowsAbove += 1;
      }
    }

    let snappedRect = tightenedImageRect;
    const peakCoverage = smoothed.length ? rowsAbove / smoothed.length : 0;
    let detectedBands: Array<{ start: number; end: number }> = [];
    if (bandRows.length > 0 && peakCoverage < REFINEMENT_CONFIG.maxPeakCoverage) {
      let bandStart = bandRows[0];
      let prev = bandRows[0];
      for (let i = 1; i < bandRows.length; i++) {
        const row = bandRows[i];
        if (row === prev + 1) {
          prev = row;
        } else {
          if (prev - bandStart + 1 >= REFINEMENT_CONFIG.minLineHeightPx) {
            detectedBands.push({ start: bandStart, end: prev });
          }
          bandStart = row;
          prev = row;
        }
      }
      if (prev - bandStart + 1 >= REFINEMENT_CONFIG.minLineHeightPx) {
        detectedBands.push({ start: bandStart, end: prev });
      }
    }

    const strokeMidY = (strokeLocalTop + strokeLocalBottom) / 2;
    const bandHeights = detectedBands.map((band) => band.end - band.start + 1).sort((a, b) => a - b);
    const estimatedLineHeight = bandHeights.length > 0 ? bandHeights[Math.floor(bandHeights.length / 2)] : Math.max(1, rawStrokeBounds.height);
    const isSmallStroke =
      rawStrokeBounds.height < REFINEMENT_CONFIG.smallStrokeMaxPx ||
      rawStrokeBounds.height < estimatedLineHeight * REFINEMENT_CONFIG.smallStrokeHeightRatio;

    let includedBands: Array<{ start: number; end: number }> = [];
    if (detectedBands.length > 0 && isSmallStroke) {
      let chosen = detectedBands.find((band) => {
        const bandTop = startRow + band.start;
        const bandBottom = startRow + band.end;
        return strokeMidY >= bandTop && strokeMidY <= bandBottom;
      });
      if (!chosen) {
        chosen = detectedBands.reduce((closest, band) => {
          const bandTop = startRow + band.start;
          const bandBottom = startRow + band.end;
          const dist =
            strokeMidY < bandTop ? bandTop - strokeMidY : strokeMidY > bandBottom ? strokeMidY - bandBottom : 0;
          const bestTop = startRow + closest.start;
          const bestBottom = startRow + closest.end;
          const bestDist =
            strokeMidY < bestTop ? bestTop - strokeMidY : strokeMidY > bestBottom ? strokeMidY - bestBottom : 0;
          return dist < bestDist ? band : closest;
        }, detectedBands[0]);
      }
      if (chosen) includedBands = [chosen];
    } else {
      includedBands = detectedBands.filter((band) => {
        const bandTop = startRow + band.start;
        const bandBottom = startRow + band.end;
        const overlap = Math.max(0, Math.min(bandBottom, strokeLocalBottom) - Math.max(bandTop, strokeLocalTop) + 1);
        const bandHeight = bandBottom - bandTop + 1;
        return (
          overlap >= REFINEMENT_CONFIG.lineOverlapMinPx &&
          overlap / Math.max(1, bandHeight) >= REFINEMENT_CONFIG.lineOverlapRatio
        );
      });
    }
    if (includedBands.length > 0) {
      const minBand = Math.min(...includedBands.map((b) => b.start));
      const maxBand = Math.max(...includedBands.map((b) => b.end));
      const verticalPad = REFINEMENT_CONFIG.verticalPaddingPx;
      const snappedTop = clamp(startRow + minBand - verticalPad, 0, cropH - 1);
      const snappedBottom = clamp(startRow + maxBand + verticalPad, 0, cropH - 1);
      if (snappedBottom > snappedTop) {
        snappedRect = {
          x: strokeBounds.x,
          y: cropY + snappedTop,
          width: strokeBounds.width,
          height: snappedBottom - snappedTop + 1,
        };
      }
    } else {
      snappedRect = strokeBounds;
    }

    const maxExpand = REFINEMENT_CONFIG.maxExpansionPx;
    const expandBounds = {
      left: clamp(strokeBounds.x - maxExpand, 0, img.naturalWidth),
      top: clamp(strokeBounds.y - maxExpand, 0, img.naturalHeight),
      right: clamp(strokeBounds.x + strokeBounds.width + maxExpand, 0, img.naturalWidth),
      bottom: clamp(strokeBounds.y + strokeBounds.height + maxExpand, 0, img.naturalHeight),
    };
    snappedRect = clampRectToBounds(snappedRect, {
      x: expandBounds.left,
      y: expandBounds.top,
      width: expandBounds.right - expandBounds.left,
      height: expandBounds.bottom - expandBounds.top,
    });

    const snappedTopLocal = clamp(Math.round(snappedRect.y - cropY), 0, cropH - 1);
    const snappedBottomLocal = clamp(Math.round(snappedRect.y + snappedRect.height - 1 - cropY), 0, cropH - 1);

    let refinedImageRect = snappedRect;
    let usedWordTighten = false;
    if (isSmallStroke && includedBands.length === 1) {
      const chosenBand = includedBands[0];
      const bandTop = clamp(startRow + chosenBand.start, 0, cropH - 1);
      const bandBottom = clamp(startRow + chosenBand.end, 0, cropH - 1);

      const roiPad = REFINEMENT_CONFIG.wordRoiPadPx;
      const roiLeft = clamp(strokeLocalLeft - roiPad, 0, cropW - 1);
      const roiRight = clamp(strokeLocalRight + roiPad, 0, cropW - 1);
      const roiTop = clamp(bandTop - REFINEMENT_CONFIG.verticalPaddingPx, 0, cropH - 1);
      const roiBottom = clamp(bandBottom + REFINEMENT_CONFIG.verticalPaddingPx, 0, cropH - 1);

      const visited = new Uint8Array(cropW * cropH);
      let compMinX = Number.POSITIVE_INFINITY;
      let compMinY = Number.POSITIVE_INFINITY;
      let compMaxX = Number.NEGATIVE_INFINITY;
      let compMaxY = Number.NEGATIVE_INFINITY;
      let anyComponent = false;
      const stack: number[] = [];
      const push = (idx: number) => {
        stack.push(idx);
        visited[idx] = 1;
      };

      for (let y = roiTop; y <= roiBottom; y++) {
        for (let x = roiLeft; x <= roiRight; x++) {
          const idx = y * cropW + x;
          if (visited[idx] || !mask[idx]) continue;
          let pixels = 0;
          let localMinX = x;
          let localMaxX = x;
          let localMinY = y;
          let localMaxY = y;
          push(idx);
          while (stack.length > 0) {
            const current = stack.pop() as number;
            const cy = Math.floor(current / cropW);
            const cx = current - cy * cropW;
            pixels += 1;
            if (cx < localMinX) localMinX = cx;
            if (cx > localMaxX) localMaxX = cx;
            if (cy < localMinY) localMinY = cy;
            if (cy > localMaxY) localMaxY = cy;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = cy + dy;
                const nx = cx + dx;
                if (ny < roiTop || ny > roiBottom || nx < roiLeft || nx > roiRight) continue;
                const nIdx = ny * cropW + nx;
                if (visited[nIdx] || !mask[nIdx]) continue;
                push(nIdx);
              }
            }
          }
          if (pixels >= REFINEMENT_CONFIG.minComponentPixels) {
            anyComponent = true;
            compMinX = Math.min(compMinX, localMinX);
            compMaxX = Math.max(compMaxX, localMaxX);
            compMinY = Math.min(compMinY, localMinY);
            compMaxY = Math.max(compMaxY, localMaxY);
          }
        }
      }

      if (anyComponent) {
        const padX = REFINEMENT_CONFIG.horizontalPaddingPx;
        const padY = REFINEMENT_CONFIG.verticalPaddingPx;
        const refinedLeft = clamp(compMinX - padX, 0, cropW - 1);
        const refinedRight = clamp(compMaxX + padX, 0, cropW - 1);
        const refinedTop = clamp(compMinY - padY, 0, cropH - 1);
        const refinedBottom = clamp(compMaxY + padY, 0, cropH - 1);
        refinedImageRect = {
          x: cropX + refinedLeft,
          y: cropY + refinedTop,
          width: refinedRight - refinedLeft + 1,
          height: refinedBottom - refinedTop + 1,
        };
        usedWordTighten = true;

        if (ENABLE_REFINEMENT_DEBUG) {
          debugRectsRef.current = {
            ...debugRectsRef.current,
            roi: clampRectToUnit(
              imageToNormalizedRect(
                {
                  x: cropX + roiLeft,
                  y: cropY + roiTop,
                  width: roiRight - roiLeft + 1,
                  height: roiBottom - roiTop + 1,
                },
                img,
              ),
            ),
            wordBox: clampRectToUnit(
              imageToNormalizedRect(
                {
                  x: cropX + refinedLeft,
                  y: cropY + refinedTop,
                  width: refinedRight - refinedLeft + 1,
                  height: refinedBottom - refinedTop + 1,
                },
                img,
              ),
            ),
          };
        }
      }
    }

    if (!usedWordTighten) {
      const colCounts: number[] = [];
      for (let x = inkMinX; x <= inkMaxX; x++) {
        let count = 0;
        for (let y = snappedTopLocal; y <= snappedBottomLocal; y++) {
          if (mask[y * cropW + x]) count += 1;
        }
        colCounts.push(count);
      }

      let maxCol = 0;
      for (const val of colCounts) maxCol = Math.max(maxCol, val);
      const colThreshold = maxCol * 0.12;

      let leftIdx = 0;
      let rightIdx = colCounts.length - 1;
      while (leftIdx < colCounts.length && colCounts[leftIdx] < colThreshold) leftIdx += 1;
      while (rightIdx > leftIdx && colCounts[rightIdx] < colThreshold) rightIdx -= 1;
      if (rightIdx > leftIdx) {
        const horizontalPad = REFINEMENT_CONFIG.horizontalPaddingPx;
        const refinedLeft = clamp(inkMinX + leftIdx - horizontalPad, 0, cropW - 1);
        const refinedRight = clamp(inkMinX + rightIdx + horizontalPad, 0, cropW - 1);
        refinedImageRect = {
          x: cropX + refinedLeft,
          y: snappedRect.y,
          width: refinedRight - refinedLeft + 1,
          height: snappedRect.height,
        };
      }
    }

    const rects: SelectionRect[] = [];

    const pushNormalizedRect = (rect: { x: number; y: number; width: number; height: number }) => {
      // enforce a minimum size but without expanding to the full strokeBounds width
      let { x, y, width, height } = rect;
      if (width < REFINEMENT_CONFIG.minRectWidthPx) {
        const delta = (REFINEMENT_CONFIG.minRectWidthPx - width) / 2;
        x = clamp(x - delta, 0, img.naturalWidth - 1);
        const right = clamp(x + REFINEMENT_CONFIG.minRectWidthPx, 0, img.naturalWidth);
        width = Math.max(1, right - x);
      }
      if (height < REFINEMENT_CONFIG.minRectHeightPx) {
        const delta = (REFINEMENT_CONFIG.minRectHeightPx - height) / 2;
        y = clamp(y - delta, 0, img.naturalHeight - 1);
        const bottom = clamp(y + REFINEMENT_CONFIG.minRectHeightPx, 0, img.naturalHeight);
        height = Math.max(1, bottom - y);
      }
      const clamped = clampRectToBounds({ x, y, width, height }, {
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      rects.push(clampRectToUnit(imageToNormalizedRect(clamped, img)));
    };

    // Build stroke-based vertical bands in case text-band detection merges lines; this keeps rectangles aligned to highlighted strokes.
    const strokePoints: Array<{ x: number; y: number; halfWidthX: number; halfWidthY: number }> = [];
    strokes.forEach((stroke) => {
      const halfX = (stroke.lineWidth * scaleX) / 2;
      const halfY = (stroke.lineWidth * scaleY) / 2;
      stroke.points.forEach((pt) => {
        strokePoints.push({
          x: pt.x * canvas.width * scaleX,
          y: pt.y * canvas.height * scaleY,
          halfWidthX: halfX,
          halfWidthY: halfY,
        });
      });
    });

    const strokeBandsPx: Array<{ top: number; bottom: number }> = [];
    if (strokePoints.length > 0) {
      const sorted = [...strokePoints].sort((a, b) => a.y - b.y);
      const lineHeightGuess = Math.max(
        estimatedLineHeight || 0,
        rawStrokeBounds.height / Math.max(1, includedBands.length || 1),
        maxLineWidth * scaleY,
      );
      const gapThreshold = Math.max(4, lineHeightGuess * 0.35);
      let bandTop = sorted[0].y - sorted[0].halfWidthY;
      let bandBottom = sorted[0].y + sorted[0].halfWidthY;
      for (let i = 1; i < sorted.length; i++) {
        const p = sorted[i];
        const prev = sorted[i - 1];
        if (p.y - prev.y > gapThreshold) {
          strokeBandsPx.push({ top: bandTop, bottom: bandBottom });
          bandTop = p.y - p.halfWidthY;
          bandBottom = p.y + p.halfWidthY;
        } else {
          bandTop = Math.min(bandTop, p.y - p.halfWidthY);
          bandBottom = Math.max(bandBottom, p.y + p.halfWidthY);
        }
      }
      strokeBandsPx.push({ top: bandTop, bottom: bandBottom });
    }

    const textBandsPx = includedBands.map((band) => {
      const bandTopLocal = startRow + band.start;
      const bandBottomLocal = startRow + band.end;
      return {
        top: cropY + bandTopLocal,
        bottom: cropY + bandBottomLocal,
      };
    });

    let bandsForRects: Array<{ top: number; bottom: number }> = [];
    if (textBandsPx.length > 1) {
      bandsForRects = textBandsPx;
    } else if (textBandsPx.length <= 1 && strokeBandsPx.length > 1) {
      // Text detection collapsed bands; fall back to stroke-based bands to keep per-line cropping.
      bandsForRects = strokeBandsPx;
    } else if (textBandsPx.length === 1) {
      bandsForRects = textBandsPx;
    } else {
      bandsForRects = strokeBandsPx;
    }

    // Filter out bands that are barely touched by strokes (avoids accidental inclusion when a stroke grazes an adjacent line).
    if (bandsForRects.length > 0 && strokePoints.length > 0) {
      bandsForRects = bandsForRects.filter((band) => {
        const bandTop = band.top - REFINEMENT_CONFIG.verticalPaddingPx;
        const bandBottom = band.bottom + REFINEMENT_CONFIG.verticalPaddingPx;
        let hitCount = 0;
        for (const p of strokePoints) {
          if (p.y + p.halfWidthY >= bandTop && p.y - p.halfWidthY <= bandBottom) {
            hitCount += 1;
          }
        }
        const ratio = hitCount / strokePoints.length;
        return (
          hitCount >= REFINEMENT_CONFIG.minBandStrokePoints &&
          ratio >= REFINEMENT_CONFIG.minBandStrokeRatio
        );
      });
    }

    // Fallback: if we still have a single wide band, try to split it using ink gaps inside the band.
    if (bandsForRects.length === 1) {
      const band = bandsForRects[0];
      const bandTopLocal = clamp(Math.floor(band.top - cropY), 0, cropH - 1);
      const bandBottomLocal = clamp(Math.floor(band.bottom - cropY), 0, cropH - 1);
      const rowInk: number[] = [];
      for (let y = bandTopLocal; y <= bandBottomLocal; y++) {
        let count = 0;
        const rowOffset = y * cropW;
        for (let x = 0; x < cropW; x++) {
          if (mask[rowOffset + x]) count += 1;
        }
        rowInk.push(count);
      }
      const gapThreshold = Math.max(2, Math.floor(REFINEMENT_CONFIG.minLineHeightPx / 2));
      const minBandHeight = REFINEMENT_CONFIG.minLineHeightPx;
      const splitBands: Array<{ top: number; bottom: number }> = [];
      let runStart = -1;
      let zeros = 0;
      for (let i = 0; i < rowInk.length; i++) {
        if (rowInk[i] > 0) {
          if (runStart === -1) runStart = i;
          zeros = 0;
        } else if (runStart !== -1) {
          zeros += 1;
          if (zeros >= gapThreshold) {
            const end = i - zeros;
            if (end - runStart + 1 >= minBandHeight) {
              splitBands.push({
                top: cropY + bandTopLocal + runStart,
                bottom: cropY + bandTopLocal + end,
              });
            }
            runStart = -1;
            zeros = 0;
          }
        }
      }
      if (runStart !== -1 && rowInk.length - runStart >= minBandHeight) {
        splitBands.push({
          top: cropY + bandTopLocal + runStart,
          bottom: cropY + bandTopLocal + rowInk.length - 1,
        });
      }
      if (splitBands.length > 1) {
        bandsForRects = splitBands;
        if (ENABLE_REFINEMENT_DEBUG) {
          console.groupCollapsed('[ImageCapture] fallback split bands');
          console.log('rowInk length', rowInk.length);
          console.log('splitBands', splitBands);
          console.groupEnd();
        }
      }
    }

    if (ENABLE_REFINEMENT_DEBUG) {
      console.groupCollapsed('[ImageCapture] bandsForRects (final)');
      console.log('bandsForRects', bandsForRects);
      console.log('hasMultipleBands', bandsForRects.length > 1);
      console.groupEnd();
    }

    const hasMultipleBands = bandsForRects.length > 1;

    if (ENABLE_REFINEMENT_DEBUG) {
      console.groupCollapsed('[ImageCapture] refineRectFromStrokes');
      console.log('strokeBounds', strokeBounds);
      console.log('rawStrokeBounds', rawStrokeBounds);
      console.log('includedBands', includedBands);
      console.log('strokePoints count', strokePoints.length);
      console.log('strokeBandsPx', strokeBandsPx);
      console.log('textBandsPx', textBandsPx);
      console.log('bandsForRects (pre-merge)', bandsForRects);
      console.groupEnd();
    }

    if (hasMultipleBands) {
      const horizPad = REFINEMENT_CONFIG.horizontalPaddingPx;
      const vertPad = REFINEMENT_CONFIG.verticalPaddingPx;

      // Enforce an upper bound on OCR calls; merge adjacent bands if needed.
      if (bandsForRects.length > MAX_OCR_RECTS) {
        const chunkSize = Math.ceil(bandsForRects.length / MAX_OCR_RECTS);
        const merged: Array<{ top: number; bottom: number }> = [];
        for (let i = 0; i < bandsForRects.length; i += chunkSize) {
          const slice = bandsForRects.slice(i, i + chunkSize);
          merged.push({
            top: slice[0].top,
            bottom: slice[slice.length - 1].bottom,
          });
        }
        bandsForRects = merged;
      }

      const perBandRects: SelectionRect[] = [];
      bandsForRects.forEach((band) => {
        const bandTop = clamp(band.top, 0, img.naturalHeight - 1);
        const bandBottom = clamp(band.bottom, bandTop, img.naturalHeight - 1);

        let bandMinX = Number.POSITIVE_INFINITY;
        let bandMaxX = Number.NEGATIVE_INFINITY;
        const bandTopLocalPx = clamp(Math.floor(bandTop - cropY), 0, cropH - 1);
        const bandBottomLocalPx = clamp(Math.floor(bandBottom - cropY), 0, cropH - 1);

        // Only consider stroke points that live inside this band (with a small vertical pad for jitter).
        strokes.forEach((stroke) => {
          const strokeHalfWidth = (stroke.lineWidth * scaleX) / 2;
          stroke.points.forEach((pt) => {
            const xPx = pt.x * canvas.width * scaleX;
            const yPx = pt.y * canvas.height * scaleY;
            if (yPx >= bandTop - vertPad && yPx <= bandBottom + vertPad) {
              bandMinX = Math.min(bandMinX, xPx - strokeHalfWidth);
              bandMaxX = Math.max(bandMaxX, xPx + strokeHalfWidth);
            }
          });
        });

        // Fallback to strokeBounds if no points were collected (should be rare)
        if (!Number.isFinite(bandMinX) || !Number.isFinite(bandMaxX)) {
          bandMinX = strokeBounds.x;
          bandMaxX = strokeBounds.x + strokeBounds.width;
        }

        const left = clamp(bandMinX - horizPad, 0, img.naturalWidth - 1);
        const right = clamp(bandMaxX + horizPad, 0, img.naturalWidth - 1);
        const top = clamp(bandTop - vertPad, 0, img.naturalHeight - 1);
        const bottom = clamp(bandBottom + vertPad, 0, img.naturalHeight - 1);

        // Within this band, keep only ink components that are at least 50% covered horizontally by the highlight span.
        const highlightLeftLocal = clamp(Math.floor(left - cropX), 0, cropW - 1);
        const highlightRightLocal = clamp(Math.floor(right - cropX), 0, cropW - 1);
        const visited = new Uint8Array(cropW * cropH);
        let compMinX = Number.POSITIVE_INFINITY;
        let compMaxX = Number.NEGATIVE_INFINITY;
        let compMinY = Number.POSITIVE_INFINITY;
        let compMaxY = Number.NEGATIVE_INFINITY;
        const minCoverage = 0.5;

        const pushIdx = (stack: number[], idx: number) => {
          stack.push(idx);
          visited[idx] = 1;
        };

        const processComponent = (startX: number, startY: number) => {
          const stack: number[] = [];
          pushIdx(stack, startY * cropW + startX);
          let area = 0;
          let covered = 0;
          let localMinX = startX;
          let localMaxX = startX;
          let localMinY = startY;
          let localMaxY = startY;

          while (stack.length) {
            const idx = stack.pop() as number;
            const y = Math.floor(idx / cropW);
            const x = idx - y * cropW;
            area += 1;
            if (x >= highlightLeftLocal && x <= highlightRightLocal) covered += 1;
            if (x < localMinX) localMinX = x;
            if (x > localMaxX) localMaxX = x;
            if (y < localMinY) localMinY = y;
            if (y > localMaxY) localMaxY = y;

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny < bandTopLocalPx || ny > bandBottomLocalPx || nx < 0 || nx >= cropW) continue;
                const nIdx = ny * cropW + nx;
                if (visited[nIdx] || !mask[nIdx]) continue;
                pushIdx(stack, nIdx);
              }
            }
          }

          if (area > 0 && covered / area >= minCoverage) {
            compMinX = Math.min(compMinX, localMinX);
            compMaxX = Math.max(compMaxX, localMaxX);
            compMinY = Math.min(compMinY, localMinY);
            compMaxY = Math.max(compMaxY, localMaxY);
          }
        };

        for (let y = bandTopLocalPx; y <= bandBottomLocalPx; y++) {
          const rowOffset = y * cropW;
          for (let x = 0; x < cropW; x++) {
            const idx = rowOffset + x;
            if (visited[idx] || !mask[idx]) continue;
            processComponent(x, y);
          }
        }

        if (Number.isFinite(compMinX) && Number.isFinite(compMaxX)) {
          const compLeft = clamp(compMinX + cropX - horizPad, 0, img.naturalWidth - 1);
          const compRight = clamp(compMaxX + cropX + horizPad, 0, img.naturalWidth - 1);
          const compTop = clamp(compMinY + cropY - vertPad, 0, img.naturalHeight - 1);
          const compBottom = clamp(compMaxY + cropY + vertPad, 0, img.naturalHeight - 1);

          const rect = clampRectToUnit(imageToNormalizedRect({
            x: compLeft,
            y: compTop,
            width: Math.max(1, compRight - compLeft + 1),
            height: Math.max(1, compBottom - compTop + 1),
          }, img));
          perBandRects.push(rect);
          return;
        }

        const rect = clampRectToUnit(imageToNormalizedRect({
          x: left,
          y: top,
          width: Math.max(1, right - left + 1),
          height: Math.max(1, bottom - top + 1),
        }, img));
        perBandRects.push(rect);
      });

      if (ENABLE_REFINEMENT_DEBUG) {
        console.groupCollapsed('[ImageCapture] per-band rects');
        perBandRects.forEach((r, i) => console.log(`rect ${i}`, r));
        console.groupEnd();
      }

      perBandRects.forEach((r) => rects.push(r));
    } else {
      // Single line or small stroke: keep existing refined single rect behaviour
      refinedImageRect = clampRectToBounds(refinedImageRect, strokeBounds);

      const refinedRect = clampRectToUnit(imageToNormalizedRect(refinedImageRect, img));
      if (ENABLE_REFINEMENT_DEBUG) {
        const windowRect = clampRectToUnit(
          imageToNormalizedRect(
            {
              x: strokeBounds.x,
              y: cropY + startRow,
              width: strokeBounds.width,
              height: Math.max(1, endRow - startRow + 1),
            },
            img,
          ),
        );
        debugRectsRef.current = {
          roi: debugRectsRef.current?.roi,
          wordBox: debugRectsRef.current?.wordBox,
          initial: clampRectToUnit(imageToNormalizedRect(strokeBounds, img)),
          tightened: clampRectToUnit(imageToNormalizedRect(tightenedImageRect, img)),
          refined: refinedRect,
          window: windowRect,
          bands: detectedBands.map((band) => ({
            start: (cropY + startRow + band.start) / img.naturalHeight,
            end: (cropY + startRow + band.end) / img.naturalHeight,
          })),
          included: includedBands.map((band) => ({
            start: (cropY + startRow + band.start) / img.naturalHeight,
            end: (cropY + startRow + band.end) / img.naturalHeight,
          })),
        };
        requestAnimationFrame(() => drawOverlay());
      }
      pushNormalizedRect(refinedImageRect);
    }

    return rects.length ? rects : null;
  };
  const dataUrlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
    if (url.startsWith('data:')) {
      const [meta, b64] = url.split(',');
      const mimeMatch = meta.match(/data:(.*?);base64/);
      return { base64: b64, mimeType: mimeMatch?.[1] || 'image/png' };
    }
    const res = await fetch(url);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return { base64, mimeType: blob.type || 'image/png' };
  };

  const getCanvasCoords = (evt: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in evt ? evt.touches[0] : evt;
    return {
      x: (point.clientX - rect.left) / rect.width,
      y: (point.clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = (evt: React.MouseEvent | React.TouchEvent) => {
    if (mode === 'text') return;
    if ('touches' in evt && evt.touches.length > 1) return;
    const coords = getCanvasCoords(evt);
    if (!coords) return;
    setIsDragging(true);
    dragStart.current = coords;
    if ('touches' in evt) evt.preventDefault();

    if (mode === 'highlight') {
      const stroke: Stroke = {
        points: [coords],
        lineWidth: size,
        bbox: { minX: coords.x, minY: coords.y, maxX: coords.x, maxY: coords.y },
      };
      setCurrentStroke(stroke);
    } else if (mode === 'select') {
      setSelectionRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    }
  };

  const handlePointerMove = (evt: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || mode === 'text') return;
    if ('touches' in evt && evt.touches.length > 1) return;
    const coords = getCanvasCoords(evt);
    if (!coords) return;
    if ('touches' in evt) evt.preventDefault();

    if (mode === 'highlight') {
      setCurrentStroke((prev) => {
        if (!prev) return prev;
        const last = prev.points[prev.points.length - 1];
        const distance = last ? Math.hypot(coords.x - last.x, coords.y - last.y) : 1;
        // Only add points when we move enough to keep path smooth
        if (distance < 0.003) return prev;
        const nextPoints = [...prev.points, coords];
        return {
          points: nextPoints,
          lineWidth: prev.lineWidth,
          bbox: {
            minX: Math.min(prev.bbox.minX, coords.x),
            minY: Math.min(prev.bbox.minY, coords.y),
            maxX: Math.max(prev.bbox.maxX, coords.x),
            maxY: Math.max(prev.bbox.maxY, coords.y),
          },
        };
      });
    } else if (mode === 'select') {
      const start = dragStart.current;
      if (!start) return;
      setSelectionRect({
        x: Math.min(start.x, coords.x),
        y: Math.min(start.y, coords.y),
        width: Math.abs(coords.x - start.x),
        height: Math.abs(coords.y - start.y),
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStart.current = null;
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const clearSelections = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setSelectionRect(null);
  };

  const undoLastHighlight = () => {
    setCurrentStroke(null);
    setStrokes((prev) => prev.slice(0, -1));
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, alpha = 0.35) => {
    const pts = stroke.points;
    if (pts.length < 2) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'multiply';
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(245, 158, 11, 1)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x * w, pts[i].y * h, midX * w, midY * h);
    }
    ctx.lineTo(pts[pts.length - 1].x * w, pts[pts.length - 1].y * h);
    ctx.stroke();
    ctx.restore();
  };

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === 'highlight') {
      strokes.forEach((s) => drawStroke(ctx, s, 0.35));
      if (currentStroke) drawStroke(ctx, currentStroke, 0.22);
    }

    if (mode === 'select' && selectionRect && selectionRect.width > 0 && selectionRect.height > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(79, 70, 229, 0.18)';
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.fillRect(
        selectionRect.x * canvas.width,
        selectionRect.y * canvas.height,
        selectionRect.width * canvas.width,
        selectionRect.height * canvas.height,
      );
      ctx.strokeRect(
        selectionRect.x * canvas.width,
        selectionRect.y * canvas.height,
        selectionRect.width * canvas.width,
        selectionRect.height * canvas.height,
      );
      ctx.restore();
    }

    if (ENABLE_REFINEMENT_DEBUG && debugRectsRef.current) {
      const drawDebugRect = (rect: SelectionRect, color: string) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(rect.x * canvas.width, rect.y * canvas.height, rect.width * canvas.width, rect.height * canvas.height);
        ctx.restore();
      };
      const drawBand = (band: { start: number; end: number }, color: string) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        const y = band.start * canvas.height;
        const h = (band.end - band.start) * canvas.height;
        ctx.strokeRect(0, y, canvas.width, h);
        ctx.restore();
      };

      if (debugRectsRef.current.initial) drawDebugRect(debugRectsRef.current.initial, 'rgba(59, 130, 246, 0.9)');
      if (debugRectsRef.current.tightened) drawDebugRect(debugRectsRef.current.tightened, 'rgba(16, 185, 129, 0.9)');
      if (debugRectsRef.current.refined) drawDebugRect(debugRectsRef.current.refined, 'rgba(244, 63, 94, 0.9)');
      if (debugRectsRef.current.window) drawDebugRect(debugRectsRef.current.window, 'rgba(251, 146, 60, 0.9)');
      if (debugRectsRef.current.roi) drawDebugRect(debugRectsRef.current.roi, 'rgba(234, 179, 8, 0.9)');
      if (debugRectsRef.current.wordBox) drawDebugRect(debugRectsRef.current.wordBox, 'rgba(14, 116, 144, 0.9)');
      debugRectsRef.current.bands?.forEach((band) => drawBand(band, 'rgba(148, 163, 184, 0.8)'));
      debugRectsRef.current.included?.forEach((band) => drawBand(band, 'rgba(34, 197, 94, 0.9)'));
    }
  }, [strokes, currentStroke, selectionRect, mode]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const getSelectionDataUrl = async (rect: SelectionRect): Promise<{ base64: string; mimeType: string } | null> => {
    if (!capturedImage) return null;
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => {
        const temp = document.createElement('canvas');
        const canvas = canvasRef.current;
        const scaleX = img.naturalWidth / (canvas?.width || img.naturalWidth);
        const scaleY = img.naturalHeight / (canvas?.height || img.naturalHeight);
        const sx = rect.x * (canvas?.width || 1) * scaleX;
        const sy = rect.y * (canvas?.height || 1) * scaleY;
        const sw = rect.width * (canvas?.width || 1) * scaleX;
        const sh = rect.height * (canvas?.height || 1) * scaleY;
        temp.width = Math.max(1, Math.floor(sw));
        temp.height = Math.max(1, Math.floor(sh));
        const ctx = temp.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, temp.width, temp.height);
          const dataUrl = temp.toDataURL('image/png');
          const [meta, b64] = dataUrl.split(',');
          const mimeMatch = meta.match(/data:(.*?);base64/);
          resolve({ base64: b64, mimeType: mimeMatch?.[1] || 'image/png' });
        } else {
          resolve(null);
        }
      };
      img.src = capturedImage.url;
    });
  };

  const handleExtractFull = async () => {
    if (!onRequestOCR || !capturedImage) return;
    setOcrLoading(true);
    setLastAction('full');
    setResultsError(null);
    try {
      const { base64, mimeType } = await dataUrlToBase64(capturedImage.url);
      const text = await onRequestOCR(base64, mimeType, OCR_STRICT_INSTRUCTION);
      const normalized = normalizeExtractedText(text);
      if (normalized) {
        onCapture({ ...capturedImage, extractedText: normalized });
        setResultsText(normalized);
        setResultsOpen(true);
      } else {
        setResultsText('');
        setResultsError(null);
        setResultsOpen(true);
      }
    } catch (err) {
      console.error('OCR failed', err);
      setResultsText('');
      setResultsError('Extraction failed. Please try again.');
      setResultsOpen(true);
    } finally {
      setOcrLoading(false);
    }
  };

  const extractRect = async (rect: SelectionRect) => {
    if (!onRequestOCR || !capturedImage) return;
    setOcrLoading(true);
    setResultsError(null);
    try {
      const payload = await getSelectionDataUrl(rect);
      if (!payload) return;
      const text = await onRequestOCR(payload.base64, payload.mimeType, OCR_STRICT_INSTRUCTION);
      const normalized = normalizeExtractedText(text);
      if (normalized) {
        onCapture({ ...capturedImage, extractedText: normalized });
        setResultsText(normalized);
        setResultsOpen(true);
      } else {
        setResultsText('');
        setResultsError(null);
        setResultsOpen(true);
      }
    } catch (err) {
      console.error('OCR selection failed', err);
      setResultsText('');
      setResultsError('Extraction failed. Please try again.');
      setResultsOpen(true);
    } finally {
      setOcrLoading(false);
    }
  };

  const extractHighlights = async () => {
    if (!hasHighlights || !onRequestOCR || !capturedImage) return;
    setLastAction('highlight');
    setOcrLoading(true);
    setResultsError(null);

    try {
      const rects = await refineRectFromStrokes();
      if (!rects || rects.length === 0) {
        setResultsText('');
        setResultsOpen(true);
        return;
      }

      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) {
        setResultsText('');
        setResultsError('Image not ready. Please try again.');
        setResultsOpen(true);
        return;
      }

      const masked = buildHighlightMaskedImage(img, strokes, {
        width: canvas.width || canvas.clientWidth || img.clientWidth || img.naturalWidth,
        height: canvas.height || canvas.clientHeight || img.clientHeight || img.naturalHeight,
      });

      if (!masked) {
        setResultsText('');
        setResultsOpen(true);
        return;
      }

      const text = await onRequestOCR(masked.base64, masked.mimeType, OCR_STRICT_INSTRUCTION);
      const normalized = normalizeExtractedText(text);

      if (normalized) {
        onCapture({ ...capturedImage, extractedText: normalized });
      }
      setResultsText(normalized);
      setResultsOpen(true);
    } catch (err) {
      console.error('OCR highlight failed', err);
      setResultsText('');
      setResultsError('Extraction failed. Please try again.');
      setResultsOpen(true);
    } finally {
      setOcrLoading(false);
    }
  };

  const extractSelection = async () => {
    if (!selectionRect || selectionRect.width <= 0 || selectionRect.height <= 0) return;
    setLastAction('select');
    await extractRect(selectionRect);
  };

  useEffect(() => {
    if (!capturedImage) {
      clearSelections();
      setMode('text');
      setResultsText('');
      setResultsError(null);
      setResultsOpen(false);
    } else {
      setResultsText(normalizeExtractedText(capturedImage.extractedText));
    }
  }, [capturedImage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onCapture({ url, extractedText: undefined });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onCapture({ url, extractedText: undefined });
    };
    reader.readAsDataURL(file);
  };

  const copyResults = () => {
    if (resultsText) navigator.clipboard.writeText(resultsText);
  };

  const handleRetry = () => {
    if (lastAction === 'full') {
      handleExtractFull();
    } else if (lastAction === 'highlight') {
      extractHighlights();
    } else if (lastAction === 'select') {
      extractSelection();
    }
  };

  const syncCanvasSize = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (canvas && img) {
      const width = img.clientWidth;
      const height = (img.naturalHeight / img.naturalWidth) * width;
      canvas.width = width;
      canvas.height = height;
      drawOverlay();
    }
  };

  useEffect(() => {
    const handleResize = () => syncCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!capturedImage) return;
    if (mode !== 'select') setSelectionRect(null);
    if (mode !== 'highlight') setCurrentStroke(null);
  }, [mode, capturedImage]);

  useEffect(() => {
    if (!capturedImage) return;
    if (mode !== 'highlight' && mode !== 'select') return;
    const key = `image-capture-hint-${mode}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, 'true');
      toast({
        description:
          mode === 'highlight'
            ? '1 finger to highlight - 2 fingers to move - pinch to zoom'
            : '1 finger to select - 2 fingers to move - pinch to zoom',
      });
    } catch {
      // Ignore storage errors
    }
  }, [mode, capturedImage]);
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
            <p className="text-sm text-muted-foreground mt-1">We'll extract the text when you tap extract.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" className="gap-2">
              <Camera className="w-4 h-4" /> Take photo
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-border overflow-hidden bg-muted/20">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-background/80 backdrop-blur-sm">
          <Button type="button" variant="ghost" size="icon" onClick={onClear} aria-label="Close image">
            <X className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium text-foreground">Image Highlight</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="More options">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={clearSelections} disabled={!hasHighlights && !selectionRect}>
                Clear marks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClear}>Remove image</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative" style={{ maxHeight: '70vh' }}>
          <img
            ref={imgRef}
            src={capturedImage.url}
            alt="Captured"
            className="w-full h-auto object-contain block"
            onLoad={(e) => {
              const canvas = canvasRef.current;
              const img = e.currentTarget;
              if (canvas) {
                const width = img.clientWidth;
                const height = (img.naturalHeight / img.naturalWidth) * width;
                canvas.width = width;
                canvas.height = height;
              }
              drawOverlay();
            }}
          />

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full z-10 ${mode === 'text' ? 'cursor-default' : 'cursor-crosshair'}`}
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />

          {ocrLoading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur flex items-center justify-center z-20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RotateCcw className="w-4 h-4 animate-spin" /> Extracting text...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-2 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-background/95 backdrop-blur border-t border-border/70">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value) setMode(value as 'highlight' | 'select' | 'text');
          }}
          className="mx-auto w-fit rounded-full bg-muted/70 p-1"
        >
          <ToggleGroupItem value="highlight" className="rounded-full px-4" aria-label="Highlight mode">
            <Highlighter className="mr-2 h-4 w-4" /> Highlight
          </ToggleGroupItem>
          <ToggleGroupItem value="select" className="rounded-full px-4" aria-label="Select mode">
            <Square className="mr-2 h-4 w-4" /> Select
          </ToggleGroupItem>
          <ToggleGroupItem value="text" className="rounded-full px-4" aria-label="Text mode">
            <Type className="mr-2 h-4 w-4" /> Text
          </ToggleGroupItem>
        </ToggleGroup>

        {mode === 'highlight' && (
          <div className="mt-3 grid gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={undoLastHighlight}
                disabled={!hasHighlights}
                aria-label="Undo highlight"
              >
                <Undo2 className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="rounded-full px-3">
                    <span className="font-semibold">{size <= 10 ? 'S' : size <= 14 ? 'M' : 'L'}</span>
                    <span className="text-xs text-muted-foreground">{size}px</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="flex items-center justify-between gap-2">
                    {sizePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={size === preset.value ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => setSize(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-auto">{size}px</span>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={extractHighlights}
              disabled={ocrLoading || !hasHighlights || !onRequestOCR}
              className="w-full"
            >
              Extract highlights
            </Button>
            {!hasHighlights && (
              <p className="text-xs text-muted-foreground text-center">Add a highlight to enable extraction.</p>
            )}
          </div>
        )}

        {mode === 'select' && (
          <div className="mt-3 grid gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setSelectionRect(null)}
                disabled={!selectionRect}
                aria-label="Clear selection"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Box</span>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={extractSelection}
              disabled={ocrLoading || !hasSelection || !onRequestOCR}
              className="w-full"
            >
              Extract selection
            </Button>
            {!hasSelection && (
              <p className="text-xs text-muted-foreground text-center">Draw a box to enable extraction.</p>
            )}
          </div>
        )}

        {mode === 'text' && (
          <div className="mt-3 grid gap-2">
            <Button
              type="button"
              size="lg"
              onClick={handleExtractFull}
              disabled={ocrLoading || !onRequestOCR}
              className="w-full"
            >
              Extract full text
            </Button>
            <p className="text-xs text-muted-foreground text-center">No drawing needed in this mode.</p>
          </div>
        )}
      </div>

      <Drawer open={resultsOpen} onOpenChange={setResultsOpen}>
        <DrawerContent className="max-h-[75dvh]">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm font-semibold">Extraction results</div>
            <DrawerClose asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close results">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>

          <div className="px-4 pb-4">
            {resultsError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {resultsError}
              </div>
            ) : !resultsText ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                No text detected. Try selecting a clearer area or retry.
              </div>
            ) : (
              <ScrollArea className="max-h-[40dvh]">
                <p className="text-sm whitespace-pre-wrap text-foreground">{resultsText}</p>
              </ScrollArea>
            )}
          </div>

          <div className="px-4 pb-5 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={copyResults} disabled={!resultsText}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
            {onUseAsText && (
              <Button
                type="button"
                onClick={() => {
                  if (!resultsText) return;
                  onUseAsText(resultsText);
                  setResultsOpen(false);
                }}
                disabled={!resultsText}
              >
                Create note
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={handleRetry} disabled={ocrLoading || !lastAction}>
              Retry
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
