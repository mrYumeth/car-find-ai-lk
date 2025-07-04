
import { useState } from "react";
import { Car, Upload, MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";

const PostVehicle = () => {
  const [formData, setFormData] = useState({
    title: "",
    make: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    fuel: "",
    transmission: "",
    condition: "",
    location: "",
    description: "",
    contact: ""
  });

  const [images, setImages] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageUpload = () => {
    // Simulate image upload
    setImages([...images, "/placeholder.svg"]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Vehicle posting:", formData, images);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Post Your Vehicle</h1>
            <p className="text-gray-600 text-lg">Reach thousands of potential buyers across Sri Lanka</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Car className="h-6 w-6 text-blue-600" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Vehicle Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Toyota Prius 2019"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (LKR)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="e.g., 4500000"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Select onValueChange={(value) => handleSelectChange("make", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toyota">Toyota</SelectItem>
                        <SelectItem value="honda">Honda</SelectItem>
                        <SelectItem value="nissan">Nissan</SelectItem>
                        <SelectItem value="suzuki">Suzuki</SelectItem>
                        <SelectItem value="mazda">Mazda</SelectItem>
                        <SelectItem value="mitsubishi">Mitsubishi</SelectItem>
                        <SelectItem value="hyundai">Hyundai</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="e.g., Prius"
                      value={formData.model}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select onValueChange={(value) => handleSelectChange("year", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage (km)</Label>
                    <Input
                      id="mileage"
                      name="mileage"
                      type="number"
                      placeholder="e.g., 35000"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuel">Fuel Type</Label>
                    <Select onValueChange={(value) => handleSelectChange("fuel", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select onValueChange={(value) => handleSelectChange("transmission", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select onValueChange={(value) => handleSelectChange("condition", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand-new">Brand New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="reconditioned">Reconditioned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select onValueChange={(value) => handleSelectChange("location", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colombo">Colombo</SelectItem>
                        <SelectItem value="kandy">Kandy</SelectItem>
                        <SelectItem value="galle">Galle</SelectItem>
                        <SelectItem value="negombo">Negombo</SelectItem>
                        <SelectItem value="kurunegala">Kurunegala</SelectItem>
                        <SelectItem value="anuradhapura">Anuradhapura</SelectItem>
                        <SelectItem value="jaffna">Jaffna</SelectItem>
                        <SelectItem value="batticaloa">Batticaloa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <Label>Vehicle Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Vehicle ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {images.length < 8 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center"
                        onClick={handleImageUpload}
                      >
                        <Plus className="h-6 w-6 mb-1" />
                        <span className="text-xs">Add Photo</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Add up to 8 high-quality photos of your vehicle</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your vehicle's condition, features, and any additional information..."
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    name="contact"
                    placeholder="e.g., +94 77 123 4567"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Pricing Info */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Pricing Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Basic Listing (7 days)</p>
                      <p className="text-gray-600">FREE</p>
                    </div>
                    <div>
                      <p className="font-medium">Featured Listing (30 days)</p>
                      <p className="text-gray-600">LKR 2,500</p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1 h-12 bg-blue-600 hover:bg-blue-700">
                    Post Vehicle (Free)
                  </Button>
                  <Button type="button" className="flex-1 h-12 bg-orange-500 hover:bg-orange-600">
                    Post as Featured (LKR 2,500)
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostVehicle;
