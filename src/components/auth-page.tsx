"use client";

import { useState, useEffect, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { loginOrCreateUser } from "@/app/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TermsDialog } from "./terms-dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, LogIn } from "lucide-react";

const formSchema = z.object({
  userId: z.string().length(6, "ID must be 6 digits.").regex(/^\d{6}$/, "ID must be numeric."),
  username: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export function AuthPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isTermsOpen, setTermsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      username: "",
      email: "",
    },
  });

  const [formState, formAction] = useActionState(async (_: any, data: FormData) => {
    const result = await loginOrCreateUser(data.userId, data.username || '', data.email || '');
    return result;
  }, { success: false, message: "" });
  
  useEffect(() => {
    if (formState.message) {
      if (formState.success) {
        toast({
          title: "Success",
          description: formState.message,
        });
        const userId = form.getValues("userId");
        login(userId);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: formState.message,
        });
      }
    }
  }, [formState, login, toast, form]);


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <header className="flex items-center gap-4 mb-6">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold font-headline">URA Private Storage</h1>
          <p className="text-muted-foreground">
            Secure personal diary, files, & more — protected by your 6-digit ID.
          </p>
        </div>
      </header>
      <Card className="w-full max-w-md">
        <form action={() => form.handleSubmit(data => formAction(data))()}>
          <CardHeader>
            <CardTitle className="font-headline">Login or Create Account</CardTitle>
            <CardDescription>Enter a 6-digit ID to create an account or log in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">6-Digit ID</Label>
              <Input
                id="userId"
                placeholder="e.g. 123456"
                maxLength={6}
                {...form.register("userId")}
              />
              {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="username">Display Name (Optional)</Label>
                <Input id="username" placeholder="Your Name" {...form.register("username")} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
                 {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                </div>
            </div>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                Do not share your 6-digit ID. Keep it private — it's the only key to your data.
                </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setTermsOpen(true)}>
              Terms & Privacy
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <LogIn className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Processing..." : "Login / Create"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>This is a client-side demo wired to a Firebase DB.</p>
        <p>For production, add server-side security and auth rules.</p>
      </footer>
      <TermsDialog open={isTermsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}
