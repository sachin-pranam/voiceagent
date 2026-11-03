import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search, Trash2, Edit, Eye } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader } from "@/components/StateBlocks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/knowledge-base/")({
  component: KnowledgeBasePage,
  head: () => ({
    meta: [
      { title: "Knowledge Base — Awaaz AI" },
      { name: "description", content: "Manage your AI assistant's knowledge base" },
      { property: "og:title", content: "Knowledge Base — Awaaz AI" },
      {
        property: "og:description",
        content: "Manage your AI assistant's knowledge base",
      },
    ],
  }),
});

const knowledgeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
});

type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
};

function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [viewingItem, setViewingItem] = useState<KnowledgeItem | null>(null);
  const queryClient = useQueryClient();

  const knowledge = useQuery({
    queryKey: ["knowledge-base", search],
    queryFn: async () => {
      let query = supabase
        .from("knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });

      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeItem[];
    },
  });

  // Add knowledge mutation
  const addKnowledgeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof knowledgeSchema>) => {
      const { error } = await supabase
        .from("knowledge_base")
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      setIsAddDialogOpen(false);
      toast.success("Knowledge article added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add knowledge article: " + error.message);
    },
  });

  // Update knowledge mutation
  const updateKnowledgeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof knowledgeSchema> }) => {
      const { error } = await supabase
        .from("knowledge_base")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      setEditingItem(null);
      toast.success("Knowledge article updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update knowledge article: " + error.message);
    },
  });

  // Delete knowledge mutation
  const deleteKnowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_base")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      toast.success("Knowledge article deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete knowledge article: " + error.message);
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteKnowledgeMutation.mutate(id);
    }
  };

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description="Manage information that your AI assistant can reference during calls"
        actions={
          <Button size="sm">
            <Plus className="size-4" />
            Add Knowledge
          </Button>
        }
      />

      <div className="rounded-xl border bg-card shadow-card">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {knowledge.isError ? (
          <ErrorState message="Could not load knowledge base" onRetry={() => knowledge.refetch()} />
        ) : knowledge.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !knowledge.data?.length ? (
          <EmptyState icon={BookOpen} title="No knowledge articles yet">
            Add articles to help your AI assistant provide accurate information during calls.
          </EmptyState>
        ) : (
          <div className="divide-y">
            {knowledge.data.map((item) => (
              <div key={item.id} className="p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.content}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Updated {formatDateTime(item.updated_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="size-8">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8">
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Knowledge Base</CardTitle>
          <CardDescription>How your AI assistant uses this information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Knowledge base articles help your AI assistant provide accurate and consistent
            information during calls
          </p>
          <p>
            • Call transcripts can be saved as knowledge articles for training and reference
          </p>
          <p>
            • The assistant automatically references relevant articles based on the conversation
            context
          </p>
          <p>• Keep articles concise and well-organized for best results</p>
          <p>• Update regularly to ensure information stays current</p>
        </CardContent>
      </Card>
    </>
  );
}
