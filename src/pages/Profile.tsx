// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Car, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import VehicleCard from "@/components/VehicleCard"; // This is no longer used, but we can leave it

// Interface for profile data
interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

// Interface for listings (no longer used here but kept for reference)
// interface Vehicle { ... }

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
  });
  
  // +++ NEW State for password form +++
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  // +++ END NEW State +++

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data: UserProfile = await response.json();
        setProfile(data);
        setFormData({
          username: data.username,
          email: data.email,
          phone: data.phone || "",
        });
      } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  // Handle profile info input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // +++ NEW: Handle password input change +++
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Handle profile info update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const token = localStorage.getItem('token');
    
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
      const updatedProfile: UserProfile = await response.json();
      setProfile(updatedProfile);
      setFormData({
        username: updatedProfile.username,
        email: updatedProfile.email,
        phone: updatedProfile.phone || "",
      });
      toast({ title: "Success!", description: "Your profile has been updated." });
      // Update username in nav
      window.dispatchEvent(new Event('authChange')); 
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  // +++ NEW: Handle Password Change Submit +++
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
       toast({ title: "Error", description: "New password must be at least 6 characters long.", variant: "destructive" });
       return;
    }

    setIsPasswordUpdating(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3001/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const responseText = await response.text(); // Get text response regardless of ok status

      if (!response.ok) {
         throw new Error(responseText || "Failed to change password.");
      }

      toast({ title: "Success!", description: responseText });
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsPasswordUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Card>
            <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) return null; // Should be handled by loading/redirect

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">My Profile</h1>

          {/* --- MODIFIED TABS --- */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" /> Profile Info
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="h-4 w-4 mr-2" /> Security
              </TabsTrigger>
            </TabsList>
            
            {/* --- Profile Info Tab --- */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" value={formData.username} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Input value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} disabled className="bg-gray-100" />
                    </div>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Security Tab (NOW WITH PASSWORD FORM) --- */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password here.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* +++ NEW Password Change Form +++ */}
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input 
                        id="currentPassword" 
                        name="currentPassword" 
                        type="password" 
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword" 
                        name="newPassword" 
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        required 
                      />
                    </div>
                    <Button type="submit" disabled={isPasswordUpdating}>
                      {isPasswordUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Change Password
                    </Button>
                  </form>
                  {/* +++ END New Form +++ */}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* --- REMOVED "My Listings" and "Favorites" Tabs --- */}

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;