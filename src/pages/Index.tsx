import { useState, useEffect } from "react";
import { Car, Search, SlidersHorizontal, MessageCircle, Phone } from "lucide-react"; // Correct icons imported
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import VehicleCard from "@/components/VehicleCard"; // Import the component
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// ++ Ensure this interface EXACTLY matches the 'vehicle' prop structure in VehicleCardProps ++
interface Vehicle {
  id: number;
  title: string;
  price: string;
  location: string;
  mileage: string;
  fuel: string; // Renamed from fuel_type if VehicleCard expects 'fuel'
  image: string;
  seller_name: string;
  seller_id: number;
  seller_phone: string;
  seller_email: string;
  rating: number;
  is_rentable: boolean;
  make: string;
}

// Interface for extracted entities (for logging)
interface ExtractedEntities {
    make: string | null;
    model: string | null;
    location: string | null;
    year: number | null;
    min_price: number | null;
    max_price: number | null;
    fuel_type: string | null;
}


const Index = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [searchResults, setSearchResults] = useState<Vehicle[] | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const { toast } = useToast();

    // State for recommendations
    const [recommendations, setRecommendations] = useState<Vehicle[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(false);


    // Helper to format fetched data (ensure all fields exist)
    const formatVehicleData = (vehicleData: any[]): Vehicle[] => {
        return vehicleData.map(v => ({
            id: v.id || 0,
            title: v.title || 'N/A',
            price: v.price || 'N/A',
            location: v.location || 'N/A',
            mileage: v.mileage || 'N/A',
            fuel: v.fuel || v.fuel_type || 'N/A', // Map fuel_type if necessary
            image: v.image || '/placeholder.svg',
            seller_name: v.seller_name || 'N/A',
            seller_id: v.seller_id || 0,
            seller_phone: v.seller_phone || 'N/A',
            seller_email: v.seller_email || 'N/A',
            rating: v.rating || 0,
            is_rentable: v.is_rentable || false,
            make: v.make || 'N/A',
        }));
    };

    const fetchAllVehicles = async () => {
        setLoading(true);
        setSearchPerformed(false);
        setSearchResults(null);
        try {
            const response = await fetch('http://localhost:3001/api/vehicles');
            if (!response.ok) throw new Error('Failed to fetch vehicles');
            const data = await response.json();
            setVehicles(formatVehicleData(data)); // Use formatter
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            toast({ title: "Error", description: "Could not load vehicle listings.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch recommendations
    const fetchRecommendations = async (token: string) => {
        setLoadingRecs(true);
        try {
            const response = await fetch('http://localhost:3001/api/recommendations?num=4', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 console.error("Failed to fetch recommendations, status:", response.status);
                 setRecommendations([]);
                 return;
            }
            const data = await response.json();
            setRecommendations(formatVehicleData(data)); // Use formatter
        } catch (error) {
            console.error("Error fetching recommendations:", error);
             setRecommendations([]);
        } finally {
            setLoadingRecs(false);
        }
    };


    useEffect(() => {
        const token = localStorage.getItem('token');
        const loggedIn = !!token;
        setIsLoggedIn(loggedIn);
        fetchAllVehicles();

        if (loggedIn) {
            fetchRecommendations(token);
        }
    }, []);

    // Function to log search
    const logSearch = async (query: string, entities: ExtractedEntities | null) => {
        const token = localStorage.getItem('token');
        if (!token || !query) return;
        try {
             await fetch('http://localhost:3001/api/interactions/log', { /* ... logging fetch options ... */ });
             console.log(`Logged search: "${query}"`);
        } catch (error) { console.error("Failed to log search:", error); }
    };


    const handleSearch = async () => {
        if (!searchTerm.trim()) { fetchAllVehicles(); return; }
        setLoading(true); setSearchPerformed(true); setSearchResults(null);

        // Fetch Entities & Log Search
        let entitiesForLogging: ExtractedEntities | null = null;
        try {
            const entityResponse = await fetch(`http://localhost:5000/parse?query=${encodeURIComponent(searchTerm)}`);
            if (entityResponse.ok) { entitiesForLogging = await entityResponse.json(); }
        } catch (entityError) { console.error("Could not fetch entities for logging:", entityError); }
        await logSearch(searchTerm, entitiesForLogging);

        // Call Search Endpoint
        try {
            const response = await fetch(`http://localhost:3001/api/search/nlp?q=${encodeURIComponent(searchTerm)}`);
            let data = [];
            if (!response.ok) {
                 try { data = await response.json(); } catch (e) {}
                console.error("NLP search failed, status:", response.status);
                toast({ title: "Search Failed", description: "Using basic keyword search.", variant: "destructive" });
            } else {
                 data = await response.json();
                 if (data.length === 0) { toast({ title: "No Results", description: `No vehicles found matching "${searchTerm}".`, variant: "default" }); }
            }
            setSearchResults(formatVehicleData(data)); // Use formatter
        } catch (error) {
            console.error("Error calling NLP search API:", error);
            toast({ title: "Search Error", description: "An error occurred while searching.", variant: "destructive" });
            setSearchResults([]);
        } finally { setLoading(false); }
    };

   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { handleSearch(); } };

    // Determine lists to display
    const displayList = searchPerformed && searchResults !== null ? searchResults : vehicles;
    const vehiclesForSale = displayList.filter(v => !v.is_rentable);
    const vehiclesForRent = displayList.filter(v => v.is_rentable);

    // --- RENDER FUNCTION for lists ---
    const renderVehicleList = (list: Vehicle[], title: string, subtitle: string, isRent: boolean, listKeyPrefix: string, isLoading: boolean) => {
        const emptyMessage = searchPerformed && searchResults !== null
            ? `No ${isRent ? 'rentals' : 'vehicles for sale'} found matching your search.`
            : `No ${isRent ? 'rentals' : 'vehicles for sale'} currently available.`;

        return (
            <div className="mb-16">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
                    <p className="text-gray-600">{subtitle}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {isLoading ? (
                        Array(4).fill(0).map((_, index) => ( /* Skeleton rendering */
                             <Card key={`${listKeyPrefix}-skel-${index}`} className="overflow-hidden">
                                <Skeleton className="w-full h-48" />
                                <CardContent className="p-4 space-y-2">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))
                    ) : list.length > 0 ? (
                        // No explicit type needed here if 'list' is correctly typed as Vehicle[]
                        list.map((vehicle) => (
                            <VehicleCard
                                key={`${listKeyPrefix}-${vehicle.id}`}
                                vehicle={vehicle} // Pass the vehicle object
                                isLoggedIn={isLoggedIn}
                            />
                        ))
                    ) : ( /* Empty list rendering */
                         <div className="lg:col-span-4 text-center py-20">
                            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-600">{emptyMessage}</p>
                            {searchPerformed && searchResults !== null && (
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
                {/* ... Hero content ... */}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative container mx-auto px-4 py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-6 animate-fade-in">Find Your Perfect Vehicle in Sri Lanka</h1>
                        <p className="text-xl mb-8 opacity-90">Buy, Sell, and Rent vehicles with confidence on CarNeeds.lk</p>
                        {/* Search Bar */}
                        <Card className="bg-white p-6 shadow-2xl max-w-2xl mx-auto">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input placeholder="Search with keywords or phrases (e.g., 'Toyota hybrid under 5M')" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="pl-10 h-12 text-gray-800" />
                                </div>
                                <Button onClick={handleSearch} className="h-12 px-8 bg-orange-500 hover:bg-orange-600">Search</Button>
                                <Button variant="outline" className="h-12 px-4 bg-white text-gray-700 hover:bg-gray-100"><SlidersHorizontal className="h-5 w-5" /></Button>
                            </div>
                            {/* Filters */}
                            <div className="flex gap-4 mt-4 text-sm">
                                <select className="flex-1 h-10 px-3 rounded border border-gray-300 text-gray-700"><option>All Categories</option></select>
                                <select className="flex-1 h-10 px-3 rounded border border-gray-300 text-gray-700"><option>All Locations</option></select>
                                <select className="flex-1 h-10 px-3 rounded border border-gray-300 text-gray-700"><option>Price Range</option></select>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Stats Cards... */}
                     <Card className="text-center p-6 hover:shadow-lg transition-shadow"><CardContent><div className="text-3xl font-bold text-blue-600 mb-2">15,000+</div><div className="text-gray-600">Active Listings</div></CardContent></Card>
                     <Card className="text-center p-6 hover:shadow-lg transition-shadow"><CardContent><div className="text-3xl font-bold text-orange-600 mb-2">50,000+</div><div className="text-gray-600">Happy Customers</div></CardContent></Card>
                     <Card className="text-center p-6 hover:shadow-lg transition-shadow"><CardContent><div className="text-3xl font-bold text-green-600 mb-2">2,500+</div><div className="text-gray-600">Verified Dealers</div></CardContent></Card>
                     <Card className="text-center p-6 hover:shadow-lg transition-shadow"><CardContent><div className="text-3xl font-bold text-purple-600 mb-2">24/7</div><div className="text-gray-600">Customer Support</div></CardContent></Card>
                </div>
            </div>

            {/* Dynamic Vehicle Listings */}
            <div className="container mx-auto px-4 py-12">
                 {/* RECOMMENDATIONS SECTION */}
                 {isLoggedIn && (loadingRecs || recommendations.length > 0) && (
                    renderVehicleList(recommendations, "Recommended For You", "Vehicles you might be interested in.", false, "rec", loadingRecs)
                 )}
                {/* Render Sales Listings */}
                {renderVehicleList(vehiclesForSale, "Vehicles For Sale", "Buy the perfect car from our wide selection.", false, "sale", loading)}
                {/* Render Rental Listings */}
                {renderVehicleList(vehiclesForRent, "Vehicles For Rent", "Find short-term rentals for your travel needs.", true, "rent", loading)}
                {/* View All / Clear Search Button */}
                <div className="text-center mt-12">
                   {searchPerformed && searchResults !== null ? ( <Button onClick={fetchAllVehicles} variant="outline" className="px-8 py-3 text-lg">Clear Search Results</Button> ) : ( <Button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-lg">View All Listings</Button> )}
                </div>
            </div>

            {/* How It Works */}
             <div className="bg-gray-50 py-20">
                 {/* ... How It Works content ... */}
                 <div className="container mx-auto px-4">
                     {/* ... Title ... */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Search className="h-10 w-10 text-blue-600" /></div>
                            <h3 className="text-2xl font-semibold mb-4">1. Search & Browse</h3>
                            <p className="text-gray-600">Find vehicles using our smart search or browse listings</p>
                        </div>
                        {/* Step 2 */}
                         <div className="text-center">
                            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><MessageCircle className="h-10 w-10 text-orange-600" /></div>
                            <h3 className="text-2xl font-semibold mb-4">2. Connect & Chat</h3>
                            <p className="text-gray-600">Contact sellers directly through our secure messaging system</p>
                        </div>
                        {/* Step 3 */}
                         <div className="text-center">
                            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Car className="h-10 w-10 text-green-600" /></div>
                            <h3 className="text-2xl font-semibold mb-4">3. Complete Deal</h3>
                            <p className="text-gray-600">Inspect, negotiate, and complete your vehicle transaction safely</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Call to Action */}
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
                        <Button onClick={() => window.scrollTo(0, 0)} className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-orange-600 text-lg font-semibold">
                            Browse Vehicles
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                            </ul>
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/about" className="hover:text-white">Contact Us</Link></li>
                                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
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