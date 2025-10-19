import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Minus } from "lucide-react";

interface MultipleChoiceQuestionProps {
  questionId: string;
  options: string[];
  correctOption: number;
  onUpdateOption: (questionId: string, optionIndex: number, value: string) => void;
  onAddOption: (questionId: string) => void;
  onRemoveOption: (questionId: string, optionIndex: number) => void;
  onUpdateCorrectOption: (questionId: string, field: string, value: any) => void;
}

export const MultipleChoiceQuestion = ({
  questionId,
  options,
  correctOption,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  onUpdateCorrectOption,
}: MultipleChoiceQuestionProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Answer Options</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAddOption(questionId)}
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Option
        </Button>
      </div>
      {options?.map((option, optIndex) => (
        <div key={optIndex} className="flex gap-2 items-center">
          <Input
            placeholder={`Option ${optIndex + 1}`}
            value={option}
            onChange={(e) => onUpdateOption(questionId, optIndex, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant={correctOption === optIndex ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdateCorrectOption(questionId, "correctOption", optIndex)}
            className="whitespace-nowrap"
          >
            {correctOption === optIndex ? "Correct" : "Mark Correct"}
          </Button>
          {options.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveOption(questionId, optIndex)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
