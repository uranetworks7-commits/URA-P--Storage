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
import { LogOut, AlertTriangle, Zap, Star } from "lucide-react";
import Link from "next/link";

const ONE_GB = 1073741824;

export function Dashboard() {
  const { userId, userData, logout } = useAuth();
  const usage = userData?.usageBytes ?? 0;
  const isPremium = userData?.premium === true;
  const quota = isPremium ? 2 * ONE_GB : ONE_GB;
  const usagePercentage = (usage / quota) * 100;
  const isOverQuota = usage > quota;

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Logo />
          <div>
            <h1 className="text-lg md:text-xl font-bold font-headline">
              Welcome
            </h1>
            <p className="text-muted-foreground text-xs">
              ID: <span className="font-semibold font-code">{userId}</span>
              {isPremium && <span className="ml-2 inline-flex items-center text-yellow-500 text-xs"><Star className="h-3 w-3 mr-1" /> Premium</span>}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </header>

      <main>
        <Tabs defaultValue="diary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diary" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900">New Diary Entry</TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900">Upload File</TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900">Manage Data</TabsTrigger>
          </TabsList>
          <TabsContent value="diary">
            <DiaryPane />
          </TabsContent>
          <TabsContent value="files">
            <FilesPane isOverQuota={isOverQuota} />
          </TabsContent>
          <TabsContent value="manage">
            <ManagePane />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-6">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="font-headline text-lg flex items-center justify-between">
              <span>Usage Information</span>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription className="text-xs">
              {`Created: ${userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : "-"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>{formatBytes(usage)} used</span>
                <span className="text-muted-foreground">of {formatBytes(quota)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            {isOverQuota && (
              <Alert variant="destructive" className="mt-3 p-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">Storage Limit Exceeded</AlertTitle>
                <AlertDescription className="text-xs">
                  Upgrade or delete files to upload more.
                </AlertDescription>
              </Alert>
            )}
             {!isPremium && usage > 0.8 * ONE_GB && (
              <Alert className="mt-3 p-3 border-primary/50 text-primary">
                <Star className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm">Upgrade to Premium</AlertTitle>
                <AlertDescription className="flex items-center justify-between text-xs">
                  <span>
                    Get an additional 1GB for ₹100.
                  </span>
                  <Button asChild size="sm">
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
