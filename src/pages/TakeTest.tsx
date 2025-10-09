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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  category?: string;
  questions: Question[];
}

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const loadTest = async () => {
      try {
        const foundTests = await apiClient.getTests(testId);
        if (foundTests && foundTests.length > 0) {
          setTest(foundTests[0]);

          // Check for saved progress from API
          try {
            const progressData = await apiClient.getTestProgress(testId!);
            if (progressData && progressData.answers) {
              setHasSavedProgress(true);
              setShowContinuePrompt(true);
            }
          } catch (error) {
            console.error("Failed to fetch test progress:", error);
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

    loadTest();
  }, [testId, navigate]);

  // Save individual answer to backend when it changes
  const handleAnswerChange = async (
    questionId: string,
    answerIndex: number
  ) => {
    const newAnswers = { ...answers, [questionId]: answerIndex };
    setAnswers(newAnswers);

    if (testId && !submitted) {
      try {
        await apiClient.postTestProgress(testId, {
          questionId,
          answer: answerIndex,
        });
      } catch (error) {
        console.error("Failed to save answer to server:", error);
        toast.error("Failed to save answer");
      }
    }
  };

  const handleContinue = async () => {
    try {
      const progressData = await apiClient.getTestProgress(testId!);
      if (progressData && progressData.answers) {
        setAnswers(progressData.answers);
        const answeredCount = Object.keys(progressData.answers).length;
        setCurrentQuestionIndex(answeredCount);
        toast.success("Continuing from where you left off");
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
      toast.error("Failed to load progress");
    }
    setShowContinuePrompt(false);
  };

  const handleStartFresh = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowContinuePrompt(false);
    toast.success("Starting fresh");
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== test?.questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    let correctCount = 0;
    test?.questions.forEach((question) => {
      if (answers[question.id] === question.correctOption) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / test.questions.length) * 100);

    // Collect question category IDs if available
    const questionCategories = test?.questions
      .map((q: any) => q.categoryId)
      .filter(Boolean);

    const testResult = {
      score: correctCount,
      totalQuestions: test.questions.length,
      percentage,
      answers,
      questionCategories,
    };

    setScore(correctCount);
    setSubmitted(true);

    // Submit to backend
    try {
      await apiClient.postTestResult(testId!, testResult);
      toast.success("Test submitted successfully!");
    } catch (error) {
      console.error("Failed to submit test result to server:", error);
      toast.warning("Test completed but failed to save to server");
    }
  };

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (showContinuePrompt && hasSavedProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <PlayCircle className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Continue Test?</CardTitle>
            <CardDescription>
              You have saved progress for this test. Would you like to continue
              from where you left off?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleContinue} className="w-full gap-2">
              <PlayCircle className="h-4 w-4" />
              Continue from Question {Object.keys(answers).length + 1}
            </Button>
            <Button
              variant="outline"
              onClick={handleStartFresh}
              className="w-full"
            >
              Start Fresh
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    const percentage = Math.round((score / test.questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-success/10 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
            </div>
            <CardTitle className="text-3xl">Test Complete!</CardTitle>
            <CardDescription className="text-lg">
              Here are your results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {percentage}%
              </div>
              <p className="text-muted-foreground">
                {score} out of {test.questions.length} correct
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {test.questions.map((question, index) => {
                const isCorrect =
                  answers[question.id] === question.correctOption;
                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? "border-success bg-success/5"
                        : "border-destructive bg-destructive/5"
                    }`}
                  >
                    <div className="font-medium mb-2">Question {index + 1}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {question.question}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Your answer: </span>
                      {question.options[answers[question.id]]}
                    </div>
                    {!isCorrect && (
                      <div className="text-sm mt-1 text-success">
                        <span className="font-medium">Correct answer: </span>
                        {question.options[question.correctOption]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleNext = () => {
    if (answers[currentQuestion.id] === undefined) {
      toast.error("Please select an answer before proceeding");
      return;
    }
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  {test.title}
                </h1>
                {test.category && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                    {test.category}
                  </span>
                )}
              </div>
              {test.description && (
                <p className="text-sm text-muted-foreground">
                  {test.description}
                </p>
              )}
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
                {answers[test.questions[index].id] !== undefined && (
                  <span className="ml-1 text-xs">✓</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={currentQuestionIndex.toString()} className="mt-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {currentQuestion.question}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={answers[currentQuestion.id]?.toString()}
                  onValueChange={(value) =>
                    handleAnswerChange(currentQuestion.id, parseInt(value))
                  }
                >
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem
                          value={optIndex.toString()}
                          id={`q${currentQuestion.id}-opt${optIndex}`}
                        />
                        <Label
                          htmlFor={`q${currentQuestion.id}-opt${optIndex}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

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
                    <Button onClick={handleSubmit} className="gap-2">
                      Submit Test
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
