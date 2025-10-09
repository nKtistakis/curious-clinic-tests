import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { Patient } from "@/types/models";

interface AssignTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  testName: string;
}

export function AssignTestDialog({
  open,
  onOpenChange,
  testId,
  testName,
}: AssignTestDialogProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [validDays, setValidDays] = useState<number>(7);
  const [timerType, setTimerType] = useState<"timer" | "stopwatch" | "none">("none");
  const [timerValue, setTimerValue] = useState<number>(3600);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const fetchedPatients = await apiClient.getPatients();
      setPatients(fetchedPatients);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.assignTest({
        testId,
        patientId: selectedPatientId,
        validDays,
        timerType: timerType === "none" ? null : timerType,
        timerValue: timerType === "timer" ? timerValue : undefined,
      });

      toast.success("Test assigned successfully!");
      onOpenChange(false);
      
      // Reset form
      setSelectedPatientId("");
      setValidDays(7);
      setTimerType("none");
      setTimerValue(3600);
    } catch (error) {
      console.error("Failed to assign test:", error);
      toast.error("Failed to assign test");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Test</DialogTitle>
          <DialogDescription>
            Assign "{testName}" to a patient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patients found.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="patient">Select Patient</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Choose a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient._id} value={patient._id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validDays">Valid for (days)</Label>
                <Input
                  id="validDays"
                  type="number"
                  min="1"
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                />
              </div>

              <div className="space-y-3">
                <Label>Timer / Stopwatch</Label>
                <RadioGroup value={timerType} onValueChange={(v) => setTimerType(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="font-normal cursor-pointer">
                      None
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="timer" id="timer" />
                    <Label htmlFor="timer" className="font-normal cursor-pointer">
                      Timer (patient must redo if time expires)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stopwatch" id="stopwatch" />
                    <Label htmlFor="stopwatch" className="font-normal cursor-pointer">
                      Stopwatch (record time taken)
                    </Label>
                  </div>
                </RadioGroup>

                {timerType === "timer" && (
                  <div className="ml-6 mt-2">
                    <Label htmlFor="timerValue">Time limit (seconds)</Label>
                    <Input
                      id="timerValue"
                      type="number"
                      min="1"
                      value={timerValue}
                      onChange={(e) => setTimerValue(parseInt(e.target.value) || 3600)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || patients.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Assigning..." : "Assign Test"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
