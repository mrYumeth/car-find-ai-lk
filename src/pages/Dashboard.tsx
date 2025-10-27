import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, MessageCircle, Heart, Eye, Edit, Trash2, Plus, TrendingUp, Key, Clock, DollarSign} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  status: 'pending' | 'approved' | 'rejected'; // Add this
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("listings");
  const [myListings, setMyListings] = useState<VehicleListing[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // +++ NEW State for Tabs +++
  const [mainActiveTab, setMainActiveTab] = useState("myListings"); // 'myListings' or 'submitted'
  const [myListingsSubTab, setMyListingsSubTab] = useState("sale"); // 'sale' or 'rent'
  const [submittedSubTab, setSubmittedSubTab] = useState("sale"); // 'sale' or 'rent'
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0); // Unread message count
  const [totalValue, setTotalValue] = useState<number>(0);   // For total value 

  const fetchMyListings = async (token: string) => { // Accept token as argument
    try {
        const response = await fetch('http://localhost:3001/api/my-vehicles', {
            headers: { 'Authorization': `Bearer ${token}` } // Use token
        });
        if (!response.ok) throw new Error("Failed to fetch listings");
        const data = await response.json();
        setMyListings(data);
    } catch (error) {
        console.error("Error fetching listings:", error);
        // Avoid navigating away on fetch error, just show toast
        toast({ title: "Error", description: "Could not load your listings.", variant: "destructive" });
    }
  };

  // +++ NEW Function to fetch unread count +++
  const fetchUnreadCount = async (token: string) => {
      try {
          const response = await fetch('http://localhost:3001/api/chats/unread-count', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error("Failed to fetch unread message count");
          const data = await response.json();
          setUnreadMessageCount(data.unreadCount || 0);
      } catch (error) {
          console.error("Error fetching unread count:", error);
          // Optional: Show a toast if fetching count fails, but don't block UI
          // toast({ title: "Info", description: "Could not fetch unread message count.", variant: "default" });
      }
  };

  // +++ NEW Function to fetch total value +++
  const fetchTotalValue = async (token: string) => {
      try {
          const response = await fetch('http://localhost:3001/api/seller/stats/active-value', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error("Failed to fetch total value");
          const data = await response.json();
          setTotalValue(data.totalValue || 0);
      } catch (error) {
          console.error("Error fetching total value:", error);
          // Optional: Show a toast if fetching value fails
          // toast({ title: "Info", description: "Could not fetch total listing value.", variant: "default" });
      }
  };

  // --- Add filtering logic ---
  const activeListings = myListings.filter(l => l.status === 'approved'); // <<< ADD THIS LINE
  const approvedOrRejectedListings = myListings.filter(l => l.status === 'approved' || l.status === 'rejected');
  const pendingListings = myListings.filter(l => l.status === 'pending');

  const approvedSale = approvedOrRejectedListings.filter(l => !l.is_rentable);
  const approvedRent = approvedOrRejectedListings.filter(l => l.is_rentable);
  const pendingSale = pendingListings.filter(l => !l.is_rentable);
  const pendingRent = pendingListings.filter(l => l.is_rentable);

useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }
    // Fetch both listings and unread count on mount
    fetchMyListings(token);
    fetchUnreadCount(token); // Fetch count
    fetchTotalValue(token); // Total Value
  }, [navigate]); // Only run on mount or if navigate changes

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

  // --- Create a reusable render function for listing cards ---
  const renderListingCards = (listings: VehicleListing[]) => {
    if (listings.length === 0) {
      return <p className="text-center text-gray-500 py-8">No vehicles in this category.</p>;
    }
    return listings.map((listing) => (
       <div key={listing.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
         <img
           src={`http://localhost:3001${listing.image}` || "/placeholder.svg"}
           alt={listing.title}
           className="w-20 h-16 object-cover rounded"
         />
         <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             <h3 className="text-lg font-semibold">{listing.title}</h3>
             <Badge
               variant={
                 listing.status === 'approved' ? 'default' :
                 listing.status === 'pending' ? 'secondary' :
                 'destructive'
               }
               className={
                 listing.status === 'approved' ? 'bg-green-600' : ''
               }
             >
               {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
             </Badge>
           </div>
           <Badge variant={listing.is_rentable ? "secondary" : "default"} className="mb-2">
             {listing.is_rentable ? 'For Rent' : 'For Sale'}
           </Badge>
           <p className="text-blue-600 font-semibold mb-2">Rs. {Number(listing.price).toLocaleString()}</p>
         </div>
         <div className="flex gap-2">
            {/* Only show Edit button for approved/pending listings */}
            {(listing.status === 'approved' || listing.status === 'pending') && (
                <Link to={`/edit-vehicle/${listing.id}`}>
                    <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                </Link>
            )}
           <Button variant="outline" size="sm" onClick={() => handleDelete(listing.id)}>
             <Trash2 className="h-4 w-4 text-red-500" />
           </Button>
         </div>
       </div>
    ));
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

          {/* --- UPDATED STATS CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                {/* ++ Use activeListings count ++ */}
                <div className="text-2xl font-bold text-gray-800">{activeListings.length}</div>
                <div className="text-gray-600">Active Listings</div>
              </CardContent>
            </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              Rs. {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} {/* Format as currency with no decimals */}
            </div>
            <div className="text-gray-600">Value (Approved Sale)</div> {/* Updated label */}
          </CardContent>
        </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                {/* ++ Use unreadMessageCount state ++ */}
                <div className="text-2xl font-bold text-gray-800">{unreadMessageCount}</div>
                <div className="text-gray-600">New Messages</div>
              </CardContent>
            </Card>
              {/* +++ NEW Pending Listings Card +++ */}
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{pendingListings.length}</div>
                  <div className="text-gray-600">Pending Approval</div>
                </CardContent>
              </Card>
          </div>

          {/* +++ NEW NESTED TABS STRUCTURE +++ */}
          <Tabs value={mainActiveTab} onValueChange={setMainActiveTab} className="w-full">
            {/* Main Tabs List */}
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="myListings">My Listings ({approvedOrRejectedListings.length})</TabsTrigger>
              <TabsTrigger value="submitted">Submitted for Approval ({pendingListings.length})</TabsTrigger>
            </TabsList>

            {/* Main Tab Content: My Listings (Approved/Rejected) */}
            <TabsContent value="myListings">
              <Card>
                <CardContent className="p-0"> {/* Remove padding from outer CardContent */}
                  <Tabs value={myListingsSubTab} onValueChange={setMyListingsSubTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                      <TabsTrigger value="sale">For Sale ({approvedSale.length})</TabsTrigger>
                      <TabsTrigger value="rent">For Rent ({approvedRent.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sale" className="p-4 space-y-4"> {/* Add padding and spacing here */}
                      {renderListingCards(approvedSale)}
                    </TabsContent>
                    <TabsContent value="rent" className="p-4 space-y-4"> {/* Add padding and spacing here */}
                      {renderListingCards(approvedRent)}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Main Tab Content: Submitted for Approval (Pending) */}
            <TabsContent value="submitted">
              <Card>
                <CardContent className="p-0"> {/* Remove padding */}
                  <Tabs value={submittedSubTab} onValueChange={setSubmittedSubTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                      <TabsTrigger value="sale">For Sale ({pendingSale.length})</TabsTrigger>
                      <TabsTrigger value="rent">For Rent ({pendingRent.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sale" className="p-4 space-y-4"> {/* Add padding */}
                      {renderListingCards(pendingSale)}
                    </TabsContent>
                    <TabsContent value="rent" className="p-4 space-y-4"> {/* Add padding */}
                      {renderListingCards(pendingRent)}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          {/* +++ END NEW NESTED TABS STRUCTURE +++ */}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;