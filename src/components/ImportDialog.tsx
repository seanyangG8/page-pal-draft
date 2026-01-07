import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { importFromJSON, saveBooks, saveNotes, getBooks, getNotes } from '@/lib/store';
import { Book, Note } from '@/types';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ books: number; notes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          // Merge with existing data (avoid duplicates by ID)
          const existingBooks = getBooks();
          const existingNotes = getNotes();
          
          const existingBookIds = new Set(existingBooks.map(b => b.id));
          const existingNoteIds = new Set(existingNotes.map(n => n.id));
          
          const newBooks = data.books.filter(b => !existingBookIds.has(b.id));
          const newNotes = data.notes.filter(n => !existingNoteIds.has(n.id));
          
          saveBooks([...existingBooks, ...newBooks]);
          saveNotes([...existingNotes, ...newNotes]);
          
          onImportComplete();
          onOpenChange(false);
          setFile(null);
          setPreview(null);
        }
      } catch {
        setError('Failed to import data.');
      } finally {
        setImporting(false);
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
    <Dialog open={open} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Notes
          </DialogTitle>
          <DialogDescription>
            Import notes from a previously exported Marginalia JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
              className="w-full p-8 border-2 border-dashed border-border rounded-lg text-center hover:border-primary/50 transition-colors"
            >
              <FileJson className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Click to select a JSON file</p>
              <p className="text-sm text-muted-foreground mt-1">
                Only Marginalia export files are supported
              </p>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <FileJson className="w-8 h-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Change
                </Button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {preview && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 text-success">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Ready to import</p>
                    <p>{preview.books} book{preview.books !== 1 ? 's' : ''} and {preview.notes} note{preview.notes !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!preview || importing}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
