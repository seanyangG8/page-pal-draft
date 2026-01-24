import { useState } from 'react';
import { Folder } from '@/types';
import { useFolders, useFolderMutations } from '@/api/hooks';
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
import { toast } from 'sonner';

interface FolderManagerProps {
  selectedFolderId?: string;
  onSelectFolder?: (folderId: string | undefined) => void;
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

export function FolderManager({ selectedFolderId, onSelectFolder }: FolderManagerProps) {
  const { data: folders = [], isLoading } = useFolders();
  const { create, update, remove } = useFolderMutations();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);

  const isMutating = create.isLoading || update.isLoading || remove.isLoading;

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), color });
      toast.success('Folder created');
      setName('');
      setColor(undefined);
      setIsAddOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create folder');
    }
  };

  const handleUpdate = async () => {
    if (!editingFolder || !name.trim()) return;
    try {
      await update.mutateAsync({ id: editingFolder.id, updates: { name: name.trim(), color } });
      toast.success('Folder updated');
      setEditingFolder(null);
      setName('');
      setColor(undefined);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update folder');
    }
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
          onClick={() => onSelectFolder?.(undefined)}
        >
          <FolderIcon className="w-4 h-4" />
          All Notes
        </Button>

        {isLoading && (
          <p className="text-xs text-muted-foreground px-1">Loading folders...</p>
        )}
        
        {folders.map(folder => (
          <div key={folder.id} className="flex items-center group">
            <Button
              variant={selectedFolderId === folder.id ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 justify-start gap-2 h-8"
              onClick={() => onSelectFolder?.(folder.id)}
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
                  onClick={() => remove.mutate(folder.id, { onError: () => toast.error('Failed to delete folder') })}
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
            <Button onClick={handleAdd} disabled={!name.trim() || isMutating}>Create</Button>
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
