import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Answer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  score?: number;
}

interface Question {
  _id: string;
  description: string;
  category: {
    code: string;
    name: string;
  };
  points: number;
  options?: string[];
  correctOption?: number;
}

const ReviewTest = () => {
  const { testAssignmentId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [manualScores, setManualScores] = useState<{ [key: string]: number }>(
    {}
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTestData();
  }, [testAssignmentId]);

  const loadTestData = async () => {
    try {
      const testData = await apiClient.getAssignedTests(testAssignmentId);
      setTest(testData);

      // Load answers from results if they exist - map to expected format
      if (testData.results?.answers) {
        const mappedAnswers = testData.results.answers.map((ans: any) => ({
          questionId: ans.question, // API returns 'question', we need 'questionId'
          answer: ans.answer,
          isCorrect: ans.isCorrect,
          score: ans.score,
        }));
        setAnswers(mappedAnswers);
      }

      // Load notes if they exist
      if (testData.results?.notes) {
        setNotes(testData.results.notes);
      }
    } catch (error) {
      console.error("Failed to load test:", error);
      toast.error("Failed to load test data");
    }
  };

  const calculateAutoScore = (
    question: Question,
    answer: Answer
  ): number | null => {
    if (question.category.code === "MULTIPLE-CHOICE") {
      if (question.options && question.correctOption !== undefined) {
        const answerIndex = parseInt(answer.answer);
        return answerIndex === question.correctOption ? question.points : 0;
      }
    }
    return null;
  };

  const handleManualScoreChange = (questionId: string, score: number) => {
    setManualScores({ ...manualScores, [questionId]: score });
  };

  const handleSubmit = async () => {
    if (!test) return;

    // Validate all manual scores are provided
    const missingScores = test.test.questions.filter((q: Question) => {
      const answer = answers.find((a) => a.questionId === q._id);
      if (!answer) return false;
      const autoScore = calculateAutoScore(q, answer);
      return autoScore === null && !manualScores[q._id] && manualScores[q._id] !== 0;
    });

    if (missingScores.length > 0) {
      toast.error("Please provide manual scores for all required questions");
      return;
    }

    // Calculate final score
    let totalScore = 0;
    let totalPoints = 0;

    const scoredAnswers = answers.map((answer) => {
      const question = test.test.questions.find(
        (q: Question) => q._id === answer.questionId
      );
      if (!question) return answer;

      totalPoints += question.points;

      const autoScore = calculateAutoScore(question, answer);
      const finalScore =
        autoScore !== null ? autoScore : (manualScores[answer.questionId] || 0);

      totalScore += finalScore;

      return {
        question: answer.questionId, // API expects 'question' not 'questionId'
        answer: answer.answer,
        score: finalScore,
      };
    });

    const percentage =
      totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

    setIsSubmitting(true);
    try {
      await apiClient.scoreTest({
        _id: testAssignmentId!,
        scorePercent: percentage,
        notes: notes.trim() || undefined,
        answers: scoredAnswers,
      });

      toast.success("Test scored and submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to submit test:", error);
      toast.error("Failed to submit test");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Review & Score Test
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Review answers and provide manual scores for questions that
              require it
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-6 mb-6">
          {test.test.questions.map((question: Question, index: number) => {
            const answer = answers.find((a) => a.questionId === question._id);
            const autoScore = answer
              ? calculateAutoScore(question, answer)
              : null;
            const requiresManualScore = autoScore === null;

            return (
              <Card key={question._id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Question {index + 1} - {question.category.name}
                  </CardTitle>
                  <CardDescription>{question.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Patient's Answer:</Label>
                    <p className="mt-1 p-3 bg-muted rounded-md">
                      {answer?.answer || "No answer provided"}
                    </p>
                  </div>

                  {question.category.code === "MULTIPLE-CHOICE" &&
                    question.options && (
                      <div>
                        <Label>Correct Answer:</Label>
                        <p className="mt-1 p-3 bg-success/10 text-success rounded-md">
                          {question.options[question.correctOption || 0]}
                        </p>
                      </div>
                    )}

                  <div className="flex items-center gap-4">
                    <div>
                      <Label>Points Available:</Label>
                      <p className="font-semibold">{question.points}</p>
                    </div>

                    {requiresManualScore ? (
                      <div className="flex-1">
                        <Label htmlFor={`score-${question._id}`}>
                          Manual Score (required)
                        </Label>
                        <Input
                          id={`score-${question._id}`}
                          type="number"
                          min="0"
                          max={question.points}
                          value={manualScores[question._id] || ""}
                          onChange={(e) =>
                            handleManualScoreChange(
                              question._id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="mt-1"
                          placeholder="Enter score"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Auto Score:</Label>
                        <p className="font-semibold text-primary">
                          {autoScore}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes (Optional)</CardTitle>
            <CardDescription>
              Add any additional notes or feedback about the test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Final Score"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ReviewTest;
