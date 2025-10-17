import { useState } from "react";
import { User, Mail, Phone, MapPin, Camera, Lock, Heart, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const Profile = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form state
  const [formData, setFormData] = useState({
    fullName: "John Perera",
    email: "john.perera@example.com",
    phone: "+94 77 123 4567",
    location: "Colombo, Sri Lanka",
    userType: "Both Buyer & Seller"
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const myListings = [
    {
      id: 1,
      title: "Toyota Prius 2019",
      price: "4,500,000",
      status: "active",
      views: 245,
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Honda Vezel 2020",
      price: "6,200,000",
      status: "sold",
      views: 189,
      image: "/placeholder.svg"
    }
  ];

  const favorites = [
    {
      id: 1,
      title: "BMW X3 2021",
      price: "12,500,000",
      location: "Colombo",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Mercedes C-Class 2020",
      price: "9,800,000",
      location: "Kandy",
      image: "/placeholder.svg"
    }
  ];

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

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
                    <AvatarFallback className="text-2xl">JP</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{formData.fullName}</h1>
                  <p className="text-muted-foreground mb-3">{formData.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      {formData.userType}
                    </Badge>
                    <Badge variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      {formData.location}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2</div>
                    <div className="text-sm text-muted-foreground">Listings</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">5</div>
                    <div className="text-sm text-muted-foreground">Favorites</div>
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
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userType">Account Type</Label>
                      <select
                        id="userType"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.userType}
                        onChange={(e) => setFormData({...formData, userType: e.target.value})}
                      >
                        <option>Buyer</option>
                        <option>Seller</option>
                        <option>Both Buyer & Seller</option>
                      </select>
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    My Posted Vehicles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myListings.map((listing) => (
                      <div key={listing.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="w-20 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{listing.title}</h4>
                            <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                              {listing.status}
                            </Badge>
                          </div>
                          <p className="text-blue-600 font-semibold mb-1">Rs. {listing.price}</p>
                          <p className="text-sm text-muted-foreground">{listing.views} views</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Saved Vehicles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent">
                        <img
                          src={favorite.image}
                          alt={favorite.title}
                          className="w-20 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{favorite.title}</h4>
                          <p className="text-blue-600 font-semibold mb-1">Rs. {favorite.price}</p>
                          <p className="text-sm text-muted-foreground">{favorite.location}</p>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;