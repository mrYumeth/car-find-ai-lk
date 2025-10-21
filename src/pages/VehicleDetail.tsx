import { useState, useEffect } from "react";
// --- FIX: ADDED User and Mail icons ---
import { Car, MapPin, Fuel, Gauge, Calendar, MessageCircle, Phone, Key, DollarSign, User, Mail } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import ChatModal from "@/components/ChatModal";
import { useToast } from "@/hooks/use-toast";

// Interface for the detailed vehicle object
interface VehicleDetails {
    id: number;
    title: string;
    description: string;
    make: string;
    model: string;
    year: number;
    condition: string;
    price: string;
    mileage: string;
    fuel_type: string;
    transmission: string;
    location: string;
    is_rentable: boolean;
    images: string[];
    created_at: string;
    rating: number;
    views: number;
    seller: {
        id: number; // Required for chat functionality
        name: string;
        phone: string;
        email: string;
        role: string;
    };
}

const VehicleDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState<string | undefined>(undefined);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        const fetchVehicle = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/api/vehicles/${id}`);
                if (!response.ok) {
                    throw new Error("Listing not found or failed to fetch.");
                }
                const data: VehicleDetails = await response.json();
                setVehicle(data);
                
                // Ensure the main image URL is constructed correctly immediately
                const firstImageUrl = data.images[0] ? `http://localhost:3001${data.images[0]}` : "/placeholder.svg";
                setMainImage(firstImageUrl);
            } catch (error) {
                console.error("Error fetching vehicle details:", error);
                toast({ title: "Error", description: `Could not load listing: ${(error as Error).message}`, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [id, navigate, toast]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <Skeleton className="h-64 w-full mb-8" />
                    <div className="grid md:grid-cols-3 gap-8">
                        <Skeleton className="h-96 md:col-span-2" />
                        <Skeleton className="h-96" />
                    </div>
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl font-bold text-red-600">Listing Not Found</h1>
                    <p className="text-gray-600 mt-4">The vehicle you are looking for does not exist.</p>
                    <Button onClick={() => navigate('/')} className="mt-6">Go to Homepage</Button>
                </div>
            </div>
        );
    }

    const { seller } = vehicle;
    const primaryContact = seller.phone || seller.email || 'N/A';

    // --- FIX: DECLARE MISSING VARIABLES HERE ---
    const receiverId = seller.id;
    const vehicleId = vehicle.id;

    // Helper function to handle thumbnail click and image URL conversion
    const getFullImageUrl = (imgUrl: string) => `http://localhost:3001${imgUrl}`;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                
                {/* Title and Back Link */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold text-gray-800">{vehicle.title}</h1>
                    <Button variant="outline" onClick={() => navigate(-1)}>Back to Listings</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* --- Left Column: Images & Description --- */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Main Image */}
                        <Card className="overflow-hidden shadow-lg">
                            <img
                                src={mainImage}
                                alt={vehicle.title}
                                className="w-full h-96 object-cover"
                            />
                        </Card>
                        
                        {/* Thumbnails */}
                        <div className="grid grid-cols-5 gap-3">
                            {vehicle.images.map((imgUrl, index) => {
                                const fullUrl = getFullImageUrl(imgUrl);
                                return (
                                    <img
                                        key={index}
                                        src={fullUrl}
                                        alt={`Thumbnail ${index + 1}`}
                                        className={`w-full h-16 object-cover rounded-lg cursor-pointer transition-all ${mainImage === fullUrl ? 'border-4 border-blue-600' : 'border border-gray-300'}`}
                                        onClick={() => setMainImage(fullUrl)}
                                    />
                                );
                            })}
                        </div>

                        {/* Vehicle Info Card */}
                        <Card className="shadow-lg">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="text-2xl font-bold">Key Information</CardTitle>
                                <Badge variant={vehicle.is_rentable ? "secondary" : "default"} className="text-lg py-1 px-3">
                                    {vehicle.is_rentable ? 'For Rent' : 'For Sale'}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700">
                                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" /> <span>Make: <b>{vehicle.make}</b></span></div>
                                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" /> <span>Model: <b>{vehicle.model}</b></span></div>
                                    <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" /> <span>Year: <b>{vehicle.year}</b></span></div>
                                    <div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-blue-600" /> <span>Mileage: <b>{vehicle.mileage}</b></span></div>
                                    <div className="flex items-center gap-2"><Fuel className="h-5 w-5 text-blue-600" /> <span>Fuel Type: <b>{vehicle.fuel_type}</b></span></div>
                                    <div className="flex items-center gap-2"><Key className="h-5 w-5 text-blue-600" /> <span>Transmission: <b>{vehicle.transmission}</b></span></div>
                                    <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" /> <span>Location: <b>{vehicle.location}</b></span></div>
                                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" /> <span>Condition: <b>{vehicle.condition}</b></span></div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Description */}
                        <Card className="shadow-lg">
                            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
                            </CardContent>
                        </Card>
                        
                    </div>

                    {/* --- Right Column: Seller & Price --- */}
                    <div className="space-y-6">
                        
                        {/* Price Card */}
                        <Card className="bg-blue-600 text-white shadow-lg">
                            <CardContent className="p-6 text-center">
                                <p className="text-lg font-medium mb-1">{vehicle.is_rentable ? 'Price Per Day' : 'Selling Price'}</p>
                                <h2 className="text-4xl font-extrabold mb-4">Rs. {vehicle.price}</h2>
                                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold py-6 text-lg">
                                    <DollarSign className="h-5 w-5 mr-2" /> {vehicle.is_rentable ? 'Book Now' : 'Make an Offer'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Seller Card */}
                        <Card className="shadow-lg">
                            <CardHeader><CardTitle>Seller Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <User className="h-8 w-8 text-orange-600" />
                                    <div>
                                        <p className="text-xl font-semibold">{seller.name}</p>
                                        <p className="text-sm text-gray-500">{seller.role.charAt(0).toUpperCase() + seller.role.slice(1)}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="h-5 w-5 text-green-600" />
                                        <span>{seller.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Mail className="h-5 w-5 text-red-600" />
                                        <span>{seller.email || 'N/A'}</span>
                                    </div>
                                </div>

                                {isLoggedIn ? (
                                    <ChatModal 
                                        sellerName={seller.name}
                                        vehicleTitle={vehicle.title}
                                        sellerContact={seller.phone || seller.email}
                                        initialReceiverId={receiverId}
                                        initialVehicleId={vehicleId}
                                    >
                                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                                            <MessageCircle className="h-5 w-5 mr-2" /> Message Seller
                                        </Button>
                                    </ChatModal>
                                ) : (
                                    <Link to="/login">
                                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                                            Login to Message Seller
                                        </Button>
                                    </Link>
                                )}      
                            </CardContent>
                        </Card>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleDetail;