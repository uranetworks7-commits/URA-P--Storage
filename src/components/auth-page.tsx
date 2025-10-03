"use client";

import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TermsDialog } from "./terms-dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, LogIn, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Schema for new user creation
const createSchema = z.object({
  userId: z.string().length(6, "ID must be 6 digits.").regex(/^\d{6}$/, "ID must be numeric."),
  username: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  terms: z.literal<boolean>(true, {
    errorMap: () => ({ message: "You must accept the terms to create an account." }),
  }),
});

// Schema for existing user login
const loginSchema = z.object({
  userId: z.string().length(6, "ID must be 6 digits.").regex(/^\d{6}$/, "ID must be numeric."),
});

type CreateFormData = z.infer<typeof createSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export function AuthPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isTermsOpen, setTermsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userId: "" },
  });

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { userId: "", username: "", email: "", terms: false },
  });

  // Share action state between forms
  const [formState, formAction, isPending] = React.useActionState(async (_: any, data: FormData) => {
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
        // Get the successful user ID from either form
        const userId = activeTab === 'login' ? loginForm.getValues("userId") : createForm.getValues("userId");
        if (userId) {
          login(userId);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: formState.message,
        });
      }
    }
  }, [formState, login, toast, loginForm, createForm, activeTab]);

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
      <Tabs defaultValue="login" className="w-full max-w-md" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Create Account</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <form action={formAction}>
              <CardHeader>
                <CardTitle className="font-headline">Login to Your Account</CardTitle>
                <CardDescription>Enter your 6-digit ID to access your storage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-userId">6-Digit ID</Label>
                  <Input
                    id="login-userId"
                    placeholder="e.g. 123456"
                    maxLength={6}
                    {...loginForm.register("userId")}
                  />
                  {loginForm.formState.errors.userId && <p className="text-sm text-destructive">{loginForm.formState.errors.userId.message}</p>}
                </div>
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                    Do not share your 6-digit ID. Keep it private — it's the only key to your data.
                    </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                 <Button type="submit" disabled={isPending} className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    {isPending ? "Processing..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <form action={formAction}>
              <CardHeader>
                <CardTitle className="font-headline">Create a New Account</CardTitle>
                <CardDescription>Choose a 6-digit ID to secure your new storage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-userId">Choose Your 6-Digit ID</Label>
                  <Input
                    id="create-userId"
                    placeholder="e.g. 654321"
                    maxLength={6}
                    {...createForm.register("userId")}
                  />
                  {createForm.formState.errors.userId && <p className="text-sm text-destructive">{createForm.formState.errors.userId.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="username">Display Name (Optional)</Label>
                    <Input id="username" placeholder="Your Name" {...createForm.register("username")} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input id="email" type="email" placeholder="you@example.com" {...createForm.register("email")} />
                    {createForm.formState.errors.email && <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>}
                    </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms"
                    {...createForm.register("terms")}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the <Button variant="link" type="button" className="p-0 h-auto" onClick={() => setTermsOpen(true)}>Terms & Privacy</Button>
                    </label>
                    {createForm.formState.errors.terms && <p className="text-sm text-destructive">{createForm.formState.errors.terms.message}</p>}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isPending || !createForm.watch("terms")} className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isPending ? "Creating..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>This is a client-side demo. For production, add server-side security.</p>
      </footer>
      <TermsDialog open={isTermsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}

// A helper type for combining form data
type FormData = CreateFormData & LoginFormData;
