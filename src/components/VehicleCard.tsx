import { MapPin, Star, MessageCircle, Car, Fuel, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import ChatModal from "@/components/ChatModal";

// This interface must match the data from Index.tsx
interface Vehicle {
  id: number;
  title: string;
  price: string;
  location: string;
  mileage: string;
  fuel: string;
  image: string;
  seller_name: string; // Use seller_name
  seller_id: number; // Use seller_id
  seller_phone: string;
  seller_email: string;
  rating: number;
  is_rentable: boolean;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  isLoggedIn: boolean; // Accept this prop
}

const VehicleCard = ({ vehicle, isLoggedIn }: VehicleCardProps) => {
  
  const primaryContact = vehicle.seller_phone || vehicle.seller_email || 'N/A';
  const isSale = !vehicle.is_rentable;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <Link to={`/vehicle/${vehicle.id}`}>
          <img
            src={vehicle.image}
            alt={vehicle.title}
            className="w-full h-48 object-cover"
          />
        </Link>
        <Badge className={`absolute top-4 left-4 text-white font-semibold ${isSale ? 'bg-green-600' : 'bg-blue-600'}`}>
          {isSale ? 'FOR SALE' : 'FOR RENT'}
        </Badge>
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {vehicle.fuel}
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-800">
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
            <span className="text-sm text-gray-600 ml-2">{vehicle.seller_name}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link to={`/vehicle/${vehicle.id}`} className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              View Details
            </Button>
          </Link>
          
          {/* --- FIX: Replaced Button with functional ChatModal --- */}
          {isLoggedIn ? (
            <ChatModal 
              sellerName={vehicle.seller_name}
              vehicleTitle={vehicle.title}
              sellerContact={primaryContact}
              initialReceiverId={vehicle.seller_id}
              initialVehicleId={vehicle.id}
            >
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </ChatModal>
          ) : (
            <Link to="/login" className="flex-1">
              <Button variant="outline" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;