// src/pages/Index.tsx

import { useState, useEffect } from "react";
// ++ Import useToast
import { Car, Search, Star, MapPin, Phone, MessageCircle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import VehicleCard from "@/components/VehicleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
// ++ Import useToast hook
import { useToast } from "@/hooks/use-toast";


// Interface remains the same
interface Vehicle {
  id: number;
  title: string;
  price: string;
  location: string;
  mileage: string;
  fuel: string;
  image: string;
  seller_name: string;
  seller_id: number;
  seller_phone: string;
  seller_email: string;
  rating: number;
  is_rentable: boolean;
  make: string;
}

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // ++ State for NLP search results
  const [searchResults, setSearchResults] = useState<Vehicle[] | null>(null);
  // ++ State to track if a search has been performed
  const [searchPerformed, setSearchPerformed] = useState(false);
  // ++ Toast hook
  const { toast } = useToast();

  // ++ Renamed original fetch function
  const fetchAllVehicles = async () => {
    setLoading(true);
    setSearchPerformed(false); // Reset search state
    setSearchResults(null);   // Clear previous search results
    try {
      const response = await fetch('http://localhost:3001/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const data: Vehicle[] = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
       toast({ title: "Error", description: "Could not load vehicle listings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchAllVehicles(); // Fetch all vehicles on initial load
  }, []); // Removed toast from dependency array


  // ++ MODIFIED: Filter logic - now uses searchResults if available
  const displayList = searchPerformed && searchResults !== null ? searchResults : vehicles;

  // Filter vehicles based on the displayList
  const vehiclesForSale = displayList.filter(v => !v.is_rentable);
  const vehiclesForRent = displayList.filter(v => v.is_rentable);


  // ++ NEW: Search Handler using NLP endpoint
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
       // If search term is empty, reset to show all vehicles
       fetchAllVehicles(); // Fetch all again
       return;
    }

    setLoading(true);
    setSearchPerformed(true); // Mark that a search was attempted
    setSearchResults(null);   // Clear previous results while loading

    try {
        // --- Call the NEW NLP Endpoint ---
        const response = await fetch(`http://localhost:3001/api/search/nlp?q=${encodeURIComponent(searchTerm)}`);

        if (!response.ok) {
            // Handle error - display message from backend or generic one
            const errorText = await response.text();
            console.error("NLP search failed, status:", response.status, "Error:", errorText);
            toast({ title: "Search Failed", description: errorText || "Could not perform smart search.", variant: "destructive" });
             setSearchResults([]); // Show "No results" state

        } else {
             const data: Vehicle[] = await response.json();
             setSearchResults(data); // Update state with results from NLP search
             if (data.length === 0) {
                 toast({ title: "No Results", description: `No vehicles found matching "${searchTerm}".`, variant: "default" });
             }
        }

    } catch (error) {
        console.error("Error calling NLP search API:", error);
         toast({ title: "Search Error", description: "An error occurred while searching. Please try again.", variant: "destructive" });
         setSearchResults([]); // Show "No results" state
    } finally {
        setLoading(false);
    }
  };

   // ++ Add handler for Enter key press on input
   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  // renderVehicleList helper function remains mostly the same, but uses the list argument
  const renderVehicleList = (list: Vehicle[], title: string, subtitle: string, isRent: boolean) => {
    // Determine the message based on whether a search was performed
    const emptyMessage = searchPerformed
        ? `No ${isRent ? 'rentals' : 'vehicles for sale'} found matching your search.`
        : `No ${isRent ? 'rentals' : 'vehicles for sale'} currently available.`;

    return (
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array(4).fill(0).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : list.length > 0 ? (
            list.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isLoggedIn={isLoggedIn}
              />
            ))
          ) : (
            <div className="lg:col-span-4 text-center py-20">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">{emptyMessage}</p>
              {/* Optionally add a button to clear search */}
              {searchPerformed && (
                  <Button variant="link" onClick={fetchAllVehicles} className="mt-4">Clear search and view all</Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        {/* ... (rest of the Hero Section remains the same) ... */}
         <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Find Your Perfect Vehicle in Sri Lanka
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Buy, Sell, and Rent vehicles with confidence on CarNeeds.lk
            </p>

            {/* Search Bar */}
            <Card className="bg-white p-6 shadow-2xl max-w-2xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search with keywords or phrases (e.g., 'Toyota hybrid under 5M')" // Updated placeholder
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    // ++ Add onKeyPress handler
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-12 text-gray-800"
                  />
                </div>
                {/* ++ Update Button onClick */}
                <Button onClick={handleSearch} className="h-12 px-8 bg-orange-500 hover:bg-orange-600">
                  Search
                </Button>
                 <Button variant="outline" className="h-12 px-4 bg-white text-gray-700 hover:bg-gray-100">
                    <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </div>

             {/* ... (rest of the filters remain the same) ... */}
             <div className="flex gap-4 mt-4 text-sm">
                <select className="flex-1 h-10 px-3 rounded border border-gray-300 text-gray-700">
                  <option>All Categories</option>
                  <option>Cars</option>
                  <option>SUV</option>
                  <option>Van</option>
                  <option>Motorcycle</option>
                </select>
                <select className="flex-1 h-10 px-3 rounded border border-gray-300 text-gray-700">
                  <option>All Locations</option>
                  <option>Colombo</option>
                  <option>Kandy</option>
                  <option>Galle</option>
                  <option>Negombo</option>
                </select>
                <select className="flex-1 h-10 px-3 rounded border border-gray-300 text-gray-700">
                  <option>Price Range</option>
                  <option>Under 2M</option>
                  <option>2M - 5M</option>
                  <option>5M - 10M</option>
                  <option>Over 10M</option>
                </select>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {/* ... (Quick Stats section remains the same) ... */}
       <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">15,000+</div>
              <div className="text-gray-600">Active Listings</div>
            </CardContent>
          </Card>
          {/* ... other stats cards ... */}
           <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">50,000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">2,500+</div>
              <div className="text-gray-600">Verified Dealers</div>
            </CardContent>
          </Card>
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* --- Dynamic Vehicle Listings --- */}
      <div className="container mx-auto px-4 py-12">

         {/* Render Sales Listings */}
         {/* ++ Pass the potentially filtered list */}
         {renderVehicleList(
            vehiclesForSale,
            "Vehicles For Sale",
            "Buy the perfect car from our wide selection.",
            false
        )}

        {/* Render Rental Listings */}
        {/* ++ Pass the potentially filtered list */}
        {renderVehicleList(
            vehiclesForRent,
            "Vehicles For Rent",
            "Find short-term rentals for your travel needs.",
            true
        )}


        {/* ++ Conditionally show "View All" or "Clear Search" */}
        <div className="text-center mt-12">
           {!searchPerformed || searchResults === null ? (
               <Button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-lg">
                    View All Listings {/* This might link to a dedicated search results page in the future */}
               </Button>
           ) : (
                <Button onClick={fetchAllVehicles} variant="outline" className="px-8 py-3 text-lg">
                    Clear Search Results
                </Button>
           )}
        </div>

      </div>

      {/* How It Works */}
      {/* ... (How It Works section remains the same) ... */}
       <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How CarNeeds.lk Works</h2>
            <p className="text-gray-600 text-lg">Simple steps to buy or sell your vehicle</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* ... steps ... */}
             <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">1. Search & Browse</h3>
              <p className="text-gray-600">Find vehicles that match your needs using our advanced search filters</p>
            </div>
             <div className="text-center">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">2. Connect & Chat</h3>
              <p className="text-gray-600">Contact sellers directly through our secure messaging system</p>
            </div>
             <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">3. Complete Deal</h3>
              <p className="text-gray-600">Inspect, negotiate, and complete your vehicle transaction safely</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {/* ... (Call to Action section remains the same) ... */}
       <div className="bg-gradient-to-r from-orange-500 to-orange-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of satisfied customers on CarNeeds.lk</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/post-vehicle">
                <Button className="px-8 py-3 bg-white text-orange-600 hover:bg-gray-100 text-lg font-semibold">
                Post Your Vehicle
                </Button>
            </Link>
            <Button onClick={() => window.scrollTo(0, 0)} /* Scrolls to top to see results */ className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-orange-600 text-lg font-semibold">
              Browse Vehicles
            </Button>
          </div>
        </div>
      </div>


      {/* Footer */}
      {/* ... (Footer remains the same) ... */}
       <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             {/* ... footer content ... */}
             <div>
              <div className="flex items-center gap-2 mb-6">
                <Car className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold">CarNeeds.lk</span>
              </div>
              <p className="text-gray-400 mb-4">Sri Lanka's premier vehicle marketplace</p>
              <div className="flex gap-4">
                <Phone className="h-5 w-5" />
                <span>+94 11 234 5678</span>
              </div>
            </div>
             <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">Buy Vehicles</Link></li>
                <li><Link to="/post-vehicle" className="hover:text-white">Sell Vehicles</Link></li>
                <li><Link to="/" className="hover:text-white">Rent Vehicles</Link></li>
                {/* <li><a href="#" className="hover:text-white">Vehicle Loans</a></li> */}
              </ul>
            </div>
             <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                {/* <li><a href="#" className="hover:text-white">Help Center</a></li> */}
                <li><Link to="/about" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                {/* <li><a href="#" className="hover:text-white">Terms of Service</a></li> */}
                {/* <li><a href="#" className="hover:text-white">Privacy Policy</a></li> */}
              </ul>
            </div>
             <div>
              <h3 className="text-lg font-semibold mb-4">Locations</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Colombo</li>
                <li>Kandy</li>
                <li>Galle</li>
                <li>Negombo</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CarNeeds.lk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;