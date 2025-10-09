import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, ArrowLeft, Trash2, Edit, Activity } from "lucide-react";
import { toast } from "sonner";

interface Condition {
  _id: string;
  name: string;
  description: string;
}

const Conditions = () => {
  const navigate = useNavigate();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<Condition | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchConditions();
  }, []);

  const fetchConditions = async () => {
    try {
      const data = await apiClient.getConditions();
      setConditions(data);
    } catch (error) {
      toast.error("Failed to fetch conditions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCondition) {
        await apiClient.updateCondition(editingCondition._id, formData);
        toast.success("Condition updated successfully");
      } else {
        await apiClient.createCondition(formData);
        toast.success("Condition created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchConditions();
    } catch (error) {
      toast.error("Failed to save condition");
    }
  };

  const handleEdit = (condition: Condition) => {
    setEditingCondition(condition);
    setFormData({
      name: condition.name,
      description: condition.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (conditionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this condition? (Note that you cannot delete a condition that a patient has assigned)"
      )
    )
      return;

    try {
      await apiClient.deleteCondition(conditionId);
      toast.success("Condition deleted successfully");
      fetchConditions();
    } catch (error) {
      toast.error("Failed to delete condition");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingCondition(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Condition Management
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Conditions</h2>
            <p className="text-muted-foreground mt-1">
              Manage medical conditions to assign to patients
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2 shadow-md">
                <PlusCircle className="h-5 w-5" />
                Add Condition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCondition ? "Edit Condition" : "Add New Condition"}
                </DialogTitle>
                <DialogDescription>
                  Enter the condition information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Condition Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Alzheimer's Disease"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter condition description..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCondition ? "Update" : "Create"} Condition
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : conditions.length === 0 ? (
          <Card className="text-center py-16 shadow-sm">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-muted rounded-full">
                  <Activity className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No conditions yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by adding your first condition
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conditions.map((condition) => (
              <Card
                key={condition._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-1">{condition.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {condition.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(condition)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(condition._id)}
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
      </main>
    </div>
  );
};

export default Conditions;
