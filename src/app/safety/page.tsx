"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/use-auth";
import { useActionState } from 'react';
import { lockAccount } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldQuestion, Copy, ArrowLeft, ShieldOff, ShieldCheck, Shield, Lock, KeyRound, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

type SafetyViewState = 'main' | 'download_help' | 'lock_account' | 'locking' | 'locked';

const LockAnimation = () => (
    <div className="relative h-24 w-24">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary) / 0.2)" strokeWidth="8" fill="none" />
            <circle 
                cx="50" 
                cy="50" 
                r="45" 
                stroke="hsl(var(--primary))" 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="283"
                strokeDashoffset="283"
                transform="rotate(-90 50 50)"
                className="animate-lock-progress"
            />
        </svg>
        <Lock className="absolute inset-0 m-auto h-12 w-12 text-primary animate-lock-icon" />
        <style jsx>{`
            @keyframes lock-progress {
                from { stroke-dashoffset: 283; }
                to { stroke-dashoffset: 0; }
            }
            .animate-lock-progress {
                animation: lock-progress 1.5s ease-out forwards;
            }
            @keyframes lock-icon-pop {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            .animate-lock-icon {
                animation: lock-icon-pop 0.5s ease-out 0.2s forwards;
                transform: scale(0);
                opacity: 0;
            }
        `}</style>
    </div>
);


