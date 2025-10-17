import { useState } from "react";
import { Users, Car, Flag, CheckCircle, XCircle, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    {
      id: 1,
      name: "Saman Silva",
      email: "saman@example.com",
      phone: "+94 77 123 4567",
      status: "active",
      listingsCount: 5,
      joinedDate: "2024-01-15",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Priya Fernando",
      email: "priya@example.com",
      phone: "+94 71 234 5678",
      status: "blocked",
      listingsCount: 2,
      joinedDate: "2024-01-10",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Kamal Perera",
      email: "kamal@example.com",
      phone: "+94 76 345 6789",
      status: "active",
      listingsCount: 8,
      joinedDate: "2024-01-05",
      avatar: "/placeholder.svg"
    }
  ];

  const listings = [
    {
      id: 1,
      title: "Toyota Prius 2019",
      seller: "Saman Silva",
      price: "4,500,000",
      status: "pending",
      postedDate: "2024-01-20",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Honda Vezel 2020",
      seller: "Priya Fernando",
      price: "6,200,000",
      status: "approved",
      postedDate: "2024-01-18",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      title: "BMW X3 2021",
      seller: "Kamal Perera",
      price: "12,500,000",
      status: "flagged",
      postedDate: "2024-01-15",
      image: "/placeholder.svg"
    }
  ];

  const reports = [
    {
      id: 1,
      listingTitle: "Toyota Prius 2019",
      reportedBy: "John Doe",
      reason: "Misleading Information",
      description: "The mileage shown doesn't match the actual vehicle condition",
      status: "pending",
      reportDate: "2024-01-22"
    },
    {
      id: 2,
      listingTitle: "Honda Vezel 2020",
      reportedBy: "Jane Smith",
      reason: "Fraudulent Listing",
      description: "Seller is not responding and seems suspicious",
      status: "reviewed",
      reportDate: "2024-01-21"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, listings, and reports</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">1,245</div>
                <div className="text-muted-foreground">Total Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Car className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">856</div>
                <div className="text-muted-foreground">Active Listings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Flag className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">12</div>
                <div className="text-muted-foreground">Pending Reports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">95%</div>
                <div className="text-muted-foreground">Approval Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Management</CardTitle>
                    <div className="w-64">
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{user.name}</h4>
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                              {user.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{user.listingsCount} listings</p>
                          <p className="text-xs text-muted-foreground">Joined {user.joinedDate}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={user.status === 'active' ? 'destructive' : 'default'}
                            size="sm"
                          >
                            {user.status === 'active' ? 'Block' : 'Unblock'}
                          </Button>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Listing Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="w-20 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{listing.title}</h4>
                            <Badge
                              variant={
                                listing.status === 'approved' ? 'default' :
                                listing.status === 'pending' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {listing.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-blue-600">Rs. {listing.price}</p>
                          <p className="text-sm text-muted-foreground">Seller: {listing.seller}</p>
                          <p className="text-xs text-muted-foreground">Posted: {listing.postedDate}</p>
                        </div>
                        <div className="flex gap-2">
                          {listing.status === 'pending' && (
                            <>
                              <Button variant="default" size="sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button variant="destructive" size="sm">
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {listing.status === 'flagged' && (
                            <Button variant="destructive" size="sm">
                              Remove
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reported Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg hover:bg-accent">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{report.listingTitle}</h4>
                              <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                                {report.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Reported by: {report.reportedBy} on {report.reportDate}
                            </p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-orange-600 mb-1">
                            Reason: {report.reason}
                          </p>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm">
                            Review Listing
                          </Button>
                          <Button variant="destructive" size="sm">
                            Remove Listing
                          </Button>
                          <Button variant="outline" size="sm">
                            Dismiss Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;