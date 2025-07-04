
import { useState } from "react";
import { Car, MapPin, Star, MessageCircle, Phone, Heart, Share2, Flag, Calendar, Gauge, Fuel, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import ChatModal from "@/components/ChatModal";

const VehicleDetail = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const vehicle = {
    id: 1,
    title: "Toyota Prius 2019 - Premium Hybrid",
    price: "4,500,000",
    location: "Colombo 03",
    images: Array(6).fill("/placeholder.svg"),
    seller: {
      name: "John Perera",
      rating: 4.8,
      reviews: 156,
      joinDate: "2022",
      avatar: "/placeholder.svg"
    },
    details: {
      make: "Toyota",
      model: "Prius",
      year: "2019",
      mileage: "35,000 km",
      fuel: "Hybrid",
      transmission: "CVT",
      condition: "Used",
      engine: "1.8L",
      color: "Pearl White",
      registeredYear: "2019"
    },
    description: "Excellent condition Toyota Prius 2019 model. This hybrid vehicle offers exceptional fuel efficiency and reliability. Well-maintained with full service history. Features include automatic climate control, keyless entry, reverse camera, navigation system, and more. Perfect for city driving and long trips.",
    features: [
      "Automatic Climate Control",
      "Keyless Entry",
      "Reverse Camera",
      "Navigation System",
      "Bluetooth Connectivity",
      "LED Headlights",
      "Alloy Wheels",
      "Power Windows"
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative">
                <img
                  src={vehicle.images[currentImageIndex]}
                  alt={vehicle.title}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500">Featured</Badge>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Thumbnail Navigation */}
              <div className="p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`View ${index + 1}`}
                      className={`w-16 h-16 object-cover rounded cursor-pointer ${
                        currentImageIndex === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Vehicle Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{vehicle.title}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{vehicle.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">Rs. {vehicle.price}</div>
                    <p className="text-sm text-gray-500">Negotiable</p>
                  </div>
                </div>

                {/* Key Specifications */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Year</p>
                      <p className="font-semibold">{vehicle.details.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Gauge className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Mileage</p>
                      <p className="font-semibold">{vehicle.details.mileage}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Fuel className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Fuel</p>
                      <p className="font-semibold">{vehicle.details.fuel}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Settings className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Transmission</p>
                      <p className="font-semibold">{vehicle.details.transmission}</p>
                    </div>
                  </div>
                </div>

                {/* Full Specifications */}
                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Full Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(vehicle.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Description</h3>
                <p className="text-gray-700 leading-relaxed mb-6">{vehicle.description}</p>
                
                <h4 className="text-lg font-semibold mb-3">Key Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-16 w-16 mr-4">
                    <AvatarImage src={vehicle.seller.avatar} />
                    <AvatarFallback>JP</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{vehicle.seller.name}</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{vehicle.seller.rating}</span>
                      <span className="text-gray-500 ml-1">({vehicle.seller.reviews} reviews)</span>
                    </div>
                    <p className="text-sm text-gray-500">Member since {vehicle.seller.joinDate}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                  <Button variant="outline" className="w-full h-12">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Seller
                  </Button>
                  <Button variant="outline" className="w-full h-12 text-red-600 hover:text-red-700">
                    <Flag className="h-4 w-4 mr-2" />
                    Report Listing
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-orange-600">Safety Tips</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Meet in a public place</li>
                  <li>• Inspect the vehicle thoroughly</li>
                  <li>• Verify all documents</li>
                  <li>• Take a test drive</li>
                  <li>• Use secure payment methods</li>
                  <li>• Trust your instincts</li>
                </ul>
              </CardContent>
            </Card>

            {/* Similar Vehicles */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Similar Vehicles</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <img
                        src="/placeholder.svg"
                        alt="Similar vehicle"
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">Honda Vezel 2020</p>
                        <p className="text-blue-600 font-semibold">Rs. 6,200,000</p>
                        <p className="text-xs text-gray-500">Kandy</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        sellerName={vehicle.seller.name}
        vehicleTitle={vehicle.title}
      />
    </div>
  );
};

export default VehicleDetail;
