import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userService, settingsService } from '../services/api';
import { analyzeProfile } from '../services/geminiService';

export default function UploadSection({ onRefresh }: { onRefresh: () => void }) {
  const [manualUser, setManualUser] = useState({ username: "", name: "", bio: "" });
  const [bulkInput, setBulkInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsService.get();
      setSettings(res.data);
    } catch (error) {
      console.error("Failed to fetch settings");
    }
  };

  const handleManualAdd = async () => {
    let username = manualUser.username.trim();
    if (!username) return toast.error("Username is required");
    
    // Handle full Instagram URLs
    if (username.includes('instagram.com/')) {
      try {
        const url = new URL(username.startsWith('http') ? username : `https://${username}`);
        const pathParts = url.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          username = pathParts[0];
        }
      } catch (e) {
        username = username.split('instagram.com/')[1]?.split('/')[0] || username;
      }
    }
    username = username.replace('@', '').split('?')[0];

    try {
      setIsProcessing(true);
      let userData: any = { ...manualUser, username };
      
      if (settings?.autoAnalyze !== false) {
        const analysis = await analyzeProfile(username, manualUser.bio, manualUser.name);
        userData = { ...userData, ...analysis };
        toast.success(`User @${username} added and analyzed`);
      } else {
        toast.success(`User @${username} added`);
      }
      
      await userService.upload([userData]);
      setManualUser({ username: "", name: "", bio: "" });
      onRefresh();
    } catch (error) {
      toast.error("Failed to add user. Please check your database connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkInput.split('\n').filter(l => l.trim());
    if (lines.length === 0) return toast.error("Please enter some usernames");

    try {
      setIsProcessing(true);
      const usersToUpload = [];
      
      for (const line of lines) {
        let username = line.trim();
        
        // Handle full Instagram URLs
        if (username.includes('instagram.com/')) {
          try {
            const url = new URL(username.startsWith('http') ? username : `https://${username}`);
            const pathParts = url.pathname.split('/').filter(p => p);
            if (pathParts.length > 0) {
              username = pathParts[0];
            }
          } catch (e) {
            // Fallback to simple split if URL parsing fails
            username = username.split('instagram.com/')[1]?.split('/')[0] || username;
          }
        }
        
        username = username.replace('@', '').split('?')[0]; // Remove @ and query params
        
        if (username) {
          usersToUpload.push({ username, status: 'new' });
        }
      }

      if (usersToUpload.length === 0) return toast.error("No valid usernames found");

      await userService.upload(usersToUpload);
      toast.success(`Imported ${usersToUpload.length} users`);
      setBulkInput("");
      onRefresh();
    } catch (error) {
      toast.error("Bulk import failed. Please check your database connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-600" />
            Manual Entry
          </CardTitle>
          <CardDescription>Add a single user and run AI analysis immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Instagram Username</Label>
            <Input 
              placeholder="e.g., johndoe" 
              value={manualUser.username}
              onChange={(e) => setManualUser({...manualUser, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Full Name (Optional)</Label>
            <Input 
              placeholder="e.g., John Doe" 
              value={manualUser.name}
              onChange={(e) => setManualUser({...manualUser, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Bio (Optional)</Label>
            <Textarea 
              placeholder="Paste user's bio here for better AI analysis..." 
              value={manualUser.bio}
              onChange={(e) => setManualUser({...manualUser, bio: e.target.value})}
            />
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={handleManualAdd} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
            Add & Analyze
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" />
            Bulk Import
          </CardTitle>
          <CardDescription>Paste a list of usernames (one per line).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Usernames</Label>
            <Textarea 
              placeholder="username1&#10;username2&#10;username3" 
              className="min-h-[220px] font-mono text-sm"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={handleBulkAdd} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Upload size={16} className="mr-2" />}
            Import List
          </Button>
          <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-md text-xs text-indigo-700">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>Bulk import only adds usernames. You can run AI analysis on them later from the User Table.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Plus({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
