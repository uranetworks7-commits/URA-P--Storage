"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useAuth } from "@/hooks/use-auth";
import { uploadFileAndSave } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, UploadCloud } from "lucide-react";
import { Progress } from "./ui/progress";

type FormState = {
  success: boolean;
  message: string;
};

const initialState: FormState = {
  success: false,
  message: "",
};

export function FilesPane({ isOverQuota }: { isOverQuota: boolean }) {
  const { userId } = useAuth();
  const [state, formAction] = useActionState(uploadFileAndSave, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
        formRef.current?.reset();
        setFileName(null);
        setFileSize(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(file.size);
    } else {
      setFileName(null);
      setFileSize(null);
    }
  };

  const handleFormAction = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <UploadCloud />
          Upload a File
        </CardTitle>
        <CardDescription>
          Upload images, videos, or any other file. They will be stored securely via Catbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleFormAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId || ""} />
          <div className="space-y-2">
            <Label htmlFor="file-input">Select file</Label>
            <Input
              id="file-input"
              name="file"
              type="file"
              required
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isPending || isOverQuota}
              className="file:text-primary file:font-semibold"
            />
          </div>

          {fileName && fileSize !== null && (
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{fileName}</span> ({formatBytes(fileSize)})
            </div>
          )}
          
          {isPending && <Progress value={undefined} className="animate-pulse" />}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isOverQuota ? 'Storage full.' : 'Max 1GB total.'}</p>
            <Button type="submit" disabled={isPending || isOverQuota}>
              <FileUp className="mr-2 h-4 w-4" />
              {isPending ? "Uploading..." : "Upload & Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
