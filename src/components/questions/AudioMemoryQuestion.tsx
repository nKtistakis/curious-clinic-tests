import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, X } from "lucide-react";
import { toast } from "sonner";

interface AudioMemoryQuestionProps {
  questionId: string;
  audioFile?: { name: string; data: string };
  onAudioUpload: (questionId: string, file: File) => void;
  onRemoveAudio: (questionId: string, field: string, value: any) => void;
}

export const AudioMemoryQuestion = ({
  questionId,
  audioFile,
  onAudioUpload,
  onRemoveAudio,
}: AudioMemoryQuestionProps) => {
  return (
    <div className="space-y-2">
      <Label>Audio File (Required)</Label>
      <Input
        type="file"
        accept="audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith("audio/")) {
            onAudioUpload(questionId, file);
          } else {
            toast.error("Please select an audio file");
          }
        }}
      />
      {audioFile && (
        <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
          <Volume2 className="h-4 w-4" />
          <span className="flex-1">{audioFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveAudio(questionId, "audioFile", undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Students will listen to the audio and answer based on what they hear.
      </p>
    </div>
  );
};
