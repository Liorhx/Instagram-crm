import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Send, Filter, MoreHorizontal, UserCheck, MessageCircle, RefreshCw, AlertCircle, Trash2, Clock, History } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { messageService, userService, settingsService } from '../services/api';

export default function UserTable({ users, templates, onRefresh }: { users: any[], templates: any[], onRefresh: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Extract all unique tags
  const allTags = Array.from(new Set(users.flatMap(u => u.tags || [])));

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesTag = tagFilter === "all" || (user.tags && user.tags.includes(tagFilter));
    
    let matchesDue = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = user.nextFollowUpDate ? new Date(user.nextFollowUpDate) : null;
    
    if (dueFilter === "today") {
      matchesDue = nextDate ? (nextDate.setHours(0,0,0,0) === today.getTime()) : false;
    } else if (dueFilter === "overdue") {
      matchesDue = nextDate ? (nextDate < new Date() && !['converted', 'not-interested'].includes(user.status)) : false;
    }

    const matchesFollowUp = followUpFilter === "all" || (user.followUpCount || 0) < (settings?.maxFollowUps || 4);

    return matchesSearch && matchesStatus && matchesDue && matchesFollowUp && matchesTag;
  }).sort((a, b) => {
    const dateA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : Infinity;
    const dateB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : Infinity;
    return dateA - dateB;
  }) : [];

  const todayCount = users.filter(u => {
    const d = u.nextFollowUpDate ? new Date(u.nextFollowUpDate) : null;
    return d && new Date(d).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
  }).length;

  const overdueCount = users.filter(u => {
    const d = u.nextFollowUpDate ? new Date(u.nextFollowUpDate) : null;
    return d && d < new Date() && !['converted', 'not-interested'].includes(u.status);
  }).length;

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkTemplateId, setBulkTemplateId] = useState("");
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

  const handleTemplateSelect = (templateId: string, user: any) => {
    const template = templates.find((t: any) => t._id === templateId);
    if (!template) return;
    
    setSelectedTemplate(template);
    const content = template.content
      .replace(/{name}/g, user.name || user.username)
      .replace(/{username}/g, user.username)
      .replace(/{profession}/g, user.profession || "professional");
    setPreviewMessage(content);
  };

  const handleMarkAsSent = async (userId: string) => {
    if (!selectedTemplate) return;
    try {
      setIsSending(true);
      await messageService.send(userId, selectedTemplate._id);
      toast.success("Status updated to 'Contacted'");
      onRefresh();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsSending(false);
    }
  };

  const copyAndOpen = (username: string) => {
    navigator.clipboard.writeText(previewMessage);
    toast.success("Message copied to clipboard!");
    window.open(`https://www.instagram.com/${username}/`, '_blank');
  };

  const handleDelete = async (userId: string) => {
    try {
      await userService.delete(userId);
      toast.success("User removed from target list");
      onRefresh();
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    try {
      await userService.bulkDelete(selectedUsers);
      toast.success(`Removed ${selectedUsers.length} users`);
      setSelectedUsers([]);
      onRefresh();
    } catch (error) {
      toast.error("Failed to remove users");
    }
  };

  const handleBulkSend = async () => {
    if (!bulkTemplateId || selectedUsers.length === 0) return;
    try {
      setIsSending(true);
      await messageService.bulkSend(selectedUsers, bulkTemplateId);
      toast.success(`Status updated for ${selectedUsers.length} users`);
      setIsBulkDialogOpen(false);
      setSelectedUsers([]);
      setBulkTemplateId("");
      onRefresh();
    } catch (error) {
      toast.error("Failed to update bulk status");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-zinc-100 text-zinc-700';
      case 'follow-up-1': return 'bg-amber-100 text-amber-700';
      case 'follow-up-2': return 'bg-orange-100 text-orange-700';
      case 'interested': return 'bg-green-100 text-green-700';
      case 'not-interested': return 'bg-red-100 text-red-700';
      case 'converted': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Instagram Users</CardTitle>
            <div className="flex items-center gap-2">
              {selectedUsers.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-2 h-8 sm:h-9 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={14} className="sm:size-4" />
                  <span className="hidden xs:inline">Delete</span> ({selectedUsers.length})
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search users..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {selectedUsers.length > 0 && (
                <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                  <DialogTrigger render={<Button variant="default" size="sm" className="flex-1 sm:flex-none gap-2 h-9 bg-indigo-600 hover:bg-indigo-700 transition-all" />}>
                    <Send size={14} />
                    <span className="text-xs sm:text-sm">Bulk Msg</span>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Bulk Message Preparation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2 items-start mb-4">
                        <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 leading-tight">
                          This will update the status for <strong>{selectedUsers.length} users</strong>. 
                          You should still manually send the messages on Instagram to avoid account bans.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Select Template</label>
                        <Select value={bulkTemplateId} onValueChange={setBulkTemplateId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a message template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((t: any) => (
                              <SelectItem key={t._id} value={t._id}>{t.name} ({t.category})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-2">
                        {selectedUsers.map(id => {
                          const user = users.find(u => u._id === id);
                          if (!user) return null;
                          return (
                            <div key={id} className="flex items-center justify-between text-xs p-2 bg-zinc-50 rounded border">
                              <span className="font-medium truncate mr-2">@{user.username}</span>
                              <Button 
                                variant="ghost" 
                                size="xs" 
                                className="h-6 text-indigo-600 shrink-0"
                                onClick={() => {
                                  const template = templates.find(t => t._id === bulkTemplateId);
                                  if (!template) return toast.error("Select a template first");
                                  const content = template.content
                                    .replace(/{name}/g, user.name || user.username)
                                    .replace(/{username}/g, user.username)
                                    .replace(/{profession}/g, user.profession || "professional");
                                  navigator.clipboard.writeText(content);
                                  toast.success(`Copied for @${user.username}`);
                                  window.open(`https://www.instagram.com/${user.username}/`, '_blank');
                                }}
                              >
                                Copy & Open
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      <Button 
                        className="w-full gap-2 bg-indigo-600" 
                        disabled={!bulkTemplateId || isSending}
                        onClick={handleBulkSend}
                      >
                        {isSending ? <RefreshCw size={16} className="animate-spin" /> : <UserCheck size={16} />}
                        Mark All as Contacted
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 sm:w-[130px] h-9 cursor-pointer text-xs sm:text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="follow-up-1">Follow-up 1</SelectItem>
                  <SelectItem value="follow-up-2">Follow-up 2</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not-interested">Not Interested</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dueFilter} onValueChange={setDueFilter}>
                <SelectTrigger className="flex-1 sm:w-[120px] h-9 cursor-pointer text-xs sm:text-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Due" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
                <SelectTrigger className="flex-1 sm:w-[120px] h-9 cursor-pointer text-xs sm:text-sm">
                  <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Follow-ups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counts</SelectItem>
                  <SelectItem value="pending">Pending (&lt;{settings?.maxFollowUps || 4})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="flex-1 sm:w-[110px] h-9 cursor-pointer text-xs sm:text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge 
            variant={dueFilter === 'today' ? 'default' : 'outline'} 
            className={`cursor-pointer transition-all text-[10px] sm:text-xs ${dueFilter === 'today' ? 'bg-indigo-600' : 'hover:bg-zinc-50'}`}
            onClick={() => setDueFilter(dueFilter === 'today' ? 'all' : 'today')}
          >
            Due Today: {todayCount}
          </Badge>
          <Badge 
            variant={dueFilter === 'overdue' ? 'destructive' : 'outline'} 
            className="cursor-pointer transition-all text-[10px] sm:text-xs"
            onClick={() => setDueFilter(dueFilter === 'overdue' ? 'all' : 'overdue')}
          >
            Overdue: {overdueCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="rounded-md border-y sm:border overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200">
          <Table className="min-w-[800px] sm:min-w-full">
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedUsers(filteredUsers.map(u => u._id));
                      else setSelectedUsers([]);
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Profession</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Follow-ups</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id} className="hover:bg-zinc-50/80 transition-colors group cursor-pointer">
                    <TableCell>
                      <Checkbox 
                        checked={selectedUsers.includes(user._id)}
                        onCheckedChange={() => toggleUser(user._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">@{user.username}</span>
                        <div className="flex gap-1 mt-0.5">
                          {user.tags?.map((tag: string) => (
                            <span key={tag} className="text-[9px] px-1 bg-zinc-100 text-zinc-500 rounded uppercase font-bold tracking-wider">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-600">{user.profession || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(user.status)} border-none shadow-none font-medium`}>
                        {user.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${user.followUpCount >= (settings?.maxFollowUps || 4) ? 'bg-green-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min((user.followUpCount || 0) / (settings?.maxFollowUps || 4) * 100, 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs font-medium text-zinc-500">{user.followUpCount || 0}/{settings?.maxFollowUps || 4}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${
                        user.nextFollowUpDate && new Date(user.nextFollowUpDate) < new Date() && !['converted', 'not-interested'].includes(user.status)
                          ? 'text-red-600' 
                          : 'text-zinc-500'
                      }`}>
                        {user.nextFollowUpDate ? format(new Date(user.nextFollowUpDate), "MMM d") : "Not set"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer" />}>
                            <Send size={16} className="text-zinc-400 group-hover:text-indigo-600 transition-colors" />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Message to @{user.username}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid gap-2">
                                <label className="text-sm font-medium">Select Template</label>
                                <Select onValueChange={(val: string) => handleTemplateSelect(val, user)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a message template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {templates.map((t: any) => (
                                      <SelectItem key={t._id} value={t._id}>{t.name} ({t.category})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {previewMessage && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 relative group">
                                    <p className="text-sm text-indigo-900 leading-relaxed italic">
                                      "{previewMessage}"
                                    </p>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-200">Preview</Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-3">
                                    <Button 
                                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold shadow-lg shadow-indigo-200"
                                      onClick={() => copyAndOpen(user.username)}
                                    >
                                      <MessageCircle size={20} /> Copy Message & Open Profile
                                    </Button>
                                    
                                    <div className="flex items-center gap-2 py-2">
                                      <div className="h-[1px] flex-1 bg-zinc-200" />
                                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Then</span>
                                      <div className="h-[1px] flex-1 bg-zinc-200" />
                                    </div>

                                    <Button 
                                      variant="outline"
                                      className="gap-2 border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                      onClick={() => handleMarkAsSent(user._id)}
                                      disabled={isSending}
                                    >
                                      {isSending ? <RefreshCw size={16} className="animate-spin" /> : <UserCheck size={16} />}
                                      Confirm Sent in CRM
                                    </Button>
                                  </div>

                                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2 items-start">
                                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-[11px] text-amber-800 leading-tight">
                                      <p className="font-bold mb-1">Why is this manual?</p>
                                      <p>Instagram blocks automated bots. Sending manually ensures your account stays safe from bans while the CRM handles the tracking.</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {!previewMessage && (
                                <div className="p-3 bg-zinc-50 rounded-md text-sm text-zinc-600">
                                  <p className="font-medium mb-1">User Info:</p>
                                  <p>Gender: {user.inferredGender}</p>
                                  <p>Profession: {user.profession || "Unknown"}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(user._id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
