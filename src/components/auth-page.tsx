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
  terms: z.boolean(),
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
    const userId = data.get('userId') as string;
    const username = data.get('username') as string | undefined;
    const email = data.get('email') as string | undefined;
    const result = await loginOrCreateUser(userId, username || '', email || '');
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
    <div className="flex min-h-screen flex-col items-center justify-center p-2">
      <header className="flex items-center gap-2 mb-4">
        <Logo />
        <div>
          <h1 className="text-xl font-bold font-headline">URA Private Storage</h1>
          <p className="text-sm text-muted-foreground">
            Secure personal diary, files, & more.
          </p>
        </div>
      </header>
      <Tabs defaultValue="login" className="w-full max-w-sm" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Create Account</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <form action={formAction}>
              <CardHeader>
                <CardTitle className="font-headline text-xl">Login to Your Account</CardTitle>
                <CardDescription>Enter your 6-digit ID to access your storage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="login-userId">6-Digit ID</Label>
                  <Input
                    id="login-userId"
                    name="userId"
                    placeholder="e.g. 123456"
                    maxLength={6}
                    {...loginForm.register("userId")}
                  />
                  {loginForm.formState.errors.userId && <p className="text-xs text-destructive">{loginForm.formState.errors.userId.message}</p>}
                </div>
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription className="text-xs">
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
                <CardTitle className="font-headline text-xl">Create a New Account</CardTitle>
                <CardDescription>Choose a 6-digit ID to secure your new storage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="create-userId">Choose Your 6-Digit ID</Label>
                  <Input
                    id="create-userId"
                    name="userId"
                    placeholder="e.g. 654321"
                    maxLength={6}
                    {...createForm.register("userId")}
                  />
                  {createForm.formState.errors.userId && <p className="text-xs text-destructive">{createForm.formState.errors.userId.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                    <Label htmlFor="username">Display Name (Optional)</Label>
                    <Input id="username" name="username" placeholder="Your Name" {...createForm.register("username")} />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" {...createForm.register("email")} />
                    {createForm.formState.errors.email && <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>}
                    </div>
                </div>
                <div className="flex items-start space-x-2 pt-1">
                  <Checkbox
                    id="terms"
                    {...createForm.register("terms")}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the <Button variant="link" type="button" className="p-0 h-auto text-xs" onClick={() => setTermsOpen(true)}>Terms & Privacy</Button>
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isPending ? "Creating..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-6 text-center text-xs text-muted-foreground">
        <p>This is a client-side demo. For production, add server-side security.</p>
      </footer>
      <TermsDialog open={isTermsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}