export default function SafetyPage() {
    const { userId, logout } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [viewState, setViewState] = useState<SafetyViewState>('main');
    const [confirmId, setConfirmId] = useState("");
    
    const urlTextareaRef = useRef<HTMLTextAreaElement>(null);
    const codeRef = useRef<HTMLParagraphElement>(null);

    const [isPending, startTransition] = useTransition();

    const [lockState, lockAction] = useActionState(lockAccount, { success: false, message: "" });

    const handleLockAccountSubmit = (formData: FormData) => {
        if (confirmId !== userId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "The User ID you entered does not match."
            });
            return;
        }
        startTransition(() => {
            setViewState('locking');
            setTimeout(() => {
                lockAction(formData);
            }, 2000); // Wait for animation to play
        });
    };

    useEffect(() => {
        if(viewState === 'download_help' && urlTextareaRef.current) {
            urlTextareaRef.current.select();
        }
    }, [viewState]);

    useEffect(() => {
        if (lockState.success) {
            setViewState('locked');
            setTimeout(() => {
              if (codeRef.current) {
                const range = document.createRange();
                range.selectNodeContents(codeRef.current);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }, 100);
        } else if (lockState.message) {
            toast({
                variant: "destructive",
                title: "Lock Failed",
                description: lockState.message
            });
            setViewState('lock_account');
        }
    }, [lockState, toast]);

    const renderContent = () => {
        switch (viewState) {
            case 'main':
                return (
                    <CardContent className="p-4 pt-0 flex flex-col gap-3">
                         <Button variant="outline" className="h-auto justify-start text-left p-3" onClick={() => setViewState('download_help')}>
                            <ShieldQuestion className="h-5 w-5 mr-3"/>
                            <div>
                                <p className="font-semibold text-sm">I can't Copy & Download My Files</p>
                                <p className="text-xs text-muted-foreground">Get help if you're having trouble.</p>
                            </div>
                        </Button>
                         <Button variant="destructive" className="h-auto justify-start text-left p-3 bg-destructive/10 border border-destructive/20 text-destructive-foreground hover:bg-destructive/20" onClick={() => setViewState('lock_account')}>
                            <ShieldOff className="h-5 w-5 mr-3 text-destructive"/>
                             <div>
                                <p className="font-semibold text-sm">My Account is Hacked, Lock it</p>
                                <p className="text-xs text-destructive/80">Immediately lock your account.</p>
                            </div>
                        </Button>
                    </CardContent>
                );

            case 'download_help':
                const url = "https://ura-pvt-stg.netlify.app/";
                return (
                    <CardContent className="p-4 pt-0 space-y-3">
                        <Button variant="ghost" size="sm" className="mb-2" onClick={() => setViewState('main')}><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>
                        <Alert>
                            <AlertTitle className="text-sm">Access Your Data Directly</AlertTitle>
                            <AlertDescription className="text-xs">
                                For security reasons, some features like downloading may be restricted in embedded views. Please visit the main website to access all features.
                            </AlertDescription>
                        </Alert>
                        <Textarea ref={urlTextareaRef} value={url} readOnly rows={2} className="text-xs text-center" />
                        <Button size="sm" className="w-full h-8 text-xs" onClick={() => { navigator.clipboard.writeText(url); toast({ title: "Copied!", description: "Website URL copied to clipboard."})}}>
                            <Copy className="mr-2 h-3 w-3" />
                            Copy URL
                        </Button>
                    </CardContent>
                );

            case 'lock_account':
                return (
                    <CardContent className="p-4 pt-0">
                         <Button variant="ghost" size="sm" className="mb-2" onClick={() => setViewState('main')}><ArrowLeft className="mr-2 h-4 w-4"/>Back</Button>
                        <form action={handleLockAccountSubmit} className="space-y-3">
                            <input type="hidden" name="userId" value={userId || ""} />
                             <Alert variant="destructive" className="p-3">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle className="text-sm">Confirm Account Lock</AlertTitle>
                                <AlertDescription className="text-xs">
                                   This will log you out of all devices and prevent access until you unlock it. Type your User ID to confirm.
                                </AlertDescription>
                            </Alert>
                            <div className="space-y-1">
                                <Label htmlFor="confirm-id" className="text-xs">Your 6-Digit ID</Label>
                                <Input 
                                    id="confirm-id"
                                    name="confirmId"
                                    value={confirmId}
                                    onChange={(e) => setConfirmId(e.target.value)}
                                    maxLength={6}
                                    placeholder="Confirm your ID"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <Button type="submit" variant="destructive" className="w-full h-9" disabled={isPending}>
                                <ShieldOff className="mr-2 h-4 w-4"/>
                                {isPending ? "Securing..." : "Lock My Account"}
                            </Button>
                        </form>
                    </CardContent>
                );

            case 'locking':
                return (
                    <CardContent className="p-4 pt-0 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                        <LockAnimation />
                        <p className="font-semibold text-sm">Securing Your Account...</p>
                        <p className="text-xs text-muted-foreground">Please wait while we lock your data and log out all sessions.</p>
                    </CardContent>
                );

            case 'locked':
                return (
                    <CardContent className="p-4 pt-0 flex flex-col items-center justify-center text-center space-y-3">
                        <ShieldCheck className="h-12 w-12 text-green-500" />
                        <h3 className="font-bold text-base">Account Locked Successfully</h3>
                        <p className="text-xs text-muted-foreground">Your account is now secure. Use the code below to unlock it next time you log in. Keep it safe!</p>
                        <div className="p-3 bg-secondary rounded-lg w-full text-center">
                            <p className="text-xs text-muted-foreground mb-1">Your One-Time Unlock Code</p>
                            <div className="flex items-center justify-center gap-2">
                                <KeyRound className="h-5 w-5 text-primary" />
                                <p ref={codeRef} className="text-2xl font-bold tracking-[0.2em]">{lockState.unlockCode}</p>
                            </div>
                        </div>
                        <Button className="w-full h-9 mt-2" onClick={() => { logout(); router.push('/') }}>
                            Go to Login
                        </Button>
                    </CardContent>
                );

        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="p-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Link href="/" className="p-1 rounded-md hover:bg-secondary -ml-2">
                            <ArrowLeft className="h-4 w-4"/>
                        </Link>
                        Safety Center
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Manage your account security and get help.
                    </CardDescription>
                </CardHeader>
                {renderContent()}
            </Card>
        </div>
    );
}
