
"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useAuth } from "@/hooks/use-auth";
import { uploadFileAndSave, uploadFileFromUrlAndSave } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { FileUp, UploadCloud, Info, Link } from "lucide-react";
import { Progress } from "./ui/progress";

type FormState = {
  success: boolean;
  message: string;
};

const initialState: FormState = {
  success: false,
  message: "",
};

const ONE_MB = 1048576;

export function FilesPane({ isOverQuota }: { isOverQuota: boolean }) {
  const { userId } = useAuth();
  const [state, formAction] = useActionState(uploadFileAndSave, initialState);
  const [urlState, urlFormAction] = useActionState(uploadFileFromUrlAndSave, initialState);
  const [isPending, startTransition] = useTransition();
  const [isUrlPending, startUrlTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const urlFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const [isUrlDialogOpen, setUrlDialogOpen] = useState(false);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
        formRef.current?.reset();
        setFileName(null);
        setFileSize(null);
        setFileTooLarge(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: state.message,
        });
      }
    }
  }, [state, toast]);

   useEffect(() => {
    if (urlState.message) {
      if (urlState.success) {
        toast({ title: "Success", description: urlState.message });
        urlFormRef.current?.reset();
        setUrlDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: urlState.message,
        });
      }
    }
  }, [urlState, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
      if (file.size > ONE_MB) {
        setFileTooLarge(true);
      } else {
        setFileTooLarge(false);
      }
    } else {
      setFileName(null);
      setFileSize(null);
      setFileTooLarge(false);
    }
  };

  const handleFormAction = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

  const handleUrlFormAction = (formData: FormData) => {
    startUrlTransition(() => {
        urlFormAction(formData);
    });
  };

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="font-headline text-base flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          Upload a File
        </CardTitle>
        <CardDescription className="text-xs">
          Files are encrypted and stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <form ref={formRef} action={handleFormAction} className="space-y-2">
          <input type="hidden" name="userId" value={userId || ""} />
          <div className="space-y-1">
            <Label htmlFor="file-input" className="text-xs">Select file to upload directly</Label>
            <Input
              id="file-input"
              name="file"
              type="file"
              required
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isPending || isOverQuota}
              className="file:text-primary file:font-semibold h-8 text-xs"
            />
          </div>

          {fileName && fileSize !== null && (
            <div className="text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{fileName}</span> ({formatBytes(fileSize)})
            </div>
          )}

          {fileTooLarge && (
            <p className="text-xs text-destructive">File too large (max 1MB). Please use the URL upload option for larger files.</p>
          )}
          
          {isPending && <Progress value={undefined} className="animate-pulse h-1.5" />}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{isOverQuota ? 'Storage full.' : 'Max 1GB total.'}</p>
            <Button type="submit" size="sm" disabled={isPending || isOverQuota || fileTooLarge} className="h-8 text-xs">
              <FileUp className="mr-2 h-3 w-3" />
              {isPending ? "Uploading..." : "Upload & Save"}
            </Button>
          </div>
        </form>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <Dialog open={isUrlDialogOpen} onOpenChange={setUrlDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-9 text-xs">
                    <Link className="mr-2 h-4 w-4"/>
                    Upload from URL
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base">Upload from URL</DialogTitle>
                    <DialogDescription className="text-xs">Paste a direct link to a file to upload it to your storage.</DialogDescription>
                </DialogHeader>
                <form ref={urlFormRef} action={handleUrlFormAction} className="space-y-3">
                     <input type="hidden" name="userId" value={userId || ""} />
                    <div className="space-y-1">
                        <Label htmlFor="url-input" className="text-xs">File URL</Label>
                        <Input
                            id="url-input"
                            name="url"
                            type="url"
                            placeholder="https://example.com/file.jpg"
                            required
                            disabled={isUrlPending}
                            className="h-8 text-xs"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" size="sm" className="h-8 text-xs" disabled={isUrlPending}>
                            <Link className="mr-2 h-3 w-3" />
                            {isUrlPending ? "Uploading..." : "Upload from URL"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

    