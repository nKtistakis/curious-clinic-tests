import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

interface ImageDescriptionQuestionProps {
  questionId: string;
  imageFile?: { name: string; data: string };
  onImageUpload: (questionId: string, file: File) => void;
  onRemoveImage: (questionId: string, field: string, value: any) => void;
}

export const ImageDescriptionQuestion = ({
  questionId,
  imageFile,
  onImageUpload,
  onRemoveImage,
}: ImageDescriptionQuestionProps) => {
  return (
    <div className="space-y-2">
      <Label>Image File (Required)</Label>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith("image/")) {
            onImageUpload(questionId, file);
          } else {
            toast.error("Please select an image file");
          }
        }}
      />
      {imageFile && (
        <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
          <ImageIcon className="h-4 w-4" />
          <span className="flex-1">{imageFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveImage(questionId, "imageFile", undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        ⚠️ This question requires manual scoring by the teacher/doctor.
      </p>
    </div>
  );
};
