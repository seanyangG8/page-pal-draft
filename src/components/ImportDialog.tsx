import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { importFromJSON } from '@/api/exportImport';
import { Book, Note } from '@/types';
import { useBookMutations, useNoteMutations } from '@/api/hooks';
import { toast } from 'sonner';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ books: number; notes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { create: createBook } = useBookMutations();
  const { create: createNote } = useNoteMutations();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = importFromJSON(content);
        if (data) {
          setPreview({ books: data.books.length, notes: data.notes.length });
        } else {
          setError('Invalid file format. Please use a JSON file exported from Marginalia.');
        }
      } catch {
        setError('Failed to read file. Please ensure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = importFromJSON(content);
        
        if (data) {
          // Simple sequential import: create new books/notes for this user
          const run = async () => {
            const idMap = new Map<string, string>();
            for (const b of data.books) {
              const created = await createBook.mutateAsync({
                title: b.title,
                author: b.author,
                format: b.format,
                coverUrl: b.coverUrl,
                isbn: b.isbn,
              });
              idMap.set(b.id, created.id);
            }
            for (const n of data.notes) {
              const bookId = idMap.get(n.bookId);
              if (!bookId) continue;
              await createNote.mutateAsync({
                bookId,
                type: n.type,
                mediaType: n.mediaType,
                content: n.content,
                imageUrl: n.imageUrl,
                extractedText: n.extractedText,
                audioUrl: n.audioUrl,
                audioDuration: n.audioDuration,
                transcript: (n as any).transcript,
                location: n.location,
                timestamp: n.timestamp,
                chapter: n.chapter,
                context: n.context,
                tags: n.tags,
                aiSummary: n.aiSummary,
                aiExpanded: n.aiExpanded,
                aiFlashcard: n.aiFlashcard,
                isPrivate: n.isPrivate ?? true,
                reviewCount: n.reviewCount ?? 0,
                lastReviewedAt: n.lastReviewedAt,
                nextReviewAt: n.nextReviewAt,
                folderId: undefined,
              });
            }
            toast.success(`Imported ${data.books.length} books and ${data.notes.length} notes`);
            onOpenChange(false);
            setFile(null);
            setPreview(null);
          };
          run().catch(() => {
            setError('Failed to import data.');
          }).finally(() => setImporting(false));
        }
      } catch {
        setError('Failed to import data.');
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Notes
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Import notes from a previously exported Marginalia JSON file.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!file ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 sm:p-8 border-2 border-dashed border-border rounded-xl text-center hover:border-primary/50 transition-colors touch-manipulation active:bg-secondary/50"
            >
              <FileJson className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-sm sm:text-base">Click to select a JSON file</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Only Marginalia export files are supported
              </p>
            </button>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                <FileJson className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Change
                </Button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {preview && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-success/10 text-success">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Ready to import</p>
                    <p>{preview.books} book{preview.books !== 1 ? 's' : ''} and {preview.notes} note{preview.notes !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!preview || importing}
            className="gap-2 flex-1 sm:flex-initial"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
