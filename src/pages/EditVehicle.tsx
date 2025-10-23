import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Car, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

// List of car makes for the dropdown
const carMakes = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Citroen", "Dodge", "Ferrari", "Fiat", "Ford",
  "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini",
  "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "Mini", "Mitsubishi", "Nissan", "Pagani", "Peugeot", "Porsche", "Ram", "Renault",
  "Rolls-Royce", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

interface ExistingImage {
    id: number;
    image_url: string; // This is the relative path, e.g., /uploads/123.jpg
}

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "", make: "", model: "", year: "", price: "", mileage: "",
    fuel_type: "", transmission: "", condition: "", location: "", description: ""
  });
  const [loading, setLoading] = useState(true);
  const [isRentable, setIsRentable] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]); 
  const [newImages, setNewImages] = useState<File[]>([]); // New files to upload
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]); // Local URLs for new files

  useEffect(() => {
    const fetchVehicleData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            // Use the secure endpoint for editing
            const response = await fetch(`http://localhost:3001/api/edit-vehicle/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Could not fetch your vehicle data.");
            
            const data = await response.json();
            
            // Set all form data from the database
            setIsRentable(data.is_rentable || false);
            setFormData({
                title: data.title || '',
                make: data.make || '',
                model: data.model || '',
                year: data.year?.toString() || '',
                price: data.price?.toString() || '',
                mileage: data.mileage?.toString() || '',
                fuel_type: data.fuel_type || '',
                transmission: data.transmission || '',
                condition: data.condition || '',
                location: data.location || '',
                description: data.description || '',
            });
            setExistingImages(data.images || []);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };
    fetchVehicleData();
  }, [id, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        const limit = 8;
        const currentTotal = existingImages.length + newImages.length;
        const filesToAdd = filesArray.slice(0, Math.max(0, limit - currentTotal));

        setNewImages(prev => [...prev, ...filesToAdd]);
        
        const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
        setNewImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove an image that already exists in the database
  const removeExistingImage = (imageId: number) => {
    setExistingImages(current => current.filter(img => img.id !== imageId));
  };

  // Remove a new image that was just added in the browser
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]); // Prevent memory leaks
    setNewImages(current => current.filter((_, i) => i !== index));
    setNewImagePreviews(current => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { toast({ title: "Not Authenticated", variant: "destructive"}); return; }

    let newlyUploadedUrls: string[] = [];

    // Step 1: Upload NEW images (if any)
    if (newImages.length > 0) {
        const imageFormData = new FormData();
        newImages.forEach(image => {
            imageFormData.append('images', image);
        });
        try {
            const uploadResponse = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // Add token for secure upload
                body: imageFormData,
            });
            if (!uploadResponse.ok) throw new Error("New image upload failed");
            const uploadResult = await uploadResponse.json();
            newlyUploadedUrls = uploadResult.urls; // e.g., ["/uploads/123.jpg"]
        } catch (error) {
            console.error("Error uploading new images:", error);
            toast({ title: "Error", description: "Could not upload new images.", variant: "destructive" });
            return;
        }
    }

    // Step 2: Prepare final list of image URLs
    const finalImageUrls = [
        ...existingImages.map(img => img.image_url), // URLs of old images to keep
        ...newlyUploadedUrls                         // URLs of newly uploaded images
    ];

    // Step 3: Submit updated vehicle data + final image list
    const updatedData = {
        ...formData,
        images: finalImageUrls // Send the complete list of URLs
    };

    try {
        const response = await fetch(`http://localhost:3001/api/vehicles/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to update vehicle.");
        }
        toast({ title: "Success!", description: "Vehicle details updated." });
        navigate('/dashboard');
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (loading) return (
      <div className="flex justify-center items-center h-screen">Loading vehicle details...</div>
  );

  const currentTotalImages = existingImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Car className="h-6 w-6 text-blue-600" />
                    Edit Vehicle Details
                </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- ALL FORM FIELDS NOW RENDERED WITH DATA --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Ad Title</Label>
                        <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">{isRentable ? "Price per Day (LKR)" : "Price (LKR)"}</Label>
                        <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Select name="make" value={formData.make} onValueChange={(value) => handleSelectChange("make", value)}>
                      <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
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

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage (km)</Label>
                      <Input id="mileage" name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuel_type">Fuel Type</Label>
                      <Select name="fuel_type" value={formData.fuel_type} onValueChange={(value) => handleSelectChange("fuel_type", value)}>
                          <SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Petrol">Petrol</SelectItem>
                              <SelectItem value="Diesel">Diesel</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                              <SelectItem value="Electric">Electric</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transmission">Transmission</Label>
                      <Select name="transmission" value={formData.transmission} onValueChange={(value) => handleSelectChange("transmission", value)}>
                          <SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Automatic">Automatic</SelectItem>
                              <SelectItem value="Manual">Manual</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <Select name="condition" value={formData.condition} onValueChange={(value) => handleSelectChange("condition", value)}>
                            <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Used">Used</SelectItem>
                                <SelectItem value="Brand New">Brand New</SelectItem>
                                <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" value={formData.location} onChange={handleInputChange} required />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={5} required />
                </div>

                {/* --- FIX: Image Editing Section --- */}
                <div className="space-y-4">
                  <Label>Images ({currentTotalImages} of 8)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Display Existing Images from DB */}
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative">
                        <img 
                          src={`http://localhost:3001${image.image_url}`} 
                          alt="Existing vehicle" 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" 
                          onClick={() => removeExistingImage(image.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {/* Display New Image Previews */}
                    {newImagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img 
                          src={preview} 
                          alt={`New preview ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" 
                          onClick={() => removeNewImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {/* Upload Button (if limit not reached) */}
                    {currentTotalImages < 8 && (
                      <Label 
                        htmlFor="image-upload" 
                        className="h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add Photos</span>
                      </Label>
                    )}
                    <Input 
                      id="image-upload" 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleNewImageUpload} 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditVehicle;