"use client";

import { useAuth } from "@/hooks/use-auth";
import type { DiaryEntry, StoredFile } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { deleteItem, saveDiaryEntry } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Book, File, Trash2, ExternalLink, Database, Download, FolderOpen } from "lucide-react";

type ItemToDelete = {
  id: string;
  type: 'diary' | 'files';
  data: DiaryEntry | StoredFile;
};

export function ManagePane() {
  const { userId, userData } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const deleteConfirmInputRef = useRef<HTMLInputElement>(null);


  const diaryEntries = userData?.diary ? Object.entries(userData.diary).sort((a, b) => b[1].timestamp - a[1].timestamp) : [];
  const files = userData?.files ? Object.entries(userData.files).sort((a, b) => b[1].timestamp - a[1].timestamp) : [];

  const handleUndo = async (item: ItemToDelete) => {
    if (!userId || item.type !== 'diary') return;
    
    const entryToRestore = item.data as DiaryEntry;
    const formData = new FormData();
    formData.set('userId', userId);
    formData.set('text', entryToRestore.text);
    
    const result = await saveDiaryEntry({success: false, message: ''}, formData);

    if (result.success) {
        toast({ title: "Restored", description: "The diary entry has been restored." });
    } else {
        toast({ variant: "destructive", title: "Error", description: "Could not restore the entry." });
    }
  };

  const handleDelete = async (item: ItemToDelete) => {
    if (!userId) return;
    setIsDeleting(true);
    const result = await deleteItem(userId, item.type, item.id);
    if (result.success) {
      toast({ 
        title: "Item Deleted", 
        description: "The item has been removed.",
        action: item.type === 'diary' ? (
          <Button variant="secondary" size="sm" onClick={() => handleUndo(item)}>
            Undo
          </Button>
        ) : undefined,
      });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsDeleting(false);
    setItemToDelete(null);
    setDeleteConfirmText("");
  };

  const downloadDiaryEntry = (entry: DiaryEntry) => {
    const blob = new Blob([entry.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diary-entry-${new Date(entry.timestamp).toISOString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const downloadFile = (file: StoredFile) => {
    // For cross-origin files, we can only open them in a new tab.
    // The browser will decide whether to display or download based on Content-Disposition.
    // Catbox.moe doesn't set attachment, so it will open in a new tab.
    // A true download would require a server-side proxy.
    window.open(file.url, '_blank');
  };

  const DeleteDialog = () => (
     <AlertDialog open={!!itemToDelete} onOpenChange={() => { setItemToDelete(null); setDeleteConfirmText(""); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item.
            To confirm, please type <strong>delete</strong> below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input 
          ref={deleteConfirmInputRef}
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="type 'delete' to confirm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
            onClick={() => itemToDelete && handleDelete(itemToDelete)}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Database />
            Manage Your Data
        </CardTitle>
        <CardDescription>
          View, open, download, or delete your saved entries and files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Book className="h-5 w-5"/>Diary Entries</h3>
            <ScrollArea className="h-72 rounded-md border p-4">
              {diaryEntries.length > 0 ? diaryEntries.map(([id, entry]: [string, DiaryEntry]) => (
                <div key={id} className="group mb-2 last:mb-0">
                    <div className="flex justify-between items-start text-sm">
                        <div>
                            <p className="font-semibold">{new Date(entry.timestamp).toLocaleString()}</p>
                            <p className="text-muted-foreground truncate max-w-xs">{entry.text}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="sm" onClick={() => setViewingEntry(entry)}><FolderOpen className="h-4 w-4"/></Button>
                            <Button variant="outline" size="sm" onClick={() => downloadDiaryEntry(entry)}><Download className="h-4 w-4"/></Button>
                            <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ id, type: 'diary', data: entry })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <Separator className="my-2" />
                </div>
              )) : <p className="text-muted-foreground text-center pt-4">No diary entries found.</p>}
            </ScrollArea>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><File className="h-5 w-5"/>Uploaded Files</h3>
             <ScrollArea className="h-72 rounded-md border p-4">
              {files.length > 0 ? files.map(([id, file]: [string, StoredFile]) => (
                <div key={id} className="group mb-2 last:mb-0">
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-semibold truncate max-w-[200px]">{file.name}</p>
                            <p className="text-muted-foreground">{formatBytes(file.size)}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button asChild variant="outline" size="sm">
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4"/>
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadFile(file)}>
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ id, type: 'files', data: file })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <Separator className="my-2" />
                </div>
              )) : <p className="text-muted-foreground text-center pt-4">No files uploaded yet.</p>}
            </ScrollArea>
          </div>
        </div>
        <DeleteDialog />
        {viewingEntry && (
          <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Diary Entry</DialogTitle>
                <DialogDescription>{new Date(viewingEntry.timestamp).toLocaleString()}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] rounded-md border p-4 my-4">
                <p className="text-sm whitespace-pre-wrap">{viewingEntry.text}</p>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingEntry(null)}>Close</Button>
                <Button onClick={() => downloadDiaryEntry(viewingEntry)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
