import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { ErrorState, PageHeader } from "@/components/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getVapiSettings, testVapiConnection, syncVapiCalls, updateVapiAssistant, getVapiAssistant } from "@/lib/admin.functions";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { voices, models } from "@/lib/voices";
import { Settings, Mic, MessageSquare, Phone, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <AdminOnly>
      <SettingsPage />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Settings — Awaaz AI" },
      { name: "description", content: "Twilio SIP integration, voice settings and assistant configuration." },
      { property: "og:title", content: "Settings — Awaaz AI" },
      { property: "og:description", content: "Twilio SIP integration, voice settings and assistant configuration." },
    ],
  }),
});

const voiceSchema = z.object({
  voice: z.string().min(1, "Voice selection is required"),
  model: z.string().min(1, "Model selection is required"),
  temperature: z.number().min(0).max(2),
  maxDurationSeconds: z.number().min(30).max(3600),
});

const promptsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  firstMessage: z.string().min(1, "First message is required").max(500),
  systemPrompt: z.string().min(1, "System prompt is required").max(4000), // Increased limit
});

const assistantSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  firstMessage: z.string().min(1, "First message is required").max(500),
  systemPrompt: z.string().min(1, "System prompt is required").max(4000), // Increased limit
  voice: z.string().min(1, "Voice selection is required"),
  model: z.string().min(1, "Model selection is required"),
  temperature: z.number().min(0).max(2),
  maxDurationSeconds: z.number().min(30).max(3600),
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("connection");
  const getFn = useServerFn(getVapiSettings);
  const testFn = useServerFn(testVapiConnection);
  const syncFn = useServerFn(syncVapiCalls);
  const getAssistantFn = useServerFn(getVapiAssistant);
  const updateAssistantFn = useServerFn(updateVapiAssistant);
  const queryClient = useQueryClient();

  const s = useQuery({ queryKey: ["sip-settings"], queryFn: () => getFn() });
  const assistant = useQuery({ 
    queryKey: ["sip-assistant"], 
    queryFn: () => getAssistantFn(),
    enabled: !!s.data?.assistantId 
  });

  const test = useMutation({
    mutationFn: () => testFn(),
    onSuccess: (r) => {
      if (r.status === "connected") {
        toast.success(r.message);
        if (r.details) {
          console.log("Vapi Connection Details:", r.details);
        }
      } else {
        toast.error(r.message);
      }
    },
  });

  const sync = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (result) => {
      toast.success(`Synced ${result.synced} calls from Twilio`);
      queryClient.invalidateQueries({ queryKey: ["sip-settings"] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const updateAssistant = useMutation({
    mutationFn: (data: z.infer<typeof assistantSchema>) => updateAssistantFn({ data }),
    onSuccess: () => {
      toast.success("Assistant settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["sip-assistant"] });
    },
    onError: (error) => {
      console.error("Update assistant error:", error);
      toast.error(`Failed to update assistant: ${error.message}`);
    },
  });

  const form = useForm<z.infer<typeof assistantSchema>>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      name: "",
      firstMessage: "Hello! I'm your AI assistant. How can I help you today?",
      systemPrompt: "You are a helpful AI assistant. Be concise, friendly, and professional in your responses.",
      voice: "alloy",
      model: "gpt-4-turbo",
      temperature: 0.7,
      maxDurationSeconds: 600,
    },
    mode: "onChange", // Validate on change instead of submit
  });

  // Update form when assistant data loads
  React.useEffect(() => {
    if (assistant.data) {
      form.reset({
        name: assistant.data.name || "",
        firstMessage: assistant.data.firstMessage || "Hello! I'm your AI assistant. How can I help you today?",
        systemPrompt: assistant.data.systemPrompt || "You are a helpful AI assistant. Be concise, friendly, and professional in your responses.",
        voice: assistant.data.voice || "alloy",
        model: assistant.data.model || "gpt-4-turbo", 
        temperature: assistant.data.temperature || 0.7,
        maxDurationSeconds: assistant.data.maxDurationSeconds || 600,
      });
    }
  }, [assistant.data, form]);

  const status = test.data?.status ?? (s.data?.hasPrivateKey ? "untested" : "not_configured");
  const label = {
    connected: "Connected",
    not_configured: "Not configured",
    error: "Connection error",
    untested: "Configured (not tested)",
  }[status];

  const webhook = typeof window !== "undefined" ? `${window.location.origin}/api/public/vapi-webhook` : "";

  const connectionRows: [string, string][] = [
    ["Connection status", label],
    ["Assistant ID", s.data?.assistantId ?? "Not set"],
    ["SIP webhook endpoint", webhook],
    ["Webhook secret", s.data?.hasServerSecret ? "Configured" : "Not set"],
    ["Last webhook received", formatDateTime(s.data?.lastWebhookAt)],
    ["Last sync", formatDateTime(s.data?.lastSyncAt)],
    ...(test.data?.details ? [
      ["Assistant Configured", test.data.details.assistantConfigured ? "Yes" : "No"],
      ["Calls Available", String(test.data.details.callsAvailable)],
    ] as [string, string][] : [])
  ];

  const onSubmit = form.handleSubmit(
    async (data) => {
      console.log("Form submission data:", data);
      console.log("Form validation errors:", form.formState.errors);
      try {
        updateAssistant.mutate(data);
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    (errors) => {
      console.error("Form validation errors:", errors);
      toast.error("Please fix the form errors before saving");
    }
  );

  const onSubmitVoice = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = form.getValues();
    
    // Validate only voice-related fields
    const voiceData = {
      voice: formData.voice,
      model: formData.model,
      temperature: formData.temperature,
      maxDurationSeconds: formData.maxDurationSeconds,
    };
    
    const voiceValidation = voiceSchema.safeParse(voiceData);
    if (!voiceValidation.success) {
      console.error("Voice validation errors:", voiceValidation.error.errors);
      toast.error("Please fix the voice settings errors before saving");
      return;
    }
    
    // Ensure system prompt doesn't exceed limit
    let systemPrompt = formData.systemPrompt || "You are a helpful AI assistant. Be concise, friendly, and professional in your responses.";
    if (systemPrompt.length > 4000) {
      systemPrompt = systemPrompt.substring(0, 3997) + "...";
    }
    
    // Ensure we have all required data
    const completeData = {
      name: formData.name || "AI Assistant",
      firstMessage: formData.firstMessage || "Hello! I'm your AI assistant. How can I help you today?",
      systemPrompt: systemPrompt,
      voice: formData.voice,
      model: formData.model,
      temperature: formData.temperature,
      maxDurationSeconds: formData.maxDurationSeconds,
    };
    
    console.log("Voice settings submission:", completeData);
    updateAssistant.mutate(completeData);
  };

  const onSubmitPrompts = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = form.getValues();
    
    // Truncate system prompt if it's too long
    if (formData.systemPrompt && formData.systemPrompt.length > 4000) {
      formData.systemPrompt = formData.systemPrompt.substring(0, 3997) + "...";
      form.setValue("systemPrompt", formData.systemPrompt);
    }
    
    // Validate only prompts-related fields
    const promptsData = {
      name: formData.name,
      firstMessage: formData.firstMessage,
      systemPrompt: formData.systemPrompt,
    };
    
    const promptsValidation = promptsSchema.safeParse(promptsData);
    if (!promptsValidation.success) {
      console.error("Prompts validation errors:", promptsValidation.error.errors);
      toast.error("Please fix the assistant configuration errors before saving");
      return;
    }
    
    // Ensure we have all required data
    const completeData = {
      name: formData.name,
      firstMessage: formData.firstMessage,
      systemPrompt: formData.systemPrompt,
      voice: formData.voice || "alloy",
      model: formData.model || "gpt-4-turbo",
      temperature: formData.temperature || 0.7,
      maxDurationSeconds: formData.maxDurationSeconds || 600,
    };
    
    console.log("Prompts settings submission:", completeData);
    updateAssistant.mutate(completeData);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure Twilio SIP integration, voice settings, and AI assistant behavior"
        icon={Settings}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Zap className="size-4" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="size-4" />
            Voice & Model
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            Prompts & Behavior
          </TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="size-5" />
                  Twilio SIP Connection
                </CardTitle>
                <CardDescription>
                  Monitor your Twilio SIP integration status and sync call data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {s.isError ? (
                  <ErrorState onRetry={() => s.refetch()} />
                ) : (
                  <div className="space-y-4">
                    <dl className="space-y-3 text-sm">
                      {connectionRows.map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="break-all font-mono text-xs sm:text-sm">
                            {k === "Connection status" ? (
                              <Badge 
                                variant={status === "connected" ? "default" : status === "error" ? "destructive" : "secondary"}
                              >
                                {v}
                              </Badge>
                            ) : v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    
                    <Separator />
                    
                    <div className="flex gap-3">
                      <Button 
                        size="sm" 
                        onClick={() => test.mutate()} 
                        disabled={test.isPending}
                        variant="outline"
                      >
                        Test Connection
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sync.mutate()}
                        disabled={sync.isPending || status !== "connected"}
                      >
                        {sync.isPending ? "Syncing..." : "Sync Calls"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voice & Model Tab */}
        <TabsContent value="voice">
          <form onSubmit={onSubmitVoice} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="size-5" />
                  Voice Settings
                </CardTitle>
                <CardDescription>
                  Configure the AI voice and language model for your calls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="voice">Voice Selection</Label>
                    <Select value={form.watch("voice")} onValueChange={(value) => form.setValue("voice", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{voice.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {voice.provider}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.voice && (
                      <p className="text-xs text-destructive">{form.formState.errors.voice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">AI Model</Label>
                    <Select value={form.watch("model")} onValueChange={(value) => form.setValue("model", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{model.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {model.provider}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.model && (
                      <p className="text-xs text-destructive">{form.formState.errors.model.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Temperature ({form.watch("temperature")})
                    </Label>
                    <Input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      {...form.register("temperature", { valueAsNumber: true })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower values make responses more focused, higher values make them more creative
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDurationSeconds">Max Call Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="3600"
                      {...form.register("maxDurationSeconds", { valueAsNumber: true })}
                    />
                    {form.formState.errors.maxDurationSeconds && (
                      <p className="text-xs text-destructive">{form.formState.errors.maxDurationSeconds.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateAssistant.isPending}>
                    {updateAssistant.isPending ? "Saving..." : "Save Voice Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Prompts & Behavior Tab */}
        <TabsContent value="prompts">
          <form onSubmit={onSubmitPrompts} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="size-5" />
                  AI Assistant Configuration
                </CardTitle>
                <CardDescription>
                  Customize how your AI assistant behaves and responds to callers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Assistant Name</Label>
                  <Input
                    {...form.register("name")}
                    placeholder="e.g., Customer Service Assistant"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstMessage">First Message</Label>
                  <Textarea
                    {...form.register("firstMessage")}
                    placeholder="What the assistant says when answering the call..."
                    rows={3}
                  />
                  {form.formState.errors.firstMessage && (
                    <p className="text-xs text-destructive">{form.formState.errors.firstMessage.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This is the first thing callers will hear when the AI answers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    {...form.register("systemPrompt")}
                    placeholder="You are a helpful assistant that..."
                    rows={6}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Define the AI's personality, knowledge, and behavior during calls
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {form.watch("systemPrompt")?.length || 0}/4000 characters
                    </p>
                  </div>
                  {form.formState.errors.systemPrompt && (
                    <p className="text-xs text-destructive">{form.formState.errors.systemPrompt.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateAssistant.isPending}>
                    {updateAssistant.isPending ? "Saving..." : "Save Assistant Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );
}