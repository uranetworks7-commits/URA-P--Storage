"use client";

import { useAuth } from "@/hooks/use-auth";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { DiaryPane } from "@/components/diary-pane";
import { FilesPane } from "@/components/files-pane";
import { ManagePane } from "@/components/manage-pane";
import { LogOut, AlertTriangle, Zap, Star, CloudAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const ONE_GB = 1073741824;

export function Dashboard() {
  const { userId, userData, logout } = useAuth();
  const usage = userData?.usageBytes ?? 0;
  const isPremium = userData?.premium === true;
  const quota = isPremium ? 2 * ONE_GB : ONE_GB;
  const usagePercentage = (usage / quota) * 100;
  const isOverQuota = usage > quota;

  useEffect(() => {
    if (userData?.locked) {
        logout();
    }
  }, [userData?.locked, logout]);

  return (
    <div className="max-w-lg mx-auto p-1 sm:p-2">
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8"/>
          <div>
            <h1 className="text-base md:text-lg font-bold font-headline">
              Welcome
            </h1>
            <p className="text-muted-foreground text-xs">
              ID: <span className="font-semibold font-code">{userId}</span>
              {isPremium && <span className="ml-2 inline-flex items-center text-yellow-500 text-xs"><Star className="h-3 w-3 mr-1" /> Premium</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-red-500">
            <Link href="/safety">
                <CloudAlert className="h-5 w-5"/>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="h-8">
            <LogOut className="mr-1 h-3 w-3" />
            Logout
          </Button>
        </div>
      </header>

      <main>
        <Tabs defaultValue="diary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="diary" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900 text-xs">New Diary Entry</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900 text-xs">Upload File</TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900 text-xs">Manage Data</TabsTrigger>
          </TabsList>
          <TabsContent value="diary" className="mt-2">
            <DiaryPane />
          </TabsContent>
          <TabsContent value="files" className="mt-2">
            <FilesPane isOverQuota={isOverQuota} />
          </TabsContent>
          <TabsContent value="manage" className="mt-2">
            <ManagePane />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-4">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="font-headline text-base flex items-center justify-between">
              <span>Usage Information</span>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription className="text-xs">
              {`Created: ${userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : "-"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
             <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>{formatBytes(usage)} used</span>
                <span className="text-muted-foreground">of {formatBytes(quota)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            {isOverQuota && (
              <Alert variant="destructive" className="mt-2 p-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertTitle className="text-xs font-bold">Storage Limit Exceeded</AlertTitle>
                <AlertDescription className="text-xs">
                  Upgrade or delete files to upload more.
                </AlertDescription>
              </Alert>
            )}
             {!isPremium && usage > 0.8 * ONE_GB && (
              <Alert className="mt-2 p-2 border-primary/50 text-primary">
                <Star className="h-3 w-3 text-primary" />
                <AlertTitle className="text-xs font-bold">Upgrade to Premium</AlertTitle>
                <AlertDescription className="flex items-center justify-between text-xs">
                  <span>
                    Get an additional 1GB for ₹100.
                  </span>
                  <Button asChild size="sm" className="h-7 text-xs">
                    <Link href="#">Upgrade Now</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
