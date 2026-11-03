import { FileText, MessageSquare, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TranscriptStatusProps {
  status: string | null;
  hasTranscript?: boolean;
}

export function TranscriptStatus({ status, hasTranscript }: TranscriptStatusProps) {
  if (status === 'completed' && hasTranscript) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20">
        <FileText className="size-3 mr-1" />
        Available
      </Badge>
    );
  }

  if (status === 'in-progress' || status === 'ringing') {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <MessageSquare className="size-3 mr-1" />
        Recording...
      </Badge>
    );
  }

  if (status === 'completed' && !hasTranscript) {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <Clock className="size-3 mr-1" />
        Processing
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      <XCircle className="size-3 mr-1" />
      None
    </Badge>
  );
}