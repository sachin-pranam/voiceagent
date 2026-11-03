import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  duration?: string;
}

interface LiveTranscriptProps {
  callId?: string;
  isActive?: boolean;
  onCallEnd?: () => void;
  className?: string;
}

export function LiveTranscript({ 
  callId, 
  isActive = false, 
  onCallEnd, 
  className 
}: LiveTranscriptProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([
    {
      id: '1',
      role: 'user',
      message: 'What is the good thing about Sunway College.',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'assistant',
      message: 'Namaste, thank you for calling Sunway College Cat Mando. My name is Jamie, your AI support assistant. How may I help you today. If you meant Sunway College, I can share some good things about it. Sunway College Catmandu offers quality higher education. With programs like BSC...',
      timestamp: new Date(),
    }
  ]);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState('00:42');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Simulate call duration timer
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => {
        const [minutes, seconds] = prev.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds + 1;
        const newMinutes = Math.floor(totalSeconds / 60);
        const newSeconds = totalSeconds % 60;
        return `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopyTranscript = () => {
    const transcriptText = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.message}`)
      .join('\n');
    navigator.clipboard.writeText(transcriptText);
    toast.success('Transcript copied to clipboard');
  };

  const handleDownloadTranscript = () => {
    const transcriptText = messages
      .map(m => `[${m.timestamp.toLocaleTimeString()}] ${m.role === 'user' ? 'User' : 'Assistant'}: ${m.message}`)
      .join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${callId || 'call'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded');
  };

  const handleEndCall = () => {
    onCallEnd?.();
    toast.success('Call ended');
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="size-5 text-primary" />
            Transcript and Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Call Status */}
        {isActive && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="size-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm font-medium">ACTIVE CALL</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="font-mono text-sm font-medium">{callDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="size-8"
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEndCall}
                className="size-8 text-red-600 hover:bg-red-100 hover:text-red-700"
              >
                <PhoneOff className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Transcript Messages */}
        <div className={cn(
          'rounded-lg border bg-background',
          isExpanded ? 'h-96' : 'h-64'
        )}>
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    message.role === 'assistant' 
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                  )}>
                    {message.role === 'assistant' ? 
                      <Bot className="size-4" /> : 
                      <User className="size-4" />
                    }
                  </div>

                  <div className={cn(
                    'flex-1 space-y-1',
                    message.role === 'user' ? 'text-right' : ''
                  )}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {message.role === 'assistant' ? 'Assistant' : 'User'}
                      </span>
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.duration && (
                        <Badge variant="outline" className="text-xs">
                          {message.duration}
                        </Badge>
                      )}
                    </div>
                    <div className={cn(
                      'inline-block rounded-lg px-3 py-2 text-sm leading-relaxed',
                      message.role === 'assistant'
                        ? 'bg-muted text-left'
                        : 'bg-primary text-primary-foreground text-left'
                    )}>
                      {message.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Call Information */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="font-medium">Jamie — Sunway Colleg...</span>
            </div>
            <div className="font-mono text-muted-foreground">
              {callDuration}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyTranscript}
              className="size-8"
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownloadTranscript}
              className="size-8"
            >
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
            >
              <MessageSquare className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
            >
              <Mic className="size-4" />
            </Button>
            {isActive && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleEndCall}
                className="size-8"
              >
                <PhoneOff className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Twilio Integration Status */}
        <div className="rounded-lg border bg-green-50 p-3 dark:bg-green-900/20">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="font-medium text-green-800 dark:text-green-400">
              Twilio Connected
            </span>
            <span className="text-green-600 dark:text-green-500">
              • Real-time transcription active
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}