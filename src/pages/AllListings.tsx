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
// Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

const ITEMS_PER_PAGE = 12;

const AllListings = () => {
  const [allListings, _setAllListings] = useState<Vehicle[]>([]);
  const [filteredListings, setFilteredListings] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPageSale, setCurrentPageSale] = useState(1); // Separate pagination state for sale
  const [currentPageRent, setCurrentPageRent] = useState(1); // Separate pagination state for rent
  const [activeTab, setActiveTab] = useState("forSale"); // State for active tab
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Helper to format data (no change)
  const formatVehicleData = (vehicleData: any[]): Vehicle[] => {
    return vehicleData.map(v => ({
            id: v.id || 0,
            title: v.title || 'N/A',
            price: v.price || 'N/A',
            location: v.location || 'N/A',
            mileage: v.mileage || 'N/A',
            fuel: v.fuel || v.fuel_type || 'N/A',
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

  useEffect(() => {
    // Initial fetch (no change)
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/vehicles');
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        const data = await response.json();
        const formattedData = formatVehicleData(data);
        _setAllListings(formattedData);
        setFilteredListings(formattedData);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        toast({ title: "Error", description: "Could not load listings.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [toast]);

  // Apply search/filter logic (no change)
  useEffect(() => {
    let results = allListings;
    if (searchTerm) {
      results = results.filter(v =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.make && v.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.location && v.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredListings(results);
    setCurrentPageSale(1); // Reset both paginations on filter change
    setCurrentPageRent(1);
  }, [searchTerm, allListings]);

  // Separate lists after filtering
  const listingsForSale = filteredListings.filter(l => !l.is_rentable);
  const listingsForRent = filteredListings.filter(l => l.is_rentable);

  // Pagination Logic - Sale
  const totalPagesSale = Math.ceil(listingsForSale.length / ITEMS_PER_PAGE);
  const startIndexSale = (currentPageSale - 1) * ITEMS_PER_PAGE;
  const currentListingsSale = listingsForSale.slice(startIndexSale, startIndexSale + ITEMS_PER_PAGE);

  // Pagination Logic - Rent
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

  // Helper to render pagination controls
  const renderPagination = (currentPage: number, totalPages: number, handlePageChange: (page: number) => void) => {
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

        {/* Search and Filter Bar (no change) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 sticky top-20 z-40">
           <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search all listings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12"
                    />
                </div>
                 <select className="h-12 px-3 rounded border border-gray-300 text-gray-700">
                  <option>Any Make</option>
                </select>
                <select className="h-12 px-3 rounded border border-gray-300 text-gray-700">
                    <option>Any Price</option>
                </select>
            </div>
        </div>

        {/* Tabs for Sale/Rent */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="forSale">For Sale ({listingsForSale.length})</TabsTrigger>
            <TabsTrigger value="forRent">For Rent ({listingsForRent.length})</TabsTrigger>
          </TabsList>

          {/* For Sale Tab Content */}
          <TabsContent value="forSale">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? (
                Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
                  <Card key={`skel-sale-${index}`} className="overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : currentListingsSale.length > 0 ? (
                currentListingsSale.map((vehicle) => (
                  <VehicleCard key={`sale-${vehicle.id}`} vehicle={vehicle} isLoggedIn={isLoggedIn} />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No vehicles found for sale{searchTerm ? " matching your search" : ""}.</p>
                </div>
              )}
            </div>
            {renderPagination(currentPageSale, totalPagesSale, handlePageChangeSale)}
          </TabsContent>

          {/* For Rent Tab Content */}
          <TabsContent value="forRent">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? (
                Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
                  <Card key={`skel-rent-${index}`} className="overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : currentListingsRent.length > 0 ? (
                currentListingsRent.map((vehicle) => (
                  <VehicleCard key={`rent-${vehicle.id}`} vehicle={vehicle} isLoggedIn={isLoggedIn} />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No vehicles found for rent{searchTerm ? " matching your search" : ""}.</p>
                </div>
              )}
            </div>
            {renderPagination(currentPageRent, totalPagesRent, handlePageChangeRent)}
          </TabsContent>
        </Tabs>

      </div>
      {/* Add Footer if needed */}
    </div>
  );
};

export default AllListings;