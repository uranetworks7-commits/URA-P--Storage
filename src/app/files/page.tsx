
"use client";

import { useAuth } from "@/hooks/use-auth";
import { StoredFile } from "@/lib/types";
import { formatBytes, isImageFile, isVideoFile, isAudioFile } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Search, File as FileIcon, Download, Film, Music, FileQuestion, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function FilesPage() {
  const { userData, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingFile, setViewingFile] = useState<StoredFile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userData?.locked) {
      logout();
    }
  }, [userData?.locked, logout]);

  const files = useMemo(() => {
    if (!userData?.files) return [];
    return Object.entries(userData.files)
      .map(([id, file]) => ({ ...file, id }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [userData?.files]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    return files.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [files, searchTerm]);

  const downloadFile = (file: StoredFile) => {
    try {
      toast({ title: "Starting download...", description: file.name });
      // This is a workaround for cross-origin downloads.
      // It fetches the file and creates a temporary link to trigger the download.
      fetch(file.url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok.');
          }
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        })
        .catch(err => {
          console.error("Download failed:", err);
          toast({ variant: "destructive", title: "Download failed", description: "Could not download the file. Please try again." });
          // Fallback for browsers that block this, or for CORS issues.
          window.open(file.url, '_blank');
        });
    } catch (error) {
      console.error("Download initialization failed:", error);
      toast({ variant: "destructive", title: "Download failed", description: "An unexpected error occurred." });
      window.open(file.url, '_blank');
    }
  };

  const getFileIcon = (file: StoredFile) => {
    if (isImageFile(file.name)) {
      return (
        <Image src={file.url} alt={file.name} layout="fill" className="object-cover rounded-t-lg" />
      );
    }
    if (isVideoFile(file.name)) {
      return <Film className="h-16 w-16 text-muted-foreground" />;
    }
    if (isAudioFile(file.name)) {
      return <Music className="h-16 w-16 text-muted-foreground" />;
    }
    if (file.type === 'application/octet-stream') {
        return <FileQuestion className="h-16 w-16 text-muted-foreground" />;
    }
    return <FileIcon className="h-16 w-16 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Your Files</h1>
        </header>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map(file => (
              <Card key={file.id} className="group relative overflow-hidden aspect-square flex flex-col">
                <CardContent className="flex-grow flex items-center justify-center p-0 relative bg-secondary/30">
                  {getFileIcon(file)}
                </CardContent>
                <CardFooter className="p-2 flex-col items-start bg-card">
                    <p className="text-xs font-bold text-foreground truncate w-full">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </CardFooter>
                 <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setViewingFile(file)}>
                      <Eye className="h-4 w-4" />
                   </Button>
                   <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => downloadFile(file)}>
                      <Download className="h-4 w-4" />
                   </Button>
                 </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {searchTerm ? "No files found for your search." : "You haven't uploaded any files yet."}
            </p>
          </div>
        )}
      </div>

       {viewingFile && (
          <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
              <DialogContent className="max-w-3xl p-2">
                  <DialogHeader>
                      <DialogTitle className="text-base">{viewingFile.name}</DialogTitle>
                  </DialogHeader>
                   <div className="flex items-center justify-center p-4 bg-secondary/20 rounded-lg">
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
                  <DialogFooter className="mt-2">
                       <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setViewingFile(null)}>Close</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        )}

    </div>
  );
}
