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
      <CardHeader className="p-3">
        <CardTitle className="font-headline text-base flex items-center gap-2">
          <BookMarked className="h-4 w-4" />
          New Diary Entry
        </CardTitle>
        <CardDescription className="text-xs">
          Your thoughts are safe here.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <form ref={formRef} action={formAction} className="space-y-2">
          <input type="hidden" name="userId" value={userId || ""} />
          <div className="space-y-1">
            <Label htmlFor="diary-text" className="text-xs">What's on your mind?</Label>
            <Textarea
              id="diary-text"
              name="text"
              placeholder="Today I..."
              required
              rows={4}
              className="text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Entries are encrypted.</p>
            <Button type="submit" size="sm" className="h-8 text-xs">
              <Save className="mr-2 h-3 w-3" />
              Save Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
