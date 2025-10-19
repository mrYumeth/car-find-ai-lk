import { useState } from "react";
import { Link } from "react-router-dom";
import { Car, MessageCircle, Heart, Eye, Edit, Trash2, Plus, TrendingUp, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("listings");

  const myListings = [
    {
      id: 1,
      title: "Toyota Prius 2019",
      price: "4,500,000",
      status: "active",
      views: 245,
      likes: 18,
      messages: 5,
      image: "/placeholder.svg",
      datePosted: "2024-01-15"
    },
    {
      id: 2,
      title: "Honda Vezel 2020",
      price: "6,200,000",
      status: "sold",
      views: 189,
      likes: 12,
      messages: 8,
      image: "/placeholder.svg",
      datePosted: "2024-01-10"
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

  const recentMessages = [
    {
      id: 1,
      vehicleTitle: "Toyota Prius 2019",
      senderName: "Saman Silva",
      lastMessage: "Is the vehicle still available?",
      timestamp: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      vehicleTitle: "Honda Vezel 2020",
      senderName: "Priya Fernando",
      lastMessage: "Can we arrange a viewing?",
      timestamp: "1 day ago",
      unread: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">My Dashboard</h1>
              <p className="text-gray-600">Manage your listings and account</p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link to="/post-vehicle">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Key className="h-4 w-4 mr-2" />
                  Rent My Car
                </Button>
              </Link>
              <Link to="/post-vehicle">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Vehicle
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">2</div>
                <div className="text-gray-600">Active Listings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">434</div>
                <div className="text-gray-600">Total Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">13</div>
                <div className="text-gray-600">Messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">30</div>
                <div className="text-gray-600">Favorites</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Vehicle Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myListings.map((listing) => (
                      <div key={listing.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="w-20 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{listing.title}</h3>
                            <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                              {listing.status}
                            </Badge>
                          </div>
                          <p className="text-blue-600 font-semibold mb-2">Rs. {listing.price}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {listing.views} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {listing.likes} likes
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {listing.messages} messages
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMessages.map((message) => (
                      <div key={message.id} className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${message.unread ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{message.senderName}</h4>
                          <span className="text-sm text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Re: {message.vehicleTitle}</p>
                        <p className="text-gray-800">{message.lastMessage}</p>
                        {message.unread && (
                          <Badge className="mt-2" variant="secondary">New</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <img
                          src={favorite.image}
                          alt={favorite.title}
                          className="w-20 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{favorite.title}</h3>
                          <p className="text-blue-600 font-semibold mb-1">Rs. {favorite.price}</p>
                          <p className="text-sm text-gray-600">{favorite.location}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4">Views Over Time</h4>
                      <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Chart will be displayed here</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Top Performing Listings</h4>
                      <div className="space-y-3">
                        {myListings.map((listing) => (
                          <div key={listing.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="font-medium">{listing.title}</span>
                            <span className="text-blue-600">{listing.views} views</span>
                          </div>
                        ))}
                      </div>
                    </div>
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

export default Dashboard;