import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { templateService } from '../services/api';

export default function TemplateManager({ templates, onRefresh }: { templates: any[], onRefresh: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "gender",
    category: "male",
    content: ""
  });

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      return toast.error("Please fill in all fields");
    }
    try {
      await templateService.create(newTemplate);
      toast.success("Template created");
      setIsAdding(false);
      setNewTemplate({ name: "", type: "gender", category: "male", content: "" });
      onRefresh();
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 border-none shadow-sm h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Create Template</CardTitle>
          <CardDescription>Define reusable message templates with variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input 
              placeholder="e.g., Initial Male Dentist" 
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newTemplate.type} 
                onValueChange={(val) => setNewTemplate({...newTemplate, type: val as any, category: val === 'gender' ? 'male' : val === 'profession' ? 'dentist' : '1st follow-up'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gender">Gender</SelectItem>
                  <SelectItem value="profession">Profession</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input 
                placeholder="e.g., male, dentist" 
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Message Content</Label>
            <Textarea 
              placeholder="Hi {name}, I saw your profile..." 
              className="min-h-[150px]"
              value={newTemplate.content}
              onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
            />
            <p className="text-[10px] text-zinc-500">Variables: {"{name}"}, {"{username}"}, {"{profession}"}</p>
          </div>
          <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={handleCreate}>
            <Plus size={16} /> Save Template
          </Button>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-4">
        <h3 className="text-lg font-semibold px-1">Your Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!Array.isArray(templates) || templates.length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed rounded-xl text-zinc-400">
              <MessageSquare size={40} className="mx-auto mb-4 opacity-20" />
              <p>No templates created yet.</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template._id} className="border-none shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="capitalize">{template.type} • {template.category}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-600 line-clamp-3 bg-zinc-50 p-3 rounded-md italic">
                    "{template.content}"
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
