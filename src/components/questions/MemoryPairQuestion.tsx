import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";

interface MemoryPair {
  id: string;
  word1: string;
  word2: string;
}

interface MemoryPairQuestionProps {
  questionId: string;
  pairs: MemoryPair[];
  onAddPair: (questionId: string) => void;
  onUpdatePair: (questionId: string, pairId: string, field: "word1" | "word2", value: string) => void;
  onRemovePair: (questionId: string, pairId: string) => void;
}

export const MemoryPairQuestion = ({
  questionId,
  pairs,
  onAddPair,
  onUpdatePair,
  onRemovePair,
}: MemoryPairQuestionProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Word Pairs (Students will match these)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAddPair(questionId)}
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Pair
        </Button>
      </div>
      {pairs?.map((pair, pairIndex) => (
        <div key={pair.id} className="flex gap-2 items-center">
          <Input
            placeholder={`Word ${pairIndex * 2 + 1}`}
            value={pair.word1}
            onChange={(e) => onUpdatePair(questionId, pair.id, "word1", e.target.value)}
            className="flex-1"
          />
          <span className="text-muted-foreground">↔</span>
          <Input
            placeholder={`Word ${pairIndex * 2 + 2}`}
            value={pair.word2}
            onChange={(e) => onUpdatePair(questionId, pair.id, "word2", e.target.value)}
            className="flex-1"
          />
          {pairs.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemovePair(questionId, pair.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
