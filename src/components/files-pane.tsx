"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
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
  const [state, formAction] = useFormState(uploadFileAndSave, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  useEffect(() => {
    if (state.message) {
      setIsSubmitting(false);
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
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    formAction(formData);
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
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isSubmitting || isOverQuota}
              className="file:text-primary file:font-semibold"
            />
          </div>

          {fileName && fileSize !== null && (
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{fileName}</span> ({formatBytes(fileSize)})
            </div>
          )}
          
          {isSubmitting && <Progress value={undefined} className="animate-pulse" />}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isOverQuota ? 'Storage full.' : 'Max 1GB total.'}</p>
            <Button type="submit" disabled={isSubmitting || isOverQuota}>
              <FileUp className="mr-2 h-4 w-4" />
              {isSubmitting ? "Uploading..." : "Upload & Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
