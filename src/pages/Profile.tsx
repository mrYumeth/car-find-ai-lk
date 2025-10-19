import { useState, useEffect } from "react";
import { User, Camera, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { useNavigate } from "react-router-dom";

// Define types for the user data
interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
}

interface ProfileFormData {
  username: string;
  email: string;
  phone: string;
}

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // State for the editable form fields
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data: UserProfile = await response.json();
        setUser(data);
        // Initialize form data with fetched user details
        setFormData({
            username: data.username,
            email: data.email,
            phone: data.phone || ''
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Handle changes in the form inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // --- UPDATED: Function to handle form submission ---
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to update profile");
        }

        const updatedUser = await response.json();
        setUser(updatedUser); // Update the main user state to reflect changes

        toast({
            title: "Profile Updated",
            description: "Your information has been saved successfully.",
        });
        
        // Note: The username in the navigation bar will update on the next page refresh.

    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            title: "Update Failed",
            description: (error as Error).message,
            variant: "destructive",
        });
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    // ... (password change logic remains the same)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
            <Navigation />
            <div className="container mx-auto px-4 py-8 text-center">Could not load profile. Please log in again.</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="text-2xl">
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="icon" className="absolute bottom-0 right-0 rounded-full bg-blue-600 hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.username}</h1>
                  <p className="text-muted-foreground mb-3">{user.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* --- UPDATED: Form now uses state and onChange handlers --- */}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="username">Full Name</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tabs Content... */}
            <TabsContent value="listings">{/* Your listings content */}</TabsContent>
            <TabsContent value="favorites">{/* Your favorites content */}</TabsContent>
            <TabsContent value="security">{/* Your security content */}</TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;