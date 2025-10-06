
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { loginOrCreateUser, unlockAccount } from "@/app/actions";
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
import { AlertTriangle, LogIn, UserPlus, ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Schema for new user creation
const createSchema = z.object({
  userId: z.string().min(1, "ID is required.").max(7, "ID is too long."),
  username: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  terms: z.boolean(),
});

// Schema for existing user login
const loginSchema = z.object({
  userId: z.string().min(1, "ID is required.").max(7, "ID is too long."),
});

const unlockSchema = z.object({
  unlockCode: z.string().length(4, "Code must be 4 digits.").regex(/^\d{4}$/, "Code must be numeric."),
});


type CreateFormData = z.infer<typeof createSchema>;
type LoginFormData = z.infer<typeof loginSchema>;
type UnlockFormData = z.infer<typeof unlockSchema>;

export function AuthPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isTermsOpen, setTermsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isUnlockModalOpen, setUnlockModalOpen] = useState(false);
  const [userIdToUnlock, setUserIdToUnlock] = useState("");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userId: "" },
  });

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { userId: "", username: "", email: "", terms: false },
  });

  const unlockForm = useForm<UnlockFormData>({
    resolver: zodResolver(unlockSchema),
    defaultValues: { unlockCode: "" },
  });

  // Share action state between forms
  const [formState, formAction, isPending] = React.useActionState(async (_: any, data: FormData) => {
    const userId = data.get('userId') as string;
    const username = data.get('username') as string | undefined;
    const email = data.get('email') as string | undefined;
    const result = await loginOrCreateUser(userId, username || '', email || '');
    return result;
  }, { success: false, message: "" });
  
  const [unlockState, unlockAction, isUnlockPending] = React.useActionState(unlockAccount, { success: false, message: "" });


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
        if (formState.message === "Account is locked.") {
            const userId = activeTab === 'login' ? loginForm.getValues("userId") : createForm.getValues("userId");
            setUserIdToUnlock(userId);
            setUnlockModalOpen(true);
        } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: formState.message,
            });
        }
      }
    }
  }, [formState, login, toast, loginForm, createForm, activeTab]);

  useEffect(() => {
    if(unlockState.message) {
        if(unlockState.success) {
            toast({ title: "Success", description: unlockState.message });
            setUnlockModalOpen(false);
            login(userIdToUnlock);
        } else {
            toast({ variant: "destructive", title: "Error", description: unlockState.message });
        }
    }
  }, [unlockState, login, toast, userIdToUnlock]);


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-1">
      <header className="flex items-center gap-2 mb-2">
        <Logo className="h-8 w-8" />
        <div>
          <h1 className="text-lg font-bold font-headline">URA Private Storage</h1>
          <p className="text-xs text-muted-foreground">
            Secure personal diary, files, & more.
          </p>
        </div>
      </header>
      <Tabs defaultValue="login" className="w-full max-w-xs" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Create Account</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <form action={formAction}>
              <CardHeader className="p-4">
                <CardTitle className="font-headline text-lg">Login to Your Account</CardTitle>
                <CardDescription className="text-xs">Enter your 6-digit ID to access your storage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <div className="space-y-1">
                  <Label htmlFor="login-userId" className="text-xs">6-Digit ID (or #123456)</Label>
                  <Input
                    id="login-userId"
                    name="userId"
                    placeholder="e.g. 123456 or #123456"
                    maxLength={7}
                    {...loginForm.register("userId")}
                    className="h-8 text-sm"
                  />
                  {loginForm.formState.errors.userId && <p className="text-xs text-destructive">{loginForm.formState.errors.userId.message}</p>}
                </div>
                 <Alert variant="destructive" className="p-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-bold">Warning</AlertTitle>
                    <AlertDescription className="text-xs">
                    Do not share your ID. Keep it private — it's the only key to your data.
                    </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="p-4">
                 <Button type="submit" disabled={isPending} className="w-full h-9">
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
              <CardHeader className="p-4">
                <CardTitle className="font-headline text-lg">Create a New Account</CardTitle>
                <CardDescription className="text-xs">Choose a 6-digit ID to secure your new storage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                <div className="space-y-1">
                  <Label htmlFor="create-userId" className="text-xs">Choose Your 6-Digit ID (or #123456)</Label>
                  <Input
                    id="create-userId"
                    name="userId"
                    placeholder="e.g. 654321 or #654321"
                    maxLength={7}
                    {...createForm.register("userId")}
                    className="h-8 text-sm"
                  />
                  {createForm.formState.errors.userId && <p className="text-xs text-destructive">{createForm.formState.errors.userId.message}</p>}
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                    <Label htmlFor="username" className="text-xs">Display Name (Optional)</Label>
                    <Input id="username" name="username" placeholder="Your Name" {...createForm.register("username")} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs">Email (Optional)</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" {...createForm.register("email")} className="h-8 text-sm"/>
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
              <CardFooter className="p-4">
                <Button type="submit" className="w-full h-9" disabled={isPending}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isPending ? "Creating..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-4 text-center text-xs text-muted-foreground">
        <p>This is a client-side demo. For production, add server-side security.</p>
        <p>
            <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setTermsOpen(true)}>
                Terms & Privacy
            </Button>
        </p>
      </footer>
      <TermsDialog open={isTermsOpen} onOpenChange={setTermsOpen} />

      <Dialog open={isUnlockModalOpen} onOpenChange={setUnlockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Account Locked</DialogTitle>
            <DialogDescription>
              This account is locked by the owner. Please enter the 4-digit one-time unlock code to regain access.
            </DialogDescription>
          </DialogHeader>
          <form action={unlockAction}>
            <input type="hidden" name="userId" value={userIdToUnlock} />
            <div className="space-y-2 py-4">
                <Label htmlFor="unlock-code" className="text-xs">4-Digit Unlock Code</Label>
                <Input
                    id="unlock-code"
                    name="unlockCode"
                    maxLength={4}
                    {...unlockForm.register("unlockCode")}
                    className="h-10 text-center text-lg tracking-[0.5em]"
                    placeholder="****"
                />
                {unlockForm.formState.errors.unlockCode && <p className="text-xs text-destructive">{unlockForm.formState.errors.unlockCode.message}</p>}
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setUnlockModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isUnlockPending}>
                    {isUnlockPending ? "Unlocking..." : "Unlock Account"}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
