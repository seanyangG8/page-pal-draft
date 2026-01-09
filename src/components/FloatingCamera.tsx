import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingCameraProps {
  onCapture: (data: { url: string; extractedText?: string }) => void;
  className?: string;
}

export function FloatingCamera({ onCapture, className }: FloatingCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onCapture({ url, extractedText: undefined });
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all hover:scale-105",
          className
        )}
      >
        <Camera className="w-6 h-6" />
      </Button>
    </>
  );
}