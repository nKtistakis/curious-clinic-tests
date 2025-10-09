import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  Save,
  Minus,
  Upload,
  X,
  FileText,
  ImageIcon,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import type { QuestionCategory } from "@/types/models";

interface Question {
  _id: string;
  category: QuestionCategory | null;
  description: string;
  points: number;
  options?: string[];
  correctOption?: number;
  pairs?: MemoryPair[];
  audioFile?: { name: string; data: string };
  imageFile?: { name: string; data: string };
  attachedFiles?: { name: string; data: string; type: string }[];
  manualScore?: boolean;
}

interface MemoryPair {
  id: string;
  word1: string;
  word2: string;
}

const CreateTest = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [availableCategories, setAvailableCategories] = useState<
    QuestionCategory[]
  >([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    // Fetch question categories from API
    const fetchCategories = async () => {
      try {
        const categories = await apiClient.getQuestionCategories();
        setAvailableCategories(categories);

        // If only one category, set as default for first question
        if (categories.length === 1 && questions.length === 0) {
          setQuestions([
            {
              _id: "1",
              category: categories[0],
              description: "",
              points: 1,
              options:
                categories[0].code === "MULTIPLE-CHOICE" ? ["", ""] : undefined,
              correctOption:
                categories[0].code === "MULTIPLE-CHOICE" ? 0 : undefined,
              pairs:
                categories[0].code === "MEMORY-PAIRS"
                  ? [{ id: "1", word1: "", word2: "" }]
                  : undefined,
              manualScore:
                categories[0].code === "IMAGE-DESCRIPTION" ? true : undefined,
              attachedFiles: [],
            },
          ]);
        } else if (categories.length > 1 && questions.length === 0) {
          // Multiple categories available, create empty question
          setQuestions([
            {
              _id: "1",
              category: null,
              description: "",
              points: 1,
              options: ["", ""],
              correctOption: 0,
              attachedFiles: [],
            },
          ]);
        }
      } catch (error) {
        toast.error("Failed to fetch question categories");
        console.error(error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    // Load test data if editing
    if (testId) {
      const loadTest = async () => {
        try {
          const tests = await apiClient.getTests(testId);

          if (tests && tests.length > 0) {
            const test = tests[0];
            setName(test.name);
            setQuestions(test.questions);
            setNotes(test.notes || "");
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
    }
  }, [navigate, testId]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        _id: "1",
        category: availableCategories[0],
        description: "",
        points: 1,
        options:
          availableCategories[0].code === "MULTIPLE-CHOICE"
            ? ["", ""]
            : undefined,
        correctOption:
          availableCategories[0].code === "MULTIPLE-CHOICE" ? 0 : undefined,
        pairs:
          availableCategories[0].code === "MEMORY-PAIRS"
            ? [{ id: "1", word1: "", word2: "" }]
            : undefined,
        manualScore:
          availableCategories[0].code === "IMAGE-DESCRIPTION"
            ? true
            : undefined,
        attachedFiles: [],
      },
    ]);
  };

  const removeQuestion = (_id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q._id !== _id));
    }
  };

  const updateQuestion = (_id: string, field: string, value: any) => {
    setQuestions(
      questions.map((q) => (q._id === _id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q._id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q._id === questionId ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q._id === questionId && q.options && q.options.length > 2) {
          const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
          return {
            ...q,
            options: newOptions,
            correctOption:
              q.correctOption !== undefined &&
              q.correctOption >= optionIndex &&
              q.correctOption > 0
                ? q.correctOption - 1
                : q.correctOption !== undefined &&
                  q.correctOption >= newOptions.length
                ? newOptions.length - 1
                : q.correctOption,
          };
        }
        return q;
      })
    );
  };

  const handleFileUpload = (
    questionId: string,
    file: File,
    fileType: "image" | "audio"
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const fileData = { name: file.name, data, type: file.type };

      // Upload question attachment
      setQuestions(
        questions.map((q) =>
          q._id === questionId
            ? { ...q, attachedFiles: [...(q.attachedFiles || []), fileData] }
            : q
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (questionId: string, fileIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q._id === questionId
          ? {
              ...q,
              attachedFiles: q.attachedFiles?.filter(
                (_, idx) => idx !== fileIndex
              ),
            }
          : q
      )
    );
  };

  const handleAudioUpload = (questionId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setQuestions(
        questions.map((q) =>
          q._id === questionId
            ? { ...q, audioFile: { name: file.name, data } }
            : q
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (questionId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setQuestions(
        questions.map((q) =>
          q._id === questionId
            ? { ...q, imageFile: { name: file.name, data } }
            : q
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const addMemoryPair = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q._id === questionId
          ? {
              ...q,
              pairs: [
                ...(q.pairs || []),
                { id: Date.now().toString(), word1: "", word2: "" },
              ],
            }
          : q
      )
    );
  };

  const updateMemoryPair = (
    questionId: string,
    pairId: string,
    field: "word1" | "word2",
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q._id === questionId
          ? {
              ...q,
              pairs: q.pairs?.map((p) =>
                p.id === pairId ? { ...p, [field]: value } : p
              ),
            }
          : q
      )
    );
  };

  const removeMemoryPair = (questionId: string, pairId: string) => {
    setQuestions(
      questions.map((q) =>
        q._id === questionId
          ? { ...q, pairs: q.pairs?.filter((p) => p.id !== pairId) }
          : q
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a test name");
      return;
    }

    if (availableCategories.length === 0) {
      toast.error(
        "Cannot create test: No question categories available from backend"
      );
      return;
    }

    const incompleteQuestion = questions.find((q) => {
      if (!q.description.trim() || !q.category) return true;

      if (q.category.code === "MULTIPLE-CHOICE" && q.options) {
        return q.options.some((opt) => !opt.trim());
      }
      if (q.category.code === "MEMORY-PAIRS" && q.pairs) {
        return q.pairs.some((p) => !p.word1.trim() || !p.word2.trim());
      }
      if (q.category.code === "AUDIO-MEMORY" && !q.audioFile) {
        return true;
      }
      if (q.category.code === "IMAGE-DESCRIPTION" && !q.imageFile) {
        return true;
      }
      return false;
    });

    if (incompleteQuestion) {
      toast.error("Please complete all questions and their required fields");
      return;
    }

    try {
      const testData = {
        name,
        questions,
      };

      if (testId) {
        await apiClient.updateTest(testId, testData);
        toast.success("Test updated successfully!");
      } else {
        await apiClient.createTest(testData);
        toast.success("Test created successfully!");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to save test:", error);
      toast.error("Failed to save test");
    }
  };

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
              {testId ? "Edit Test" : "Create New Test"}
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Test Title</Label>
              <Input
                id="name"
                placeholder="e.g., Math Quiz - Chapter 5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="notes">Test Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes for this test..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <Card key={question._id} className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    Question {qIndex + 1}
                  </CardTitle>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(question._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={question.category?._id || ""}
                      onValueChange={(categoryId: string) => {
                        const selectedCategory = availableCategories.find(
                          (cat) => cat._id === categoryId
                        );
                        if (!selectedCategory) return;

                        const updates: Partial<Question> = {
                          category: selectedCategory,
                        };
                        if (selectedCategory.code === "MULTIPLE-CHOICE") {
                          updates.options = ["", ""];
                          updates.correctOption = 0;
                        } else if (selectedCategory.code === "MEMORY-PAIRS") {
                          updates.pairs = [{ id: "1", word1: "", word2: "" }];
                        } else if (
                          selectedCategory.code === "IMAGE-DESCRIPTION"
                        ) {
                          updates.manualScore = true;
                        }
                        setQuestions(
                          questions.map((q) =>
                            q._id === question._id ? { ...q, ...updates } : q
                          )
                        );
                      }}
                      disabled={availableCategories.length === 1}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCategories ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            Loading categories...
                          </div>
                        ) : availableCategories.length === 0 ? (
                          <div className="p-2 text-center text-sm text-destructive">
                            No categories available - cannot create test
                          </div>
                        ) : (
                          availableCategories.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) =>
                        updateQuestion(
                          question._id,
                          "points",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Question</Label>
                  <Textarea
                    placeholder="Enter your question here"
                    value={question.description}
                    onChange={(e) =>
                      updateQuestion(
                        question._id,
                        "description",
                        e.target.value
                      )
                    }
                    className="mt-2"
                  />
                </div>

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
                            handleFileUpload(
                              question._id,
                              file,
                              isImage ? "image" : "audio"
                            );
                          } else {
                            toast.error(
                              "Only image and audio files are allowed"
                            );
                          }
                        }
                      }}
                    />
                    {question.attachedFiles &&
                      question.attachedFiles.length > 0 && (
                        <div className="space-y-1">
                          {question.attachedFiles.map((file, idx) => (
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
                                onClick={() => removeFile(question._id, idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {question.category?.code === "MULTIPLE-CHOICE" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Answer Options</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(question._id)}
                        className="gap-1"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                    {question.options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Option ${optIndex + 1}`}
                          value={option}
                          onChange={(e) =>
                            updateOption(question._id, optIndex, e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant={
                            question.correctOption === optIndex
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            updateQuestion(
                              question._id,
                              "correctOption",
                              optIndex
                            )
                          }
                          className="whitespace-nowrap"
                        >
                          {question.correctOption === optIndex
                            ? "Correct"
                            : "Mark Correct"}
                        </Button>
                        {question.options && question.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(question._id, optIndex)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {question.category?.code === "ESSAY" && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Students will be able to write a text response to this
                      question. You can review and score their answers manually.
                    </p>
                  </div>
                )}

                {question.category?.code === "MEMORY-PAIRS" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Word Pairs (Students will match these)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addMemoryPair(question._id)}
                        className="gap-1"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Pair
                      </Button>
                    </div>
                    {question.pairs?.map((pair, pairIndex) => (
                      <div key={pair.id} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Word ${pairIndex * 2 + 1}`}
                          value={pair.word1}
                          onChange={(e) =>
                            updateMemoryPair(
                              question._id,
                              pair.id,
                              "word1",
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                        <span className="text-muted-foreground">↔</span>
                        <Input
                          placeholder={`Word ${pairIndex * 2 + 2}`}
                          value={pair.word2}
                          onChange={(e) =>
                            updateMemoryPair(
                              question._id,
                              pair.id,
                              "word2",
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                        {question.pairs && question.pairs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeMemoryPair(question._id, pair.id)
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {question.category?.code === "AUDIO-MEMORY" && (
                  <div className="space-y-2">
                    <Label>Audio File (Required)</Label>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.type.startsWith("audio/")) {
                          handleAudioUpload(question._id, file);
                        } else {
                          toast.error("Please select an audio file");
                        }
                      }}
                    />
                    {question.audioFile && (
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <Volume2 className="h-4 w-4" />
                        <span className="flex-1">
                          {question.audioFile.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuestion(question._id, "audioFile", undefined)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Students will listen to the audio and answer based on what
                      they hear.
                    </p>
                  </div>
                )}

                {question.category?.code === "IMAGE-DESCRIPTION" && (
                  <div className="space-y-2">
                    <Label>Image File (Required)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          handleImageUpload(question._id, file);
                        } else {
                          toast.error("Please select an image file");
                        }
                      }}
                    />
                    {question.imageFile && (
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <ImageIcon className="h-4 w-4" />
                        <span className="flex-1">
                          {question.imageFile.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuestion(question._id, "imageFile", undefined)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ⚠️ This question requires manual scoring by the
                      teacher/doctor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 mt-8 justify-between">
          <Button
            variant="outline"
            onClick={addQuestion}
            className="gap-2"
            disabled={availableCategories.length === 0}
          >
            <PlusCircle className="h-5 w-5" />
            Add Question
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 shadow-md"
            disabled={availableCategories.length === 0}
          >
            <Save className="h-5 w-5" />
            {testId ? "Update Test" : "Save Test"}
          </Button>
        </div>

        {availableCategories.length === 0 && !isLoadingCategories && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md text-center">
            <p className="font-medium">
              Cannot create test: No question categories available
            </p>
            <p className="text-sm mt-1">
              Please contact your administrator to add question categories.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateTest;
