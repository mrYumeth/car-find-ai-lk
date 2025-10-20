import { MapPin, Star, MessageCircle, Car, Fuel, Heart, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import ChatModal from "@/components/ChatModal"; // Ensure ChatModal is imported

interface Vehicle {
  id: number;
  title: string;
  price: string;
  location: string;
  mileage: string;
  fuel: string;
  image: string;
  // --- FIX: Updated interface to match fetched data ---
  seller_name: string; // Renamed from 'seller'
  seller_phone: string;
  seller_email: string;
  rating: number;
  is_rentable: boolean; // Added for conditional display
}

interface VehicleCardProps {
  vehicle: Vehicle;
  isLoggedIn: boolean; // Added for conditional messaging
}

const VehicleCard = ({ vehicle, isLoggedIn }: VehicleCardProps) => {
  const isSale = !vehicle.is_rentable;
  // FIX: Determine primary contact method
  const primaryContact = vehicle.seller_phone || vehicle.seller_email || 'N/A';

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <Link to={`/vehicle/${vehicle.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={vehicle.image}
            alt={vehicle.title}
            className="w-full h-48 object-cover"
          />
          <Badge className={`absolute top-4 left-4 text-white font-semibold ${isSale ? 'bg-green-600' : 'bg-blue-600'}`}>
            {isSale ? 'FOR SALE' : 'FOR RENT'}
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
                <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                <span className="text-sm font-medium">{vehicle.rating}</span>
              </div>
              {/* FIX: Use seller_name property */}
              <span className="text-sm text-gray-600 ml-2">{vehicle.seller_name}</span>
            </div>
          </div>
        </CardContent>
      </Link>
      
      <div className="p-4 border-t flex gap-2">
        {/* --- CONDITIONAL MESSAGING BUTTON --- */}
        {isLoggedIn ? (
          <ChatModal 
            sellerName={vehicle.seller_name}
            vehicleTitle={vehicle.title}
            sellerContact={primaryContact}
          >
            {/* The button is now the trigger (children prop) */}
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              <MessageCircle className="h-4 w-4 mr-2" /> Message Seller
            </Button>
          </ChatModal>
        ) : (
          <Link to="/login" className="flex-1">
            <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
              Login to Contact
            </Button>
          </Link>
        )}
         <Button variant="outline" size="icon" className="flex-shrink-0">
            <Heart className="h-5 w-5 text-red-500" />
        </Button>
      </div>
    </Card>
  );
};

export default VehicleCard;