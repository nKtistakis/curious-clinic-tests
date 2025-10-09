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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, ArrowLeft, Trash2, Edit, User } from "lucide-react";
import { toast } from "sonner";
import type {
  Patient as PatientModel,
  Condition as ConditionModel,
} from "@/types/models";

interface Patient {
  _id: string;
  name: string;
  contact: {
    email: string;
    phone: string;
  };
  address: {
    street: string;
    streetNumber: string;
    city: string;
    country: string;
    zip: string;
  };
  conditions: string[];
}

interface Condition {
  _id: string;
  name: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: {
      email: "",
      phone: "",
    },
    address: {
      street: "",
      streetNumber: "",
      city: "",
      country: "",
      zip: "",
    },
    conditions: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsData, conditionsData] = await Promise.all([
        apiClient.getPatients(),
        apiClient.getConditions(),
      ]);
      setPatients(patientsData);
      setConditions(conditionsData);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPatient) {
        await apiClient.updatePatient(editingPatient._id, formData);
        toast.success("Patient updated successfully");
      } else {
        await apiClient.createPatient(formData);
        toast.success("Patient created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to save patient");
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      contact: patient.contact,
      address: patient.address,
      conditions: patient.conditions,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) return;

    try {
      await apiClient.deletePatient(patientId);
      toast.success("Patient deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete patient");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact: {
        email: "",
        phone: "",
      },
      address: {
        street: "",
        streetNumber: "",
        city: "",
        country: "",
        zip: "",
      },
      conditions: [],
    });
    setEditingPatient(null);
  };

  const toggleCondition = (conditionId: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(conditionId)
        ? prev.conditions.filter((id) => id !== conditionId)
        : [...prev.conditions, conditionId],
    }));
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
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Patient Management
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Patients</h2>
            <p className="text-muted-foreground mt-1">
              Manage your patient records and their conditions
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2 shadow-md">
                <PlusCircle className="h-5 w-5" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPatient ? "Edit Patient" : "Add New Patient"}
                </DialogTitle>
                <DialogDescription>
                  Enter the patient's information and assign conditions
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: { ...formData.contact, email: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.contact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: { ...formData.contact, phone: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Street"
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            street: e.target.value,
                          },
                        })
                      }
                      required
                    />
                    <Input
                      placeholder="Street Number"
                      value={formData.address.streetNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            streetNumber: e.target.value,
                          },
                        })
                      }
                      required
                    />
                    <Input
                      placeholder="City"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                      required
                    />
                    <Input
                      placeholder="Country"
                      value={formData.address.country}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            country: e.target.value,
                          },
                        })
                      }
                      required
                    />
                    <Input
                      placeholder="ZIP Code"
                      value={formData.address.zip}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, zip: e.target.value },
                        })
                      }
                      required
                      className="col-span-2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Conditions</Label>
                  <div className="border border-border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                    {conditions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No conditions available. Create conditions first.
                      </p>
                    ) : (
                      conditions.map((condition) => (
                        <div
                          key={condition._id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`condition-${condition._id}`}
                            checked={formData.conditions.includes(
                              condition._id
                            )}
                            onChange={() => toggleCondition(condition._id)}
                            className="rounded border-border"
                          />
                          <label
                            htmlFor={`condition-${condition._id}`}
                            className="text-sm cursor-pointer"
                          >
                            {condition.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
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
                    {editingPatient ? "Update" : "Create"} Patient
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
        ) : patients.length === 0 ? (
          <Card className="text-center py-16 shadow-sm">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-muted rounded-full">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No patients yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by adding your first patient
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <Card
                key={patient._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-1">{patient.name}</span>
                  </CardTitle>
                  <CardDescription>
                    <div className="space-y-1 text-sm">
                      <p>{patient.contact.email}</p>
                      <p>{patient.contact.phone}</p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {patient.address.street} {patient.address.streetNumber},{" "}
                      {patient.address.city}, {patient.address.country}{" "}
                      {patient.address.zip}
                    </p>
                    {patient.conditions && patient.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {patient.conditions.map((condId) => {
                          const condition = conditions.find(
                            (c) => c._id === condId
                          );
                          return condition ? (
                            <span
                              key={condId}
                              className="inline-block px-2 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium"
                            >
                              {condition.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(patient)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(patient._id)}
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

export default Patients;
