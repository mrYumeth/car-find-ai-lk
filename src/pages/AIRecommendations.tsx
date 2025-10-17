import { useState } from "react";
import { Sparkles, SlidersHorizontal, TrendingUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import VehicleCard from "@/components/VehicleCard";

const AIRecommendations = () => {
  const [priceRange, setPriceRange] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");

  const recommendations = [
    {
      id: 1,
      title: "Toyota Prius 2019",
      price: "4,500,000",
      location: "Colombo",
      mileage: "35,000 km",
      fuel: "Hybrid",
      image: "/placeholder.svg",
      seller: "John Perera",
      rating: 4.8,
      matchScore: 95,
      reason: "Based on your recent searches for hybrid vehicles"
    },
    {
      id: 2,
      title: "Honda Vezel 2020",
      price: "6,200,000",
      location: "Kandy",
      mileage: "28,000 km",
      fuel: "Petrol",
      image: "/placeholder.svg",
      seller: "Priya Silva",
      rating: 4.9,
      matchScore: 92,
      reason: "Similar to vehicles you've saved"
    },
    {
      id: 3,
      title: "Suzuki Alto 2018",
      price: "2,800,000",
      location: "Galle",
      mileage: "45,000 km",
      fuel: "Petrol",
      image: "/placeholder.svg",
      seller: "Kamal Fernando",
      rating: 4.7,
      matchScore: 88,
      reason: "Matches your budget preferences"
    },
    {
      id: 4,
      title: "Nissan Leaf 2021",
      price: "7,500,000",
      location: "Colombo",
      mileage: "15,000 km",
      fuel: "Electric",
      image: "/placeholder.svg",
      seller: "Saman Dias",
      rating: 4.9,
      matchScore: 90,
      reason: "Popular in your area and eco-friendly"
    },
    {
      id: 5,
      title: "Toyota Aqua 2019",
      price: "4,200,000",
      location: "Negombo",
      mileage: "32,000 km",
      fuel: "Hybrid",
      image: "/placeholder.svg",
      seller: "Nimal Kumar",
      rating: 4.6,
      matchScore: 87,
      reason: "Trending in your search category"
    },
    {
      id: 6,
      title: "Honda Fit 2020",
      price: "5,800,000",
      location: "Kandy",
      mileage: "25,000 km",
      fuel: "Petrol",
      image: "/placeholder.svg",
      seller: "Dilani Perera",
      rating: 4.8,
      matchScore: 85,
      reason: "Matches your viewing history"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              AI-Powered Recommendations
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Personalized vehicle suggestions based on your preferences, search history, and browsing behavior
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">95%</div>
                <div className="text-muted-foreground">Match Accuracy</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">24</div>
                <div className="text-muted-foreground">Recommendations</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">Daily</div>
                <div className="text-muted-foreground">Updates</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Refine Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                  >
                    <option value="all">All Prices</option>
                    <option value="under2m">Under 2M</option>
                    <option value="2m-5m">2M - 5M</option>
                    <option value="5m-10m">5M - 10M</option>
                    <option value="over10m">Over 10M</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Vehicle Type</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="van">Van</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fuel Type</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                    <option value="all">All Fuel Types</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Top Picks For You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((vehicle) => (
              <div key={vehicle.id} className="relative">
                <Badge
                  className="absolute top-4 right-4 z-10 bg-gradient-to-r from-purple-500 to-blue-600"
                >
                  {vehicle.matchScore}% Match
                </Badge>
                <VehicleCard vehicle={vehicle} />
                <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-purple-900">{vehicle.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>How AI Recommendations Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Analyze Your Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    We track your searches, views, and saved vehicles
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Smart Matching</h4>
                  <p className="text-sm text-muted-foreground">
                    AI matches vehicles based on your preferences and budget
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-green-600">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Daily Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Get fresh recommendations as new vehicles are listed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;