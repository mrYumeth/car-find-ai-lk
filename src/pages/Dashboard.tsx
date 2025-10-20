import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, MessageCircle, Heart, Eye, Edit, Trash2, Plus, TrendingUp, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface VehicleListing {
  id: number;
  title: string;
  price: string;
  is_rentable: boolean;
  image: string | null;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("listings");
  const [myListings, setMyListings] = useState<VehicleListing[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchMyListings = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }
    try {
        const response = await fetch('http://localhost:3001/api/my-vehicles', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch listings");
        const data = await response.json();
        setMyListings(data);
    } catch (error) {
        console.error("Error fetching listings:", error);
    }
  };

  useEffect(() => {
    // Fetch listings initially and whenever the listings tab is active
    fetchMyListings();
  }, [navigate]); // Removed activeTab dependency to load listings on mount

  const handleDelete = async (vehicleId: number) => {
    if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
        return;
    }
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3001/api/vehicles/${vehicleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to delete listing.");
        toast({ title: "Success!", description: "Listing deleted successfully." });
        setMyListings(currentListings => currentListings.filter(listing => listing.id !== vehicleId));
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

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
              <Link to="/post-vehicle" state={{ isRentable: true }}><Button className="bg-green-600 hover:bg-green-700"><Key className="h-4 w-4 mr-2" />Rent My Car</Button></Link>
              <Link to="/post-vehicle" state={{ isRentable: false }}><Button className="bg-orange-500 hover:bg-orange-600"><Plus className="h-4 w-4 mr-2" />Post New Vehicle</Button></Link>
            </div>
          </div>

          {/* --- RESTORED STATS CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">{myListings.length}</div>
                <div className="text-gray-600">Active Listings</div>
              </CardContent>
            </Card>
             <Card>
               <CardContent className="p-6 text-center">
                 <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
                 <div className="text-2xl font-bold text-gray-800">434</div> {/* Placeholder */}
                 <div className="text-gray-600">Total Views</div>
               </CardContent>
             </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">5</div> {/* Placeholder */}
                <div className="text-gray-600">New Messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">15</div> {/* Placeholder */}
                <div className="text-gray-600">Favorites</div>
              </CardContent>
            </Card>
          </div>

          {/* --- ENSURED ALL TABS ARE PRESENT --- */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="listings">
              <Card>
                <CardHeader><CardTitle>My Vehicle Listings</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myListings.length > 0 ? myListings.map((listing) => (
                      <div key={listing.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <img
                          src={`http://localhost:3001${listing.image}` || "/placeholder.svg"}
                          alt={listing.title}
                          className="w-20 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{listing.title}</h3>
                            <Badge variant={listing.is_rentable ? "secondary" : "default"}>
                              {listing.is_rentable ? 'For Rent' : 'For Sale'}
                            </Badge>
                          </div>
                          <p className="text-blue-600 font-semibold mb-2">Rs. {Number(listing.price).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/edit-vehicle/${listing.id}`}>
                            <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(listing.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )) : (
                        <p className="text-center text-gray-500 py-8">You haven't posted any vehicles yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Placeholder Content for Other Tabs */}
            <TabsContent value="messages">
                <Card><CardHeader><CardTitle>Messages</CardTitle></CardHeader><CardContent><p>Messages content will go here.</p></CardContent></Card>
            </TabsContent>
            <TabsContent value="favorites">
                 <Card><CardHeader><CardTitle>Favorites</CardTitle></CardHeader><CardContent><p>Favorites content will go here.</p></CardContent></Card>
            </TabsContent>
            <TabsContent value="analytics">
                <Card><CardHeader><CardTitle>Analytics</CardTitle></CardHeader><CardContent><p>Analytics content will go here.</p></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;