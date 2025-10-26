// src/pages/AllListings.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import VehicleCard from "@/components/VehicleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Import Select components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// **MODIFIED**: Vehicle Interface
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
  model: string; // <<< Added model
  year: number | null; // <<< Added year (can be null)
}

// Interface for extracted entities (no change)
interface ExtractedEntities {
    make: string | null;
    model: string | null;
    location: string | null;
    year: number | null;
    min_price: number | null;
    max_price: number | null;
    fuel_type: string | null;
}

// Define the list of makes (same as PostVehicle.tsx)
const vehicleMakes = [
  "Toyota", "Honda", "Suzuki", "Nissan", "Mitsubishi", "Kia", "Hyundai",
  "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Ford", "Chevrolet",
  "Mazda", "Subaru", "Tata", "Mahindra", "Perodua", "Proton", "Other"
];


const ITEMS_PER_PAGE = 12;

const AllListings = () => {
  const [allListings, _setAllListings] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPageSale, setCurrentPageSale] = useState(1);
  const [currentPageRent, setCurrentPageRent] = useState(1);
  const [activeTab, setActiveTab] = useState("forSale");
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchResults, setSearchResults] = useState<Vehicle[] | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");

  // **MODIFIED**: Helper to format data
  const formatVehicleData = (vehicleData: any[]): Vehicle[] => {
    return vehicleData.map(v => ({
            id: v.id || 0,
            title: v.title || 'N/A',
            price: v.price || 'N/A', // Assuming backend formats price now
            location: v.location || 'N/A',
            mileage: v.mileage || 'N/A', // Assuming backend formats mileage
            fuel: v.fuel || v.fuel_type || 'N/A',
            image: v.image || '/placeholder.svg', // Assuming backend sends full URL or path
            seller_name: v.seller_name || 'N/A',
            seller_id: v.seller_id || 0,
            seller_phone: v.seller_phone || 'N/A',
            seller_email: v.seller_email || 'N/A',
            rating: v.rating || 0,
            is_rentable: v.is_rentable || false,
            make: v.make || 'N/A',
            model: v.model || 'N/A',   // <<< Added model mapping
            year: v.year || null,     // <<< Added year mapping
        }));
  };

  // Fetch all vehicles function (no change)
  const fetchAllVehicles = async () => {
    setLoading(true);
    setSearchPerformed(false);
    setSearchResults(null);
    setSearchTerm("");
    setSelectedMake("");
    setModelFilter("");
    try {
      const response = await fetch('http://localhost:3001/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const data = await response.json();
      const formattedData = formatVehicleData(data); // Use updated formatter
      _setAllListings(formattedData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast({ title: "Error", description: "Could not load listings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount (no change)
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchAllVehicles();
  }, [toast]);

  // Log search interactions (no change)
  const logSearch = async (query: string, entities: ExtractedEntities | null) => {
    // ... logSearch logic ...
        const token = localStorage.getItem('token');
    if (!token || !query) return;
    try {
      await fetch('http://localhost:3001/api/interactions/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'search',
                queryText: query,
                extractedEntities: entities
            })
        });
        console.log(`Logged search: "${query}"`);
    } catch (error) {
        console.error("Failed to log search:", error);
    }
  };

  // Handle NLP search submission (no change)
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
        fetchAllVehicles();
        return;
    }
    setLoading(true);
    setSearchPerformed(true);
    setSearchResults(null);
    setSelectedMake("");
    setModelFilter("");

    // ... rest of NLP search logic ...
        let entitiesForLogging: ExtractedEntities | null = null;
    try {
        const entityResponse = await fetch(`http://localhost:5000/parse?query=${encodeURIComponent(searchTerm)}`);
        if (entityResponse.ok) {
            entitiesForLogging = await entityResponse.json();
        }
    } catch (entityError) {
        console.error("Could not fetch entities for logging:", entityError);
    }
    await logSearch(searchTerm, entitiesForLogging);

    try {
        const response = await fetch(`http://localhost:3001/api/search/nlp?q=${encodeURIComponent(searchTerm)}`);
        let data = [];
        if (!response.ok) {
            try { data = await response.json(); } catch (e) {}
            console.error("NLP search failed, status:", response.status);
            toast({ title: "Search Failed", description: "Using basic keyword search as fallback.", variant: "default" });
        } else {
            data = await response.json();
            if (data.length === 0) {
                toast({ title: "No Results", description: `No vehicles found matching "${searchTerm}".`, variant: "default" });
            }
        }
        setSearchResults(formatVehicleData(data)); // Use updated formatter
        setCurrentPageSale(1);
        setCurrentPageRent(1);
    } catch (error) {
        console.error("Error calling NLP search API:", error);
        toast({ title: "Search Error", description: "An error occurred while searching.", variant: "destructive" });
        setSearchResults([]);
    } finally {
        setLoading(false);
    }
  };

   // Handle Enter key press in search input (no change)
   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { handleSearch(); } };

  // Determine lists based on search *and* filters
  const getFilteredList = () => {
      if (searchPerformed && searchResults !== null) {
          return searchResults;
      }
      let results = allListings;
      if (selectedMake) {
          results = results.filter(v => v.make === selectedMake);
      }
      if (modelFilter) {
          // Use optional chaining for safety in case model is unexpectedly null/undefined
          results = results.filter(v => v.model?.toLowerCase().includes(modelFilter.toLowerCase()));
      }
      return results;
  };

  const currentFilteredList = getFilteredList();

  const listingsForSale = currentFilteredList.filter(l => !l.is_rentable);
  const listingsForRent = currentFilteredList.filter(l => l.is_rentable);

   // Reset pagination when filters change
   useEffect(() => {
    setCurrentPageSale(1);
    setCurrentPageRent(1);
    if (searchPerformed && (selectedMake || modelFilter)) {
        setSearchPerformed(false);
        setSearchResults(null);
        setSearchTerm("");
    }
   }, [selectedMake, modelFilter, searchPerformed]); // Added searchPerformed dependency


  // Pagination Logic (no change conceptually)
  const totalPagesSale = Math.ceil(listingsForSale.length / ITEMS_PER_PAGE);
  const startIndexSale = (currentPageSale - 1) * ITEMS_PER_PAGE;
  const currentListingsSale = listingsForSale.slice(startIndexSale, startIndexSale + ITEMS_PER_PAGE);

  const totalPagesRent = Math.ceil(listingsForRent.length / ITEMS_PER_PAGE);
  const startIndexRent = (currentPageRent - 1) * ITEMS_PER_PAGE;
  const currentListingsRent = listingsForRent.slice(startIndexRent, startIndexRent + ITEMS_PER_PAGE);

  const handlePageChangeSale = (page: number) => {
    setCurrentPageSale(page);
    window.scrollTo(0, 0);
  };
  const handlePageChangeRent = (page: number) => {
    setCurrentPageRent(page);
    window.scrollTo(0, 0);
  };

  // Helper to render pagination controls (no change)
  const renderPagination = (currentPage: number, totalPages: number, handlePageChange: (page: number) => void) => {
    // ... pagination JSX ...
         if (totalPages <= 1 || loading) return null;
     return (
        <Pagination className="mt-12">
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(1, currentPage - 1)); }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                    return (
                    <PaginationItem key={`page-${pageNum}`}>
                        <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(pageNum); }}
                        isActive={currentPage === pageNum}
                        >
                        {pageNum}
                        </PaginationLink>
                    </PaginationItem>
                    );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <PaginationItem key={`ellipsis-${pageNum}`}><PaginationEllipsis /></PaginationItem>;
                }
                return null;
                })}
                <PaginationItem>
                <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(totalPages, currentPage + 1)); }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
     );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">All Vehicle Listings</h1>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 sticky top-20 z-40">
           <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* NLP Search */}
                <div className="flex-grow relative w-full md:w-auto">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search with keywords or phrases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10 h-12"
                    />
                </div>
                {/* NLP Search Button */}
                <Button onClick={handleSearch} className="h-12 px-6 w-full md:w-auto">
                    <Search className="h-4 w-4 mr-2 md:hidden" />
                    Search
                </Button>

                {/* Make Dropdown */}
                 <div className="w-full md:w-auto">
                     <Select value={selectedMake} onValueChange={setSelectedMake}>
                         <SelectTrigger className="h-12 w-full md:w-[180px]">
                             <SelectValue placeholder="Any Make" />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="">Any Make</SelectItem>
                             {vehicleMakes.map(make => (
                                 <SelectItem key={make} value={make}>{make}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                 </div>

                 {/* Model Input */}
                 <div className="w-full md:w-auto">
                     <Input
                        placeholder="Model"
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                        className="h-12 w-full md:w-[150px]"
                    />
                 </div>
            </div>
             {/* Clear Search/Filter Button */}
             {(searchPerformed || selectedMake || modelFilter) && (
                <div className="mt-4 text-center">
                    <Button variant="link" onClick={fetchAllVehicles}>Clear Search & Filters</Button>
                </div>
            )}
        </div>

        {/* Tabs for Sale/Rent (structure remains the same) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="forSale">For Sale ({listingsForSale.length})</TabsTrigger>
            <TabsTrigger value="forRent">For Rent ({listingsForRent.length})</TabsTrigger>
          </TabsList>

          {/* For Sale Tab Content */}
          <TabsContent value="forSale">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? ( /* Skeletons */
                 Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
                    <Card key={`skel-sale-${index}`} className="overflow-hidden">
                        <Skeleton className="w-full h-48" />
                        <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                    </Card>
                 ))
              ) : currentListingsSale.length > 0 ? ( /* Sale Listings */
                currentListingsSale.map((vehicle) => (
                  <VehicleCard key={`sale-${vehicle.id}`} vehicle={vehicle} isLoggedIn={isLoggedIn} />
                ))
              ) : ( /* Empty State for Sale */
                <div className="col-span-full text-center py-20">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No vehicles found for sale{searchTerm || selectedMake || modelFilter ? " matching your criteria" : ""}.</p>
                </div>
              )}
            </div>
            {renderPagination(currentPageSale, totalPagesSale, handlePageChangeSale)}
          </TabsContent>

          {/* For Rent Tab Content */}
          <TabsContent value="forRent">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? ( /* Skeletons */
                 Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
                    <Card key={`skel-rent-${index}`} className="overflow-hidden">
                        <Skeleton className="w-full h-48" />
                        <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                    </Card>
                 ))
              ) : currentListingsRent.length > 0 ? ( /* Rent Listings */
                currentListingsRent.map((vehicle) => (
                  <VehicleCard key={`rent-${vehicle.id}`} vehicle={vehicle} isLoggedIn={isLoggedIn} />
                ))
              ) : ( /* Empty State for Rent */
                <div className="col-span-full text-center py-20">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No vehicles found for rent{searchTerm || selectedMake || modelFilter ? " matching your criteria" : ""}.</p>
                </div>
              )}
            </div>
            {renderPagination(currentPageRent, totalPagesRent, handlePageChangeRent)}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default AllListings;