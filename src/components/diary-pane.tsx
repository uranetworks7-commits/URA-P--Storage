"use client";

import { useActionState } from "react";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { saveDiaryEntry } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookMarked, Save } from "lucide-react";

type FormState = {
  success: boolean;
  message: string;
};

const initialState: FormState = {
  success: false,
  message: "",
};

export function DiaryPane() {
  const { userId } = useAuth();
  const [state, formAction] = useActionState(saveDiaryEntry, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
        formRef.current?.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BookMarked />
          New Diary Entry
        </CardTitle>
        <CardDescription>
          Your thoughts are safe here. Entries are saved with the current date and time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId || ""} />
          <div className="space-y-2">
            <Label htmlFor="diary-text">What's on your mind?</Label>
            <Textarea
              id="diary-text"
              name="text"
              placeholder="Today I..."
              required
              rows={8}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Your entry will be encrypted and stored securely.</p>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
