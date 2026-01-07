import { useState } from 'react';
import { Folder } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderPlus, MoreVertical, Trash2, Edit, Folder as FolderIcon } from 'lucide-react';

interface FolderManagerProps {
  folders: Folder[];
  selectedFolderId?: string;
  onSelectFolder: (folderId: string | undefined) => void;
  onAddFolder: (folder: { name: string; color?: string }) => void;
  onDeleteFolder: (id: string) => void;
  onUpdateFolder: (id: string, updates: Partial<Folder>) => void;
}

const folderColors = [
  { name: 'Default', value: undefined },
  { name: 'Red', value: 'hsl(0 72% 51%)' },
  { name: 'Orange', value: 'hsl(25 95% 53%)' },
  { name: 'Yellow', value: 'hsl(48 96% 53%)' },
  { name: 'Green', value: 'hsl(142 71% 45%)' },
  { name: 'Blue', value: 'hsl(217 91% 60%)' },
  { name: 'Purple', value: 'hsl(263 70% 50%)' },
];

export function FolderManager({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  onDeleteFolder,
  onUpdateFolder,
}: FolderManagerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddFolder({ name: name.trim(), color });
    setName('');
    setColor(undefined);
    setIsAddOpen(false);
  };

  const handleUpdate = () => {
    if (!editingFolder || !name.trim()) return;
    onUpdateFolder(editingFolder.id, { name: name.trim(), color });
    setEditingFolder(null);
    setName('');
    setColor(undefined);
  };

  const openEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setName(folder.name);
    setColor(folder.color);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Folders</Label>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => setIsAddOpen(true)}
        >
          <FolderPlus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-1">
        <Button
          variant={selectedFolderId === undefined ? 'secondary' : 'ghost'}
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={() => onSelectFolder(undefined)}
        >
          <FolderIcon className="w-4 h-4" />
          All Notes
        </Button>
        
        {folders.map(folder => (
          <div key={folder.id} className="flex items-center group">
            <Button
              variant={selectedFolderId === folder.id ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 justify-start gap-2 h-8"
              onClick={() => onSelectFolder(folder.id)}
            >
              <FolderIcon 
                className="w-4 h-4" 
                style={{ color: folder.color }}
              />
              {folder.name}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(folder)} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteFolder(folder.id)}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Add Folder Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Folder name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Fiction, Work, Ideas"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {folderColors.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value || 'hsl(var(--muted))' }}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Folder name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Folder name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {folderColors.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value || 'hsl(var(--muted))' }}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingFolder(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
