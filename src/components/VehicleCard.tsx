
import { MapPin, Star, MessageCircle, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Vehicle {
  id: number;
  title: string;
  price: string;
  location: string;
  mileage: string;
  fuel: string;
  image: string;
  seller: string;
  rating: number;
}

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={vehicle.image}
          alt={vehicle.title}
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-4 left-4 bg-green-500">
          Featured
        </Badge>
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {vehicle.fuel}
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-1">
            {vehicle.title}
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              Rs. {vehicle.price}
            </div>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{vehicle.location}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-4">
          <Car className="h-4 w-4 mr-1" />
          <span className="text-sm">{vehicle.mileage}</span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm font-medium">{vehicle.rating}</span>
            </div>
            <span className="text-sm text-gray-600 ml-2">{vehicle.seller}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
            View Details
          </Button>
          <Button variant="outline" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;
