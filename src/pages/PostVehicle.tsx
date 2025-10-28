import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Car, Upload, X, Loader2, Sparkles } from "lucide-react"; // ++ Add Loader2, Sparkles
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

// List of vehicle makes (example)
const carMakes = [
 "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Citroen", "Dodge", "Ferrari", "Fiat", "Ford",
  "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini",
  "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "Mini", "Mitsubishi", "Nissan", "Pagani", "Peugeot", "Porsche", "Ram", "Renault",
  "Rolls-Royce", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo", "Other"
];

// ++ Add a simple debounce hook (or use a library)
function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface PriceSuggestion {
  estimated_price: number;
  price_range_low: number;
  price_range_high: number;
}

const PostVehicle = () => { // It's exported as a named export (const PostVehicle = ...)
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isRentable = location.state?.isRentable ?? false; // Default to false if state is not passed

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    fuel_type: '',
    transmission: '',
    condition: '',
    location: '',
    description: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // +++ NEW State for price suggestion +++
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // +++ Debounce the form data relevant for price prediction +++
  const debouncedFormData = useDebounce(formData, 1000); // 1-second delay

  // --- Fetch price suggestion when debounced data changes ---
  useEffect(() => {
    // Only fetch if the key fields are filled
    const { make, model, year, mileage, fuel_type, transmission, condition } = debouncedFormData;
    if (make && model && year && mileage && fuel_type && transmission && condition && !isRentable) {

      const fetchSuggestion = async () => {
        setLoadingSuggestion(true);
        const token = localStorage.getItem('token');
        if (!token) return; // Should be logged in to be here anyway

        try {
          const response = await fetch('http://localhost:3001/api/price-estimate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            // Send only the necessary fields
            body: JSON.stringify({ make, model, year, mileage, fuel_type, transmission, condition })
          });

          if (response.ok) {
            const suggestion = await response.json();
            setPriceSuggestion(suggestion);
          } else {
            console.error("Price suggestion API failed:", response.statusText);
            setPriceSuggestion(null); // Clear suggestion on error
          }
        } catch (error) {
          console.error("Error fetching price suggestion:", error);
          setPriceSuggestion(null);
        } finally {
          setLoadingSuggestion(false);
        }
      };

      fetchSuggestion();
    } else {
      setPriceSuggestion(null); // Clear if fields are incomplete or if it's for rent
    }
  }, [debouncedFormData, isRentable]); // Re-run on debounced data change or rent/sale toggle


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 8 - images.length;
      const filesToAdd = filesArray.slice(0, remainingSlots);

      setImages([...images, ...filesToAdd]);

      const previews = filesToAdd.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      navigate('/login');
      return;
    }

    // 1. Upload images first
    let uploadedImageUrls: string[] = [];
    if (images.length > 0) {
      const imageFormData = new FormData();
      images.forEach(image => imageFormData.append('images', image));

      try {
        const uploadResponse = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: imageFormData,
          // No 'Content-Type' header needed, browser sets it for FormData
        });
        if (!uploadResponse.ok) throw new Error("Image upload failed");
        const uploadResult = await uploadResponse.json();
        uploadedImageUrls = uploadResult.urls; // Assuming backend returns { urls: [...] }
      } catch (error) {
        toast({ title: "Image Upload Error", description: (error as Error).message, variant: "destructive" });
        return;
      }
    }

    // 2. Submit vehicle data with image URLs
    try {
      const vehicleData = {
        ...formData,
        is_rentable: isRentable,
        images: uploadedImageUrls // Send the URLs returned by the upload endpoint
      };
      const response = await fetch('http://localhost:3001/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vehicleData)
      });
      if (!response.ok) {
        const errorData = await response.text(); // Get more details if possible
        throw new Error(errorData || "Failed to post vehicle.");
      }
      toast({ title: "Success!", description: "Your vehicle has been submitted for approval." });
      navigate('/dashboard'); // Navigate to dashboard after successful post
    } catch (error) {
      toast({ title: "Submission Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {isRentable ? "Rent Out Your Vehicle" : "Post Your Vehicle For Sale"}
            </h1>
          </div>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Car className="h-6 w-6 text-blue-600" />Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ad Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Ad Title</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                  </div>
                  {/* Price Input & Suggestion */}
                  <div className="space-y-2">
                    <Label htmlFor="price">{isRentable ? "Price per Day (LKR)" : "Price (LKR)"}</Label>
                    <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />

                    {/* +++ PRICE SUGGESTION BOX +++ */}
                    {!isRentable && (loadingSuggestion || priceSuggestion) && (
                      <div className="flex items-center gap-2 p-2 mt-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                        {loadingSuggestion ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-blue-700">Calculating market value...</span>
                          </>
                        ) : priceSuggestion ? (
                          <>
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800">
                              Suggested: <b>Rs. {priceSuggestion.price_range_low.toLocaleString()} - {priceSuggestion.price_range_high.toLocaleString()}</b>
                            </span>
                          </>
                        ) : null}
                      </div>
                    )}
                    {/* +++ END SUGGESTION BOX +++ */}

                  </div> {/* Closing div for price section */}
                </div> {/* Closing div for Title/Price grid */}

                {/* --- Make, Model, Year Fields --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Select name="make" onValueChange={(value) => handleSelectChange("make", value)} value={formData.make}>
                      <SelectTrigger id="make"><SelectValue placeholder="Select make" /></SelectTrigger>
                      <SelectContent>
                        {carMakes.sort().map((make) => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" value={formData.model} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" name="year" type="number" value={formData.year} onChange={handleInputChange} required />
                  </div>
                </div>

                {/* --- Mileage, Fuel Type, Transmission Fields --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage (km)</Label>
                    <Input id="mileage" name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Fuel Type</Label>
                    <Select name="fuel_type" value={formData.fuel_type} onValueChange={(value) => handleSelectChange("fuel_type", value)}><SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger><SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                    </SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select name="transmission" value={formData.transmission} onValueChange={(value) => handleSelectChange("transmission", value)}><SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger><SelectContent>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent></Select>
                  </div>
                </div>

                {/* --- Condition & Location Fields --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select name="condition" value={formData.condition} onValueChange={(value) => handleSelectChange("condition", value)}><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger><SelectContent>
                      <SelectItem value="Used">Used</SelectItem>
                      <SelectItem value="Brand New">Brand New</SelectItem>
                      <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                    </SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={formData.location} onChange={handleInputChange} required />
                  </div>
                </div>

                {/* --- Description Field --- */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={5} required />
                </div>

                {/* --- Image Upload Field --- */}
                <div className="space-y-4">
                  <Label>Vehicle Images (up to 8)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg"/>
                        <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={() => removeImage(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {images.length < 8 && (
                      <Label htmlFor="image-upload" className="h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                        <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add Photos</span>
                      </Label>
                    )}
                    <Input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>

                {/* --- Submit Button --- */}
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                  {isRentable ? "Submit for Rent" : "Submit for Sale"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostVehicle; 