"use client";

import { useAuth } from "@/hooks/use-auth";
import type { DiaryEntry, StoredFile } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { deleteItem } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Book, File, Trash2, ExternalLink, Database } from "lucide-react";

type ItemToDelete = {
  id: string;
  type: 'diary' | 'files';
};

export function ManagePane() {
  const { userId, userData } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const diaryEntries = userData?.diary ? Object.entries(userData.diary).sort((a, b) => b[1].timestamp - a[1].timestamp) : [];
  const files = userData?.files ? Object.entries(userData.files).sort((a, b) => b[1].timestamp - a[1].timestamp) : [];

  const handleDelete = async (item: ItemToDelete) => {
    if (!userId) return;
    setIsDeleting(true);
    const result = await deleteItem(userId, item.type, item.id);
    if (result.success) {
      toast({ title: "Success", description: "Item deleted successfully." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsDeleting(false);
  };

  const DeleteButton = ({ item }: { item: ItemToDelete }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this item from your storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete(item)}>
            {isDeleting ? "Deleting..." : "Continue"}
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
          View, open, or delete your saved entries and files.
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
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteButton item={{ id, type: 'diary' }} />
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
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button asChild variant="outline" size="sm">
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4"/>
                                </a>
                            </Button>
                            <DeleteButton item={{ id, type: 'files' }} />
                        </div>
                    </div>
                    <Separator className="my-2" />
                </div>
              )) : <p className="text-muted-foreground text-center pt-4">No files uploaded yet.</p>}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
