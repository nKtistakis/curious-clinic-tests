import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Volume2, X } from "lucide-react";
import { toast } from "sonner";

interface QuestionAttachmentsProps {
  questionId: string;
  attachedFiles?: { name: string; data: string; type: string }[];
  onFileUpload: (questionId: string, file: File, fileType: "image" | "audio") => void;
  onRemoveFile: (questionId: string, fileIndex: number) => void;
}

export const QuestionAttachments = ({
  questionId,
  attachedFiles,
  onFileUpload,
  onRemoveFile,
}: QuestionAttachmentsProps) => {
  return (
    <div>
      <Label>Attached Files (Images/Audio)</Label>
      <div className="mt-2 space-y-2">
        <Input
          type="file"
          accept="image/*,audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const isImage = file.type.startsWith("image/");
              const isAudio = file.type.startsWith("audio/");
              if (isImage || isAudio) {
                onFileUpload(questionId, file, isImage ? "image" : "audio");
              } else {
                toast.error("Only image and audio files are allowed");
              }
            }
          }}
        />
        {attachedFiles && attachedFiles.length > 0 && (
          <div className="space-y-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm bg-muted p-2 rounded"
              >
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <span className="flex-1">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFile(questionId, idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
