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
      <CardHeader className="p-3">
        <CardTitle className="font-headline text-base flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          Upload a File
        </CardTitle>
        <CardDescription className="text-xs">
          Files are Securely stored in URA Data SERVER.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <form ref={formRef} action={handleFormAction} className="space-y-2">
          <input type="hidden" name="userId" value={userId || ""} />
          <div className="space-y-1">
            <Label htmlFor="file-input" className="text-xs">Select file</Label>
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
          
          {isPending && <Progress value={undefined} className="animate-pulse h-1.5" />}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{isOverQuota ? 'Storage full.' : 'Max 1GB total.'}</p>
            <Button type="submit" size="sm" disabled={isPending || isOverQuota} className="h-8 text-xs">
              <FileUp className="mr-2 h-3 w-3" />
              {isPending ? "Uploading..." : "Upload & Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
