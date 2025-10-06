
      
"use client";

import { useAuth } from "@/hooks/use-auth";
import type { DiaryEntry, StoredFile } from "@/lib/types";
import { formatBytes, isImageFile, isVideoFile, isAudioFile } from "@/lib/utils";
import { deleteItem, saveDiaryEntry, updateDiaryEntry, uploadFileFromUrlAndSave } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useActionState, useEffect, useMemo } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Book, File as FileIcon, Trash2, ExternalLink, Database, Download, FolderOpen, Pencil, Save, Share2, Upload, Copy, AlertCircle, Inbox, Eye, Film, Music, FileQuestion, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ZIcon = () => (
  <div style={{
    width: '20px',
    height: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    borderRadius: '4px',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
    transform: 'perspective(100px) rotateY(-10deg)',
  }}>
    Z
  </div>
);


type ItemToDelete = {
  id: string;
  type: 'diary' | 'files';
  data: DiaryEntry | StoredFile;
};

type ItemToEdit = {
  id: string;
  data: DiaryEntry;
};

type FormState = {
  success: boolean;
  message: string;
};

type SharedData = {
  diary: DiaryEntry[];
  files: StoredFile[];
};

const initialFormState: FormState = {
  success: false,
  message: "",
};

export function ManagePane() {
  const { userId, userData } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);
  const [viewingFile, setViewingFile] = useState<StoredFile | null>(null);
  const [editingEntry, setEditingEntry] = useState<ItemToEdit | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const deleteConfirmInputRef = useRef<HTMLInputElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [selectedDiary, setSelectedDiary] = useState<Record<string, boolean>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
  const [parsedImportData, setParsedImportData] = useState<SharedData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedItems, setImportedItems] = useState<SharedData>({ diary: [], files: [] });
  const [isImportedFolderOpen, setImportedFolderOpen] = useState(false);

  const shareCodeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<StoredFile | null>(null);
  const fileUrlTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [sharedFileUrl, setSharedFileUrl] = useState<string | null>(null);
  const sharedFileUrlTextareaRef = useRef<HTMLTextAreaElement>(null);


  const [editState, editFormAction, isEditPending] = useActionState(updateDiaryEntry, initialFormState);

  useEffect(() => {
    if (editState.message) {
        if(editState.success) {
            toast({ title: "Success", description: editState.message });
            setEditingEntry(null);
        } else {
            toast({ variant: "destructive", title: "Error", description: editState.message });
        }
    }
  }, [editState, toast]);

  useEffect(() => {
    if (shareCode && shareCodeTextareaRef.current) {
        shareCodeTextareaRef.current.select();
    }
  }, [shareCode]);

  useEffect(() => {
    if (viewingFileUrl && fileUrlTextareaRef.current) {
        fileUrlTextareaRef.current.select();
    }
  }, [viewingFileUrl]);

  useEffect(() => {
    if (sharedFileUrl && sharedFileUrlTextareaRef.current) {
      sharedFileUrlTextareaRef.current.select();
    }
  }, [sharedFileUrl]);


  const diaryEntries = useMemo(() => userData?.diary ? Object.entries(userData.diary).sort((a, b) => b[1].timestamp - a[1].timestamp) : [], [userData?.diary]);
  const files = useMemo(() => userData?.files ? Object.entries(userData.files).sort((a, b) => b[1].timestamp - a[1].timestamp) : [], [userData?.files]);

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

  const downloadFile = async (file: StoredFile) => {
    try {
      toast({ title: "Starting download...", description: file.name });
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the file. Please try again.",
      });
    }
  };
  
  const handleGenerateShareCode = () => {
    const dataToShare: SharedData = {
      diary: diaryEntries.filter(([id]) => selectedDiary[id]).map(([, entry]) => entry),
      files: files.filter(([id]) => selectedFiles[id]).map(([, file]) => file)
    };

    if (dataToShare.diary.length === 0 && dataToShare.files.length === 0) {
      toast({ variant: "destructive", title: "Nothing Selected", description: "Please select at least one item to share." });
      return;
    }

    try {
      const jsonString = JSON.stringify(dataToShare);
      const encoded = btoa(unescape(encodeURIComponent(jsonString))); 
      setShareCode(encoded);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not generate share code." });
    }
  };

  const handleParseImportCode = () => {
    if (!importCode) {
      setParsedImportData(null);
      return;
    }
    try {
      const decoded = decodeURIComponent(escape(atob(importCode)));
      const parsed: SharedData = JSON.parse(decoded);

      if (!parsed || (!parsed.diary && !parsed.files)) {
        throw new Error("Invalid data structure");
      }
      setParsedImportData(parsed);
    } catch (e) {
      setParsedImportData(null);
      toast({ variant: "destructive", title: "Invalid Code", description: "The share code is malformed or invalid." });
    }
  };
  
  const handleFinalizeImport = async () => {
    if (!parsedImportData || !userId) return;
    setIsImporting(true);

    const newlyImported: SharedData = { diary: [], files: [] };

    let diarySuccess = 0;
    let filesSuccess = 0;

    for (const entry of parsedImportData.diary) {
      const formData = new FormData();
      formData.set('userId', userId);
      formData.set('text', entry.text);
      const result = await saveDiaryEntry({ success: false, message: '' }, formData);
      if (result.success) {
        diarySuccess++;
        newlyImported.diary.push(entry);
      }
    }

    for (const file of parsedImportData.files) {
      try {
        const formData = new FormData();
        formData.set('userId', userId);
        formData.set('url', file.url);
        
        const result = await uploadFileFromUrlAndSave({ success: false, message: '' }, formData);

        if (result.success) {
            filesSuccess++;
            newlyImported.files.push(file);
        } else {
            throw new Error(result.message);
        }
      } catch (error) {
        console.error("Failed to import file:", file.name, error);
        toast({
          variant: "destructive",
          title: "Import Error",
          description: `Could not import file: ${file.name}. It may no longer be available.`,
        });
      }
    }
    
    setImportedItems(prev => ({
      diary: [...prev.diary, ...newlyImported.diary],
      files: [...prev.files, ...newlyImported.files],
    }));

    setIsImporting(false);
    setImportDialogOpen(false);
    setImportCode('');
    setParsedImportData(null);
    
    toast({ title: "Import Complete", description: `Imported ${diarySuccess} diary entries and ${filesSuccess} files.` });
  };
  
  const handleShowSharedFileUrl = () => {
    const firstSelectedFileId = Object.keys(selectedFiles).find(id => selectedFiles[id]);
    if (!firstSelectedFileId) {
      toast({ variant: "destructive", title: "No File Selected", description: "Please select a file to see its URL." });
      return;
    }
    const fileEntry = files.find(([id]) => id === firstSelectedFileId);
    if (fileEntry) {
      setSharedFileUrl(fileEntry[1].url);
    }
  };

  const DeleteDialog = () => (
     <AlertDialog open={!!itemToDelete} onOpenChange={() => { setItemToDelete(null); setDeleteConfirmText(""); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is permanent. To confirm, type <strong>delete</strong> below.
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

  const getFileIcon = (file: StoredFile) => {
    if (isImageFile(file.name)) {
      return null;
    }
    if (isVideoFile(file.name)) {
      return <Film className="h-6 w-6 text-muted-foreground" />;
    }
    if (isAudioFile(file.name)) {
      return <Music className="h-6 w-6 text-muted-foreground" />;
    }
    if (file.type === 'application/octet-stream') {
        return <FileQuestion className="h-6 w-6 text-muted-foreground" />;
    }
    return <FileIcon className="h-6 w-6 text-muted-foreground" />;
  }

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="font-headline text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Manage Your Data
        </CardTitle>
        <CardDescription className="text-xs">
          View, edit, or delete your entries and files.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <h3 className="font-semibold mb-1 text-xs flex items-center gap-2"><Book className="h-3 w-3"/>Diary Entries</h3>
            <ScrollArea className="h-48 rounded-md border p-1">
              {diaryEntries.length > 0 ? diaryEntries.map(([id, entry]: [string, DiaryEntry]) => (
                <div key={id} className="group mb-1 last:mb-0">
                    <div className="flex justify-between items-start text-xs p-1">
                        <div>
                            <p className="font-semibold text-xs">{new Date(entry.timestamp).toLocaleString()}</p>
                            <p className="text-muted-foreground truncate max-w-[120px] text-xs">{entry.text}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setViewingEntry(entry)}><FolderOpen className="h-3 w-3"/></Button>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setEditingEntry({ id, data: entry })}><Pencil className="h-3 w-3"/></Button>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => downloadDiaryEntry(entry)}><Download className="h-3 w-3"/></Button>
                            <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({ id, type: 'diary', data: entry })}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                    </div>
                    <Separator className="my-1" />
                </div>
              )) : <p className="text-muted-foreground text-center text-xs pt-4">No diary entries found.</p>}
            </ScrollArea>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-xs flex items-center gap-2">
                <FileIcon className="h-3 w-3" />
                Uploaded Files
              </h3>
              <Link href="/files" className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline">
                <span>Your files</span>
                <Image src="https://files.catbox.moe/09twlp.png" alt="Files" width={20} height={20} className="rounded-sm" />
              </Link>
            </div>
             <ScrollArea className="h-48 rounded-md border p-1">
              {files.length > 0 ? files.map(([id, file]: [string, StoredFile]) => (
                <div key={id} className="group mb-1 last:mb-0">
                    <div className="flex justify-between items-center text-xs p-1">
                        <div className="flex items-center gap-2">
                            {isImageFile(file.name) ? (
                                <Image src={file.url} alt={file.name} width={32} height={32} className="object-cover rounded-sm h-8 w-8" />
                            ) : (
                                getFileIcon(file)
                            )}
                            <div>
                                <p className="font-semibold truncate max-w-[120px] text-xs">{file.name}</p>
                                <p className="text-muted-foreground text-xs">{formatBytes(file.size)} &middot; {new Date(file.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setViewingFileUrl(file)}>
                                <LinkIcon className="h-3 w-3"/>
                            </Button>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setViewingFile(file)}>
                                <Eye className="h-3 w-3"/>
                            </Button>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => downloadFile(file)}>
                                <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({ id, type: 'files', data: file })}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                    </div>
                    <Separator className="my-1" />
                </div>
              )) : <p className="text-muted-foreground text-center text-xs pt-4">No files uploaded yet.</p>}
            </ScrollArea>
          </div>
        </div>
        
        <Separator className="my-3" />
        <div>
            <h3 className="font-semibold mb-1 text-xs flex items-center gap-2"><FolderOpen className="h-4 w-4"/>Local Folder</h3>
            <div className="p-2 border rounded-lg bg-secondary/30 flex items-center justify-center space-x-2">
                <Dialog open={isImportedFolderOpen} onOpenChange={setImportedFolderOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs"><Inbox className="mr-2 h-3 w-3"/> My Imported Folder</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base">My Imported Folder</DialogTitle>
                            <DialogDescription className="text-xs">Data you have imported from other users.</DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-3 max-h-[60vh]">
                            <div>
                                <h4 className="font-semibold mb-2 text-xs">Diary Entries ({importedItems.diary.length})</h4>
                                <ScrollArea className="h-48 rounded-md border p-2">
                                {importedItems.diary.length > 0 ? importedItems.diary.map((entry, index) => (
                                    <div key={`imported-diary-${index}`} className="group mb-1 last:mb-0">
                                        <div className="flex justify-between items-start text-xs p-1">
                                            <div>
                                                <p className="font-semibold">{new Date(entry.timestamp).toLocaleString()}</p>
                                                <p className="text-muted-foreground truncate max-w-xs">{entry.text}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setViewingEntry(entry)}><FolderOpen className="h-3 w-3"/></Button>
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => downloadDiaryEntry(entry)}><Download className="h-3 w-3"/></Button>
                                            </div>
                                        </div>
                                        {index < importedItems.diary.length - 1 && <Separator className="my-1" />}
                                    </div>
                                )) : <p className="text-xs text-muted-foreground text-center py-4">No imported diary entries.</p>}
                                </ScrollArea>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-xs">Files ({importedItems.files.length})</h4>
                                <ScrollArea className="h-48 rounded-md border p-2">
                                {importedItems.files.length > 0 ? importedItems.files.map((file, index) => (
                                     <div key={`imported-file-${index}`} className="group mb-1 last:mb-0">
                                        <div className="flex justify-between items-center text-xs p-1">
                                            <div>
                                                <p className="font-semibold truncate max-w-[150px]">{file.name}</p>
                                                <p className="text-muted-foreground">{formatBytes(file.size)}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button asChild variant="outline" size="icon" className="h-6 w-6"><a href={file.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3"/></a></Button>
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => downloadFile(file)}><Download className="h-3 w-3" /></Button>
                                            </div>
                                        </div>
                                        {index < importedItems.files.length - 1 && <Separator className="my-1" />}
                                    </div>
                                )) : <p className="text-xs text-muted-foreground text-center py-4">No imported files.</p>}
                                </ScrollArea>
                            </div>
                        </div>
                        <DialogFooter className="mt-2">
                            <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => setImportedFolderOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                <Dialog open={isShareDialogOpen} onOpenChange={(open) => { setShareDialogOpen(open); if(!open) { setShareCode(''); setSelectedDiary({}); setSelectedFiles({});} }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs"><Share2 className="mr-2 h-3 w-3" /> Share</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="text-base">Share Your Data</DialogTitle>
                      <DialogDescription className="text-xs">Select items and generate a share code.</DialogDescription>
                    </DialogHeader>
                    {!shareCode ? (
                        <>
                        <div className="grid grid-cols-2 gap-3 max-h-[50vh]">
                            <div className="space-y-1">
                                <Label className="text-xs">Diary Entries</Label>
                                <ScrollArea className="h-48 rounded-md border p-2">
                                  {diaryEntries.map(([id, entry]) => (
                                    <div key={id} className="flex items-center space-x-2 p-1">
                                      <Checkbox id={`diary-${id}`} onCheckedChange={(checked) => setSelectedDiary(prev => ({ ...prev, [id]: !!checked }))} />
                                      <label htmlFor={`diary-${id}`} className="text-xs cursor-pointer">{new Date(entry.timestamp).toLocaleDateString()}: {entry.text.substring(0, 20)}...</label>
                                    </div>
                                  ))}
                                </ScrollArea>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Files</Label>
                                <ScrollArea className="h-48 rounded-md border p-2">
                                  {files.map(([id, file]) => (
                                    <div key={id} className="flex items-center space-x-2 p-1">
                                      <Checkbox id={`file-${id}`} onCheckedChange={(checked) => setSelectedFiles(prev => ({...prev, [id]: !!checked }))} />
                                      <label htmlFor={`file-${id}`} className="text-xs cursor-pointer truncate">{file.name}</label>
                                    </div>
                                  ))}
                                </ScrollArea>
                            </div>
                        </div>
                        <DialogFooter className="mt-2">
                            <Button onClick={handleGenerateShareCode} size="sm" className="h-8 text-xs">Generate Code</Button>
                        </DialogFooter>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-xs">Your Share Code</Label>
                            <Textarea ref={shareCodeTextareaRef} readOnly value={shareCode} rows={5} className="font-mono text-xs" />
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">This code is now selected. Press and hold to copy.</p>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleShowSharedFileUrl}>
                                        <LinkIcon className="h-4 w-4"/>
                                    </Button>
                                    <Button size="sm" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(shareCode); toast({ title: "Copied!", description: "Share code copied to clipboard." })}}>
                                        <Copy className="mr-2 h-3 w-3"/> Copy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Dialog open={isImportDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if(!open) { setImportCode(''); setParsedImportData(null); } }}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-8 text-xs"><Upload className="mr-2 h-3 w-3"/> Import</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-base">Import Data</DialogTitle>
                      <DialogDescription className="text-xs">Paste a share code to import data.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Paste your share code here..." 
                        value={importCode} 
                        onChange={(e) => setImportCode(e.target.value)}
                        rows={3}
                        className="text-xs"
                      />
                      <Button onClick={handleParseImportCode} size="sm" className="h-8 text-xs" disabled={!importCode}>Verify Code</Button>
                    </div>
                    {parsedImportData && (
                        <div className="space-y-2 pt-2 border-t">
                            <h4 className="font-semibold text-xs">Data to Import</h4>
                            <p className="text-xs"><span className="font-bold">{parsedImportData.diary.length}</span> diary entries</p>
                            <p className="text-xs"><span className="font-bold">{parsedImportData.files.length}</span> files</p>
                            <Alert variant="destructive" className="p-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-xs font-bold">Warning</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Importing uses your storage quota and cannot be easily undone.
                                </AlertDescription>
                            </Alert>
                             <DialogFooter className="mt-2">
                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setImportCode(''); setParsedImportData(null); }}>Clear</Button>
                                <Button onClick={handleFinalizeImport} size="sm" className="h-8 text-xs" disabled={isImporting}>
                                    {isImporting ? "Importing..." : `Import ${parsedImportData.diary.length + parsedImportData.files.length} items`}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                  </DialogContent>
                </Dialog>

            </div>
        </div>
        
        <DeleteDialog />
        {viewingEntry && (
          <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">Diary Entry</DialogTitle>
                <DialogDescription className="text-xs">{new Date(viewingEntry.timestamp).toLocaleString()}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[40vh] rounded-md border p-3 my-2">
                <p className="text-xs whitespace-pre-wrap">{viewingEntry.text}</p>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setViewingEntry(null)}>Close</Button>
                <Button size="sm" className="h-8 text-xs" onClick={() => downloadDiaryEntry(viewingEntry)}>
                  <Download className="mr-2 h-3 w-3" />
                  Download
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {viewingFile && (
          <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
              <DialogContent className="max-w-3xl p-2">
                  <DialogHeader>
                      <DialogTitle className="text-base">{viewingFile.name}</DialogTitle>
                  </DialogHeader>
                   <div className="flex items-center justify-center p-4">
                     {isImageFile(viewingFile.name) && (
                         <Image src={viewingFile.url} alt={viewingFile.name} width={800} height={600} className="object-contain max-h-[70vh] rounded" />
                     )}
                     {isVideoFile(viewingFile.name) && (
                         <video src={viewingFile.url} controls className="max-h-[70vh] rounded w-full">
                             Your browser does not support the video tag.
                         </video>
                     )}
                      {isAudioFile(viewingFile.name) && (
                         <audio src={viewingFile.url} controls className="w-full">
                             Your browser does not support the audio element.
                         </audio>
                     )}
                      {!isImageFile(viewingFile.name) && !isVideoFile(viewingFile.name) && !isAudioFile(viewingFile.name) && (
                        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-secondary/30 rounded-lg">
                            {viewingFile.type === 'application/octet-stream' ? <FileQuestion className="h-16 w-16 text-muted-foreground" /> : <FileIcon className="h-16 w-16 text-muted-foreground" />}
                            <div className="text-center text-sm">
                                <p className="font-semibold">{viewingFile.name}</p>
                                <p className="text-muted-foreground">{formatBytes(viewingFile.size)}</p>
                                <p className="text-muted-foreground">{viewingFile.type}</p>
                            </div>
                            <Button size="sm" className="h-8 text-xs" onClick={() => downloadFile(viewingFile)}>
                                <Download className="mr-2 h-3 w-3" />
                                Download File
                            </Button>
                        </div>
                      )}
                   </div>
                  <DialogFooter>
                       <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setViewingFile(null)}>Close</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        )}
        {editingEntry && (
          <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
            <DialogContent className="max-w-md">
                <form ref={editFormRef} action={editFormAction}>
                    <input type="hidden" name="userId" value={userId || ""} />
                    <input type="hidden" name="entryId" value={editingEntry.id} />
                    <DialogHeader>
                        <DialogTitle className="text-base">Edit Diary Entry</DialogTitle>
                        <DialogDescription className="text-xs">Last updated: {new Date(editingEntry.data.timestamp).toLocaleString()}</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label htmlFor="edit-diary-text" className="sr-only">Diary Text</Label>
                        <Textarea
                            id="edit-diary-text"
                            name="text"
                            defaultValue={editingEntry.data.text}
                            required
                            rows={8}
                            className="max-h-[40vh] text-xs"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditingEntry(null)}>Cancel</Button>
                        <Button type="submit" size="sm" className="h-8 text-xs" disabled={isEditPending}>
                            <Save className="mr-2 h-3 w-3" />
                            {isEditPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
        )}
        {viewingFileUrl && (
          <Dialog open={!!viewingFileUrl} onOpenChange={() => setViewingFileUrl(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base">File URL</DialogTitle>
                    <DialogDescription className="text-xs">
                        This is the direct URL to your file.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Textarea ref={fileUrlTextareaRef} readOnly value={viewingFileUrl.url} rows={4} className="font-mono text-xs" />
                    <p className="text-xs text-muted-foreground">The URL is now selected. Press and hold or right-click to copy.</p>
                </div>
                 <DialogFooter>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setViewingFileUrl(null)}>Close</Button>
                     <Button size="sm" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(viewingFileUrl.url); toast({ title: "Copied!", description: "File URL copied to clipboard." })}}>
                        <Copy className="mr-2 h-3 w-3"/> Copy
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {sharedFileUrl && (
          <Dialog open={!!sharedFileUrl} onOpenChange={() => setSharedFileUrl(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base">Shared File URL</DialogTitle>
                    <DialogDescription className="text-xs">
                        This is the direct URL to the shared file.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Textarea ref={sharedFileUrlTextareaRef} readOnly value={sharedFileUrl} rows={4} className="font-mono text-xs" />
                    <p className="text-xs text-muted-foreground">The URL is now selected. Press and hold to copy.</p>
                </div>
                 <DialogFooter>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSharedFileUrl(null)}>Close</Button>
                     <Button size="sm" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(sharedFileUrl); toast({ title: "Copied!", description: "File URL copied to clipboard." })}}>
                        <Copy className="mr-2 h-3 w-3"/> Copy
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

    