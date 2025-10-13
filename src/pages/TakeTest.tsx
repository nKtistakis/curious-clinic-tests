import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
  pairs?: { id: string; word1: string; word2: string }[];
  audioFile?: { name: string; data: string };
  imageFile?: { name: string; data: string };
  attachedFiles?: { name: string; data: string; type: string }[];
}

interface Test {
  _id: string;
  name: string;
  questions: Question[];
  status?: string;
}

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testAssignmentId, setTestAssignmentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stopwatchStart] = useState(Date.now());

  useEffect(() => {
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      const testData = await apiClient.getAssignedTests(testId);

      if (testData) {
        setTest(testData.test);
        console.log(testData);

        // Get test assignment ID (in real implementation, this would come from API)
        // For now, using testId as placeholder
        setTestAssignmentId(testId || "");

        // Check if test is in-progress and load saved answers
        if (testData.status === "INPROGRESS") {
          try {
            const progressData = await apiClient.getTestProgress(testId!);
            if (progressData && progressData.answers) {
              setAnswers(progressData.answers);
              toast.success("Continuing from saved progress");
            }
          } catch (error) {
            console.error("Failed to fetch test progress:", error);
          }
        }
      } else {
        toast.error("Test not found");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch test:", error);
      toast.error("Failed to load test");
      navigate("/dashboard");
    }
  };

  const handleAnswerChange = async (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Submit answer to API immediately
    if (testAssignmentId && !isSubmitting) {
      try {
        await apiClient.submitAnswer({
          testAssignmentId,
          questionId,
          answer,
        });
      } catch (error) {
        console.error("Failed to save answer:", error);
        toast.error("Failed to save answer");
      }
    }
  };

  const handleNext = () => {
    if (!test) return;
    const currentQuestion = test.questions[currentQuestionIndex];

    if (!answers[currentQuestion._id]) {
      toast.error("Please provide an answer before proceeding");
      return;
    }

    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;

    const unansweredQuestions = test.questions.filter((q) => !answers[q._id]);

    if (unansweredQuestions.length > 0) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const timeTaken = Math.floor((Date.now() - stopwatchStart) / 1000);

      // For now, navigate to review page
      // In real implementation, check if manual scoring is needed
      const needsManualScoring = test.questions.some(
        (q) => q.category.code !== "MULTIPLE-CHOICE"
      );

      if (needsManualScoring) {
        toast.success("Test completed! Waiting for doctor review.");
        navigate("/dashboard");
      } else {
        // Auto-score and finish
        const answersArray = test.questions.map((q) => ({
          questionId: q._id,
          answer: answers[q._id],
        }));

        let totalScore = 0;
        let totalPoints = 0;

        test.questions.forEach((q) => {
          totalPoints += q.points;
          if (
            q.category.code === "MULTIPLE-CHOICE" &&
            q.correctOption !== undefined
          ) {
            const answerIndex = parseInt(answers[q._id]);
            if (answerIndex === q.correctOption) {
              totalScore += q.points;
            }
          }
        });

        const percentage =
          totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

        await apiClient.finishTest(testAssignmentId, {
          score: totalScore,
          totalQuestions: test.questions.length,
          percentage,
          answers: answersArray,
        });

        toast.success("Test completed and scored!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to submit test:", error);
      toast.error("Failed to submit test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    switch (question.category.code) {
      case "MULTIPLE-CHOICE":
        return (
          <RadioGroup
            value={answers[question._id] || ""}
            onValueChange={(value) => handleAnswerChange(question._id, value)}
          >
            <div className="space-y-3">
              {question.options?.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem
                    value={optIndex.toString()}
                    id={`q${question._id}-opt${optIndex}`}
                  />
                  <Label
                    htmlFor={`q${question._id}-opt${optIndex}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case "ESSAY":
      case "IMAGE-DESCRIPTION":
      case "AUDIO-MEMORY":
        return (
          <div className="space-y-3">
            {question.imageFile && (
              <div className="mb-4">
                <img
                  src={question.imageFile.data}
                  alt="Question image"
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
            {question.audioFile && (
              <div className="mb-4">
                <audio controls className="w-full">
                  <source src={question.audioFile.data} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <Textarea
              placeholder="Type your answer here..."
              value={answers[question._id] || ""}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              rows={6}
            />
          </div>
        );

      case "MEMORY-PAIRS":
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Match the pairs by entering the correct pairs (one per line,
              separated by " - ")
            </p>
            <Textarea
              placeholder="Example:\nWord1 - Word2\nWord3 - Word4"
              value={answers[question._id] || ""}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              rows={6}
            />
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Words to match:</p>
              <div className="grid grid-cols-2 gap-2">
                {question.pairs
                  ?.flatMap((p) => [p.word1, p.word2])
                  .map((word, i) => (
                    <div key={i} className="p-2 bg-background rounded border">
                      {word}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <Input
            placeholder="Type your answer here..."
            value={answers[question._id] || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
          />
        );
    }
  };

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{test.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentQuestionIndex.toString()} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-2">
            {test.questions.map((_, index) => (
              <TabsTrigger
                key={index}
                value={index.toString()}
                onClick={() => setCurrentQuestionIndex(index)}
                className="min-w-[60px]"
              >
                Q{index + 1}
                {answers[test.questions[index]._id] && (
                  <span className="ml-1 text-xs">✓</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={currentQuestionIndex.toString()} className="mt-6">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Question {currentQuestionIndex + 1} of{" "}
                      {test.questions.length}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      {currentQuestion.description}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentQuestion.points}{" "}
                    {currentQuestion.points === 1 ? "point" : "points"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentQuestion.attachedFiles &&
                  currentQuestion.attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      {currentQuestion.attachedFiles.map((file, idx) => (
                        <div key={idx}>
                          {file.type.startsWith("image/") && (
                            <img
                              src={file.data}
                              alt={file.name}
                              className="max-w-full h-auto rounded-lg border"
                            />
                          )}
                          {file.type.startsWith("audio/") && (
                            <audio controls className="w-full">
                              <source src={file.data} type={file.type} />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {renderQuestionInput(currentQuestion)}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isFirstQuestion}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Test"}
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="gap-2">
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TakeTest;
