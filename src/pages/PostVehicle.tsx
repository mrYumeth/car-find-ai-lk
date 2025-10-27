import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Car, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

// Comprehensive list of car makes
const carMakes = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Citroen", "Dodge", "Ferrari", "Fiat", "Ford",
  "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini",
  "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz",
  "Mini", "Mitsubishi", "Nissan", "Pagani", "Peugeot", "Porsche", "Ram", "Renault",
  "Rolls-Royce", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo", "Other"
];

const PostVehicle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const isRentable = location.state?.isRentable || false;

  const [formData, setFormData] = useState({
    title: "", make: "", model: "", year: "", price: "", mileage: "",
    fuel_type: "", transmission: "", condition: "", location: "", description: ""
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = [...images, ...filesArray].slice(0, 8);
      setImages(newImages);
      const newPreviews = newImages.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index: number) => {
    setImages(currentImages => currentImages.filter((_, i) => i !== index));
    setImagePreviews(currentPreviews => currentPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
        return;
    }
    
    let uploadedImageUrls: string[] = [];

    if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach(image => {
            imageFormData.append('images', image);
        });

        try {
            const uploadResponse = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: imageFormData,
            });

            if (!uploadResponse.ok) throw new Error("Image upload failed");
            
            const uploadResult = await uploadResponse.json();
            uploadedImageUrls = uploadResult.urls;

        } catch (error) {
            console.error("Error uploading images:", error);
            toast({ title: "Error", description: "Could not upload images.", variant: "destructive" });
            return;
        }
    }

    const submissionData = {
        ...formData,
        is_rentable: isRentable,
        images: uploadedImageUrls,
    };

    try {
        const response = await fetch('http://localhost:3001/api/vehicles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) throw new Error("Failed to post vehicle. Please check all fields.");

        toast({ title: "Submitted!", description: "Your vehicle has been submitted for approval." }); // NEW
        navigate('/dashboard');
    } catch (error) {
        console.error("Error posting vehicle:", error);
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
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
                    <div className="space-y-2">
                        <Label htmlFor="title">Ad Title</Label>
                        <Input id="title" name="title" onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">{isRentable ? "Price per Day (LKR)" : "Price (LKR)"}</Label>
                        <Input id="price" name="price" type="number" onChange={handleInputChange} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Select name="make" onValueChange={(value) => handleSelectChange("make", value)}>
                      <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                      <SelectContent>
                        {/* Map over the carMakes array to create dropdown items */}
                        {carMakes.sort().map((make) => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" name="model" onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input id="year" name="year" type="number" onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage (km)</Label>
                      <Input id="mileage" name="mileage" type="number" onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuel_type">Fuel Type</Label>
                      <Select name="fuel_type" onValueChange={(value) => handleSelectChange("fuel_type", value)}><SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger><SelectContent>
                          <SelectItem value="Petrol">Petrol</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                      </SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transmission">Transmission</Label>
                      <Select name="transmission" onValueChange={(value) => handleSelectChange("transmission", value)}><SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger><SelectContent>
                          <SelectItem value="Automatic">Automatic</SelectItem>
                          <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent></Select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <Select name="condition" onValueChange={(value) => handleSelectChange("condition", value)}><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger><SelectContent>
                            <SelectItem value="Used">Used</SelectItem>
                            <SelectItem value="Brand New">Brand New</SelectItem>
                            <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                        </SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" onChange={handleInputChange} required />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" onChange={handleInputChange} rows={5} required />
                </div>

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