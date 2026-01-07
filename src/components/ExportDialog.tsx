import { useState } from 'react';
import { Book, Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download, FileText, FileSpreadsheet, FileJson, FileType } from 'lucide-react';
import { exportToMarkdown, exportToCSV, exportToJSON } from '@/lib/store';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: Note[];
  books: Book[];
  bookTitle?: string;
}

type ExportFormat = 'markdown' | 'csv' | 'json';

const formats: { value: ExportFormat; label: string; icon: typeof FileText; description: string }[] = [
  { 
    value: 'markdown', 
    label: 'Markdown', 
    icon: FileText, 
    description: 'Perfect for Obsidian, Notion, or any text editor' 
  },
  { 
    value: 'csv', 
    label: 'CSV', 
    icon: FileSpreadsheet, 
    description: 'Spreadsheet-friendly, open in Excel or Google Sheets' 
  },
  { 
    value: 'json', 
    label: 'JSON', 
    icon: FileJson, 
    description: 'Full data backup, can be re-imported later' 
  },
];

export function ExportDialog({ open, onOpenChange, notes, books, bookTitle }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');

  const handleExport = () => {
    let content: string;
    let filename: string;
    let mimeType: string;

    const safeName = bookTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'notes';

    switch (format) {
      case 'markdown':
        content = exportToMarkdown(notes, books);
        filename = `${safeName}_export.md`;
        mimeType = 'text/markdown';
        break;
      case 'csv':
        content = exportToCSV(notes, books);
        filename = `${safeName}_export.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        content = exportToJSON(notes, books);
        filename = `${safeName}_export.json`;
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Notes
          </DialogTitle>
          <DialogDescription>
            {notes.length} note{notes.length !== 1 ? 's' : ''} 
            {bookTitle ? ` from "${bookTitle}"` : ''} will be exported
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">Export format</Label>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <div className="space-y-2">
              {formats.map(({ value, label, icon: Icon, description }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    format === value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={value} className="mt-0.5" />
                  <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
