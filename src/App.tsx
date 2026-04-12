/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Users, MessageSquare, History, Settings, Upload, Search, Send, RefreshCw, AlertCircle, LogOut } from "lucide-react";

// Components
import UserTable from './components/UserTable';
import TemplateManager from './components/TemplateManager';
import ActivityLogs from './components/ActivityLogs';
import UploadSection from './components/UploadSection';
import SettingsPanel from './components/SettingsPanel';
import Auth from './components/Auth';

// Services
import { userService, templateService, logService, authService } from './services/api';
import axios from 'axios';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      setUser(res.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [usersRes, templatesRes, logsRes, healthRes] = await Promise.all([
        userService.getAll().catch(() => ({ data: [] })),
        templateService.getAll().catch(() => ({ data: [] })),
        logService.getAll().catch(() => ({ data: [] })),
        axios.get('/api/health').catch(() => ({ data: { mongodb: 'disconnected' } }))
      ]);
      setUsers(usersRes.data);
      setTemplates(templatesRes.data);
      setLogs(logsRes.data);
      setDbStatus(healthRes.data.mongodb);
    } catch (error) {
      toast.error("Failed to fetch data");
      setDbStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onLogin={setUser} />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <MessageSquare size={18} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate max-w-[120px] sm:max-w-none">InstaSmart CRM</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-zinc-100 border text-[9px] sm:text-[10px] font-medium">
              <div className={`w-1.5 h-1.5 rounded-full ${
                dbStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                dbStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`} />
              <span className="text-zinc-600 uppercase tracking-wider">
                DB: {dbStatus}
              </span>
            </div>
            <button 
              onClick={fetchData}
              className="p-1.5 sm:p-2 hover:bg-zinc-100 rounded-full transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-4 border-l">
              <div className="flex flex-col items-end mr-1 sm:mr-2 hidden md:flex">
                <span className="text-xs font-bold">{user.name}</span>
                <span className="text-[10px] text-zinc-500">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 sm:p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {dbStatus === 'disconnected' && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-red-800 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />
            <p>
              Database is disconnected. Your changes will not be saved. 
              <span className="font-normal ml-1">
                Please check your MongoDB URI in the Secrets panel and ensure your IP is whitelisted in Atlas.
              </span>
            </p>
            <button 
              onClick={fetchData}
              className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-white border p-1 h-auto flex-nowrap sm:flex-wrap gap-1 w-max sm:w-full">
              <TabsTrigger value="users" className="gap-2 px-3 sm:px-4 py-2 transition-all hover:bg-zinc-50 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap">
                <Users size={16} /> <span className="text-sm sm:text-base">Users</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2 px-3 sm:px-4 py-2 transition-all hover:bg-zinc-50 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap">
                <MessageSquare size={16} /> <span className="text-sm sm:text-base">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2 px-3 sm:px-4 py-2 transition-all hover:bg-zinc-50 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap">
                <History size={16} /> <span className="text-sm sm:text-base">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2 px-3 sm:px-4 py-2 transition-all hover:bg-zinc-50 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap">
                <Upload size={16} /> <span className="text-sm sm:text-base">Import</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 px-3 sm:px-4 py-2 transition-all hover:bg-zinc-50 data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap">
                <Settings size={16} /> <span className="text-sm sm:text-base">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users">
            <UserTable users={users} templates={templates} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManager templates={templates} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="logs">
            <ActivityLogs logs={logs} />
          </TabsContent>

          <TabsContent value="upload">
            <UploadSection onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
