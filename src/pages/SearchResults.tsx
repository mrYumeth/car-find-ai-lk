
import { useState } from "react";
import { Search, Filter, MapPin, Car, Star, MessageCircle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import VehicleCard from "@/components/VehicleCard";

const SearchResults = () => {
  const [searchTerm, setSearchTerm] = useState("Toyota");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 20000000]);
  const [sortBy, setSortBy] = useState("newest");

  const searchResults = [
    {
      id: 1,
      title: "Toyota Prius 2019",
      price: "4,500,000",
      location: "Colombo",
      mileage: "35,000 km",
      fuel: "Hybrid",
      image: "/placeholder.svg",
      seller: "John Perera",
      rating: 4.8
    },
    {
      id: 2,
      title: "Toyota Corolla 2020",
      price: "5,200,000",
      location: "Kandy",
      mileage: "28,000 km",
      fuel: "Petrol",
      image: "/placeholder.svg",
      seller: "Priya Silva",
      rating: 4.9
    },
    {
      id: 3,
      title: "Toyota Camry 2018",
      price: "7,800,000",
      location: "Galle",
      mileage: "45,000 km",
      fuel: "Petrol",
      image: "/placeholder.svg",
      seller: "Kamal Fernando",
      rating: 4.7
    },
    {
      id: 4,
      title: "Toyota Vitz 2017",
      price: "3,200,000",
      location: "Negombo",
      mileage: "52,000 km",
      fuel: "Petrol",
      image: "/placeholder.svg",
      seller: "Saman Rajapaksa",
      rating: 4.6
    },
    {
      id: 5,
      title: "Toyota Land Cruiser 2019",
      price: "18,500,000",
      location: "Colombo",
      mileage: "38,000 km",
      fuel: "Diesel",
      image: "/placeholder.svg",
      seller: "Nimal Perera",
      rating: 4.9
    },
    {
      id: 6,
      title: "Toyota Hiace 2018",
      price: "6,800,000",
      location: "Kurunegala",
      mileage: "42,000 km",
      fuel: "Diesel",
      image: "/placeholder.svg",
      seller: "Chamara Silva",
      rating: 4.5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button className="h-12 px-8 bg-orange-500 hover:bg-orange-600">
              Search
            </Button>
            <Button
              variant="outline"
              className="h-12 px-6"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <select className="px-3 py-2 rounded border border-gray-300">
              <option>All Categories</option>
              <option>Cars</option>
              <option>SUV</option>
              <option>Van</option>
              <option>Motorcycle</option>
            </select>
            <select className="px-3 py-2 rounded border border-gray-300">
              <option>All Locations</option>
              <option>Colombo</option>
              <option>Kandy</option>
              <option>Galle</option>
              <option>Negombo</option>
            </select>
            <select className="px-3 py-2 rounded border border-gray-300">
              <option>Price Range</option>
              <option>Under 2M</option>
              <option>2M - 5M</option>
              <option>5M - 10M</option>
              <option>Over 10M</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80">
              <Card className="sticky top-4">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Price Range</h3>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={20000000}
                      step={100000}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Rs. {priceRange[0].toLocaleString()}</span>
                      <span>Rs. {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Make</h3>
                    <div className="space-y-2">
                      {['Toyota', 'Honda', 'Nissan', 'Suzuki', 'Mazda'].map((make) => (
                        <div key={make} className="flex items-center space-x-2">
                          <Checkbox id={make.toLowerCase()} />
                          <label htmlFor={make.toLowerCase()} className="text-sm">{make}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Fuel Type</h3>
                    <div className="space-y-2">
                      {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((fuel) => (
                        <div key={fuel} className="flex items-center space-x-2">
                          <Checkbox id={fuel.toLowerCase()} />
                          <label htmlFor={fuel.toLowerCase()} className="text-sm">{fuel}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Year Range</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="From" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="To" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button className="w-full">Apply Filters</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Search Results</h2>
                <p className="text-gray-600">{searchResults.length} vehicles found for "{searchTerm}"</p>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="mileage">Lowest Mileage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" className="px-8 py-3">
                Load More Results
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
