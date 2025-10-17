import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  FileText,
  Users,
  LogOut,
  Trash2,
  Edit,
  UserCircle,
  Clock,
  CheckCircle2,
  PlayCircle,
  Activity,
  UserPlus,
} from "lucide-react";
import { AssignTestDialog } from "@/components/AssignTestDialog";
import { toast } from "sonner";
import type { Test } from "@/types/models";

interface LocalTest {
  _id: string;
  name: string;
  // description: string;
  category: string;
  questions: any[];
  createdAt: string;
}

interface AssignedTest {
  _id: string;
  test: any;
  patient: {
    _id: string;
    name: string;
  };
  status: {
    _id: string;
    code: "PENDING" | "INPROGRESS" | "COMPLETED";
    name: string;
  };
  startDate: string;
  endDate: string;
  results?: {
    scorePercent: number;
    notes?: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tests, setTests] = useState<LocalTest[]>([]);
  const [assignedTests, setAssignedTests] = useState<AssignedTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const fetchedTests = await apiClient.getTests();
        setTests(fetchedTests);

        // Fetch assigned tests
        const assigned = await apiClient.getAssignedTests();
        setAssignedTests(Array.isArray(assigned) ? assigned : [assigned]);
      } catch (error) {
        // Fallback to localStorage for now
        const storedTests = localStorage.getItem("tests");
        if (storedTests) {
          setTests(JSON.parse(storedTests));
        }
        console.error("Failed to fetch tests from server", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleDeleteTest = async (testId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this test? This action cannot be undone."
      )
    ) {
      try {
        await apiClient.deleteTest(testId);

        setTests((prevTests) => prevTests.filter((t) => t._id !== testId));
        setAssignedTests((prevAssigned) =>
          prevAssigned.filter((t) => t._id !== testId)
        );

        console.log(`Deleted test ${testId}`);
      } catch (err) {
        console.error("Error deleting test:", err);
        alert("Failed to delete test. Please try again.");
      }
    }

    const updatedTests = tests.filter((test) => test._id !== testId);
    setTests(updatedTests);
    localStorage.setItem("tests", JSON.stringify(updatedTests));
    toast.success("Test deleted successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Alzplat - Test Manager
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/profile")}
                className="gap-2"
              >
                <UserCircle className="h-4 w-4" />
                Profile
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate("/patients")}
            className="gap-2"
          >
            <Users className="h-5 w-5" />
            Patients
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/conditions")}
            className="gap-2"
          >
            <Activity className="h-5 w-5" />
            Conditions
          </Button>
        </div>

        {/* Assigned Tests Section */}
        {assignedTests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Assigned Tests</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedTests.map((assignedTest) => (
                <Card
                  key={assignedTest._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {assignedTest.test.name}
                      </CardTitle>
                      <Badge
                        variant={
                          assignedTest.status?.code === "COMPLETED"
                            ? "default"
                            : assignedTest.status?.code === "INPROGRESS"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {assignedTest.status?.code === "COMPLETED" && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {assignedTest.status?.code === "INPROGRESS" && (
                          <PlayCircle className="h-3 w-3 mr-1" />
                        )}
                        {assignedTest.status?.code === "PENDING" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {assignedTest.status?.name}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      Patient: {assignedTest.patient.name}
                    </CardDescription>
                    <CardDescription>
                      Test: {assignedTest.test.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Start:{" "}
                        {new Date(assignedTest.startDate).toLocaleDateString()}
                      </p>
                      <p>
                        Valid Until:{" "}
                        {assignedTest.endDate
                          ? new Date(assignedTest.endDate).toLocaleDateString()
                          : "No expiration"}
                      </p>
                      {assignedTest.results && (
                        <>
                          <p className="font-semibold text-foreground mt-2">
                            Score: {assignedTest.results.scorePercent}%
                          </p>
                          {assignedTest.results.notes && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium text-foreground mb-1">
                                Notes:
                              </p>
                              <p className="text-xs">
                                {assignedTest.results.notes}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Show Review/Score button if completed but no results */}
                      {assignedTest?.status?.code === "COMPLETED" &&
                        !assignedTest.results.scorePercent && (
                          <Button
                            variant="default"
                            className="mt-4 w-full"
                            onClick={() =>
                              navigate(`/review-test/${assignedTest._id}`)
                            }
                          >
                            Review/Score
                          </Button>
                        )}

                      {/* Show Take Test button if not completed */}
                      {assignedTest?.status?.code !== "COMPLETED" && (
                        <Button
                          variant="secondary"
                          className="mt-4 w-full"
                          onClick={() =>
                            navigate(`/take-test/${assignedTest._id}`)
                          }
                        >
                          Take Test
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Created Tests
            </h2>
            <p className="text-muted-foreground mt-1">
              Create the tests for your patients and manage them easily.
            </p>
          </div>
          <Button
            onClick={() => navigate("/create-test")}
            className="gap-2 shadow-md"
          >
            <PlusCircle className="h-5 w-5" />
            Create New Test
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : tests.length === 0 ? (
          <Card className="text-center py-16 shadow-sm">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-muted rounded-full">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No tests yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first test
              </p>
              <Button
                onClick={() => navigate("/create-test")}
                className="gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                Create Your First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card
                key={test._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-1">{test.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    This is a test descipriton
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {test.category && (
                      <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {test.category}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{test.questions.length} questions</span>
                    </div>
                  </div>
                  <div className="flex justify-center  gap-6">
                    <Button
                      className="flex-1"
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/create-test/${test._id}`)}
                      title="Edit test"
                    >
                      Edit
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedTest({ id: test._id, name: test.name });
                        setAssignDialogOpen(true);
                      }}
                      title="Assign test"
                      className="flex-1"
                    >
                      Assign
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteTest(test._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTest && (
          <AssignTestDialog
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            testId={selectedTest.id}
            testName={selectedTest.name}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
