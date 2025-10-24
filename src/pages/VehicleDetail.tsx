// src/pages/VehicleDetail.tsx

import { useState, useEffect } from "react";
import { Car, MapPin, Fuel, Gauge, Calendar, MessageCircle, Phone, Key, DollarSign, User, Mail } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import ChatModal from "@/components/ChatModal";
import { useToast } from "@/hooks/use-toast";

// Interface for the detailed vehicle object - NOW MATCHES FIXED BACKEND
interface VehicleDetails {
    id: number;
    title: string;
    description: string;
    make: string;
    model: string;
    year: number;
    condition: string;
    price: number | string | null; // Expect raw value
    mileage: number | string | null; // Expect raw value
    fuel_type: string;
    transmission: string;
    location: string;
    is_rentable: boolean;
    images: { id: number; image_url: string }[]; // Expect objects with full URLs
    created_at: string;
    // Seller info directly on the object
    seller_name: string;
    seller_phone: string;
    seller_email: string;
    seller_id: number;
    // seller_role?: string; // Add if API provides it
}

// Interface for the seller object we might construct for display
interface SellerInfo {
    id: number;
    name: string;
    phone: string;
    email: string;
    role: string;
}


const VehicleDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState<string | undefined>(undefined);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Function to log the view (remains the same)
    const logVehicleView = async (vehicleId: string) => {
        const token = localStorage.getItem('token');
        if (!token || !vehicleId || isNaN(parseInt(vehicleId, 10))) return;

        try {
            await fetch('http://localhost:3001/api/interactions/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'view',
                    vehicleId: parseInt(vehicleId, 10)
                })
            });
            console.log(`Logged view for vehicle ${vehicleId}`);
        } catch (error) {
            console.error("Failed to log vehicle view:", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        const fetchVehicle = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/api/vehicles/${id}`);
                if (!response.ok) {
                    throw new Error(`Listing not found or failed to fetch (Status: ${response.status})`);
                }
                // Data should now match VehicleDetails directly
                const data: VehicleDetails = await response.json();

                // ++ FIX: No need to reformat price/mileage here if backend sends raw
                // ++ FIX: No need to reconstruct seller object here

                setVehicle(data); // Set the raw data

                // Set the main image using the full URL from the images array
                const firstImageUrl = data.images && data.images.length > 0
                    ? data.images[0].image_url // Use the full URL directly
                    : "/placeholder.svg";
                setMainImage(firstImageUrl);

                // Log view after setting state
                await logVehicleView(id!);

            } catch (error) {
                console.error("Error fetching vehicle details:", error);
                toast({ title: "Error", description: `Could not load listing: ${(error as Error).message}`, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        if (id && !isNaN(parseInt(id, 10))) { // Check if id is a valid number string
          fetchVehicle();
        } else {
           toast({ title: "Error", description: "Invalid vehicle ID.", variant: "destructive" });
           navigate('/'); // Redirect if invalid ID
           setLoading(false);
        }

    }, [id, navigate, toast]); // Dependencies

    // Loading State
    if (loading) {
        return (
             <div className="min-h-screen">
                <Navigation />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Skeleton Structure */}
                    <Skeleton className="h-8 w-1/2 mb-6" />
                    <div className="grid md:grid-cols-3 gap-8">
                       <div className="md:col-span-2 space-y-4">
                            <Skeleton className="h-96 w-full" />
                            <div className="flex gap-3">
                                <Skeleton className="h-16 w-1/5" /><Skeleton className="h-16 w-1/5" /><Skeleton className="h-16 w-1/5" /><Skeleton className="h-16 w-1/5" /><Skeleton className="h-16 w-1/5" />
                            </div>
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-32 w-full" />
                       </div>
                       <div className="space-y-6">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-48 w-full" />
                       </div>
                    </div>
                </div>
            </div>
        );
    }

    // Vehicle Not Found State
    if (!vehicle) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl font-bold text-red-600">Listing Not Found</h1>
                    <p className="text-gray-600 mt-4">The vehicle you are looking for does not exist or could not be loaded.</p>
                    <Button onClick={() => navigate('/')} className="mt-6">Go to Homepage</Button>
                </div>
            </div>
        );
    }

    // ++ FIX: Construct seller object for display HERE, before return
    const seller: SellerInfo = {
        id: vehicle.seller_id,
        name: vehicle.seller_name || 'N/A',
        phone: vehicle.seller_phone || 'N/A',
        email: vehicle.seller_email || 'N/A',
        role: 'Seller' // Default role, adjust if API provides `seller_role`
    };
    const primaryContact = seller.phone !== 'N/A' ? seller.phone : (seller.email !== 'N/A' ? seller.email : 'N/A');
    const receiverId = seller.id;
    const vehicleId = vehicle.id;

    // ++ FIX: Format price and mileage HERE for display
    const displayPrice = vehicle.price ? Number(vehicle.price).toLocaleString() : 'N/A';
    const displayMileage = vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} km` : 'N/A';


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
                                src={mainImage || "/placeholder.svg"}
                                alt={vehicle.title}
                                className="w-full h-96 object-cover"
                                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                            />
                        </Card>

                        {/* Thumbnails */}
                        {vehicle.images && vehicle.images.length > 0 && (
                             <div className="grid grid-cols-5 gap-3">
                                {vehicle.images.map((img, index) => (
                                    <img
                                        key={img.id || index}
                                        src={img.image_url} // Already the full URL
                                        alt={`Thumbnail ${index + 1}`}
                                        className={`w-full h-16 object-cover rounded-lg cursor-pointer transition-all ${mainImage === img.image_url ? 'border-4 border-blue-600' : 'border border-gray-300'}`}
                                        onClick={() => setMainImage(img.image_url)}
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                ))}
                            </div>
                        )}


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
                                    {/* ++ FIX: Use displayMileage */}
                                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" /> <span>Make: <b>{vehicle.make || 'N/A'}</b></span></div>
                                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" /> <span>Model: <b>{vehicle.model || 'N/A'}</b></span></div>
                                    <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" /> <span>Year: <b>{vehicle.year || 'N/A'}</b></span></div>
                                    <div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-blue-600" /> <span>Mileage: <b>{displayMileage}</b></span></div>
                                    <div className="flex items-center gap-2"><Fuel className="h-5 w-5 text-blue-600" /> <span>Fuel Type: <b>{vehicle.fuel_type || 'N/A'}</b></span></div>
                                    <div className="flex items-center gap-2"><Key className="h-5 w-5 text-blue-600" /> <span>Transmission: <b>{vehicle.transmission || 'N/A'}</b></span></div>
                                    <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" /> <span>Location: <b>{vehicle.location || 'N/A'}</b></span></div>
                                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-blue-600" /> <span>Condition: <b>{vehicle.condition || 'N/A'}</b></span></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card className="shadow-lg">
                            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed">{vehicle.description || 'No description provided.'}</p>
                            </CardContent>
                        </Card>

                    </div>

                    {/* --- Right Column: Seller & Price --- */}
                    <div className="space-y-6">

                        {/* Price Card */}
                        <Card className="bg-blue-600 text-white shadow-lg">
                            <CardContent className="p-6 text-center">
                                <p className="text-lg font-medium mb-1">{vehicle.is_rentable ? 'Price Per Day' : 'Selling Price'}</p>
                                {/* ++ FIX: Use displayPrice */}
                                <h2 className="text-4xl font-extrabold mb-4">Rs. {displayPrice}</h2>
                                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold py-6 text-lg">
                                    <DollarSign className="h-5 w-5 mr-2" /> {vehicle.is_rentable ? 'Book Now' : 'Make an Offer'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Seller Card */}
                        <Card className="shadow-lg">
                            <CardHeader><CardTitle>Seller Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {/* Use constructed seller object for display */}
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
                                        <span>{seller.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Mail className="h-5 w-5 text-red-600" />
                                        <span>{seller.email}</span>
                                    </div>
                                </div>

                                {isLoggedIn ? (
                                    <ChatModal
                                        sellerName={seller.name}
                                        vehicleTitle={vehicle.title}
                                        sellerContact={primaryContact} // Use the declared constant
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