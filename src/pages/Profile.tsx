import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, UserCircle, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Doctor, HealthStructure } from "@/types/models";

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [healthStructure, setHealthStructure] = useState<HealthStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const data = await apiClient.getDoctorInfo();
        setProfile(data);
        setHealthStructure(data.healthStructure || null);
      } catch (error) {
        toast.error("Failed to fetch doctor information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorInfo();
  }, []);

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
            <h1 className="text-xl font-bold text-foreground">
              Doctor Profile
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !profile ? (
          <Card className="text-center py-16">
            <CardContent>
              <p className="text-muted-foreground">Failed to load profile information</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <UserCircle className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{profile.name}</CardTitle>
                    <CardDescription className="text-lg">
                      {profile.speciality}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.contact.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.contact.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.address.street} {profile.address.streetNumber},{" "}
                        {profile.address.city}, {profile.address.country}{" "}
                        {profile.address.zip}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {healthStructure && (
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <CardTitle>Health Structure</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Facility Name</p>
                    <p className="text-lg text-foreground">{healthStructure.name}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {healthStructure.contact.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {healthStructure.contact.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {healthStructure.address.street} {healthStructure.address.streetNumber},{" "}
                        {healthStructure.address.city}, {healthStructure.address.country}{" "}
                        {healthStructure.address.zip}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
