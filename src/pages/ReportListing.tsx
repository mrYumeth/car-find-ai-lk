// src/pages/ReportListing.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Simplified vehicle interface for this page
interface VehicleStub {
  id: number;
  title: string;
  seller_id: number;
  image?: string; // Expecting the full URL
}

const ReportListing = () => {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<VehicleStub | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      toast({ title: "Error", description: "You must be logged in to report a listing.", variant: "destructive" });
      navigate('/login');
      return;
    }
    setToken(storedToken);

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user profile to check ID
        const profileRes = await fetch('http://localhost:3001/api/profile', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!profileRes.ok) throw new Error("Failed to fetch user profile.");
        const profile = await profileRes.json();
        setLoggedInUserId(profile.id);

        // Fetch vehicle data
        const vehicleRes = await fetch(`http://localhost:3001/api/vehicles/${vehicleId}`);
        if (!vehicleRes.ok) throw new Error("Failed to fetch vehicle details.");
        const vehicleData = await vehicleRes.json();
        
        setVehicle({
          id: vehicleData.id,
          title: vehicleData.title,
          seller_id: vehicleData.seller_id,
          image: vehicleData.images?.[0]?.image_url || "/placeholder.svg"
        });

      } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vehicleId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast({ title: "Error", description: "Please select a reason for the report.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: parseInt(vehicleId!),
          reason: reason,
          description: description
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to submit report.");
      }

      toast({ title: "Success", description: "Your report has been submitted." });
      navigate(`/vehicle/${vehicleId}`); // Navigate back to the listing

    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-8" />
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-1/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Check if user is the seller
  const isSeller = loggedInUserId === vehicle?.seller_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Report Listing</h1>
        <p className="text-muted-foreground mb-6">You are reporting the listing:</p>
        
        <Link to={`/vehicle/${vehicleId}`} className="block mb-6">
          <Card className="flex items-center gap-4 p-4 hover:bg-accent">
            <img 
              src={vehicle?.image} 
              alt={vehicle?.title} 
              className="w-24 h-16 object-cover rounded"
            />
            <div>
              <h3 className="font-semibold">{vehicle?.title}</h3>
              <p className="text-sm text-muted-foreground">Vehicle ID: {vehicle?.id}</p>
            </div>
          </Card>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isSeller ? (
              <p className="text-red-600 font-medium">You cannot report your own listing.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for reporting</Label>
                  <Select onValueChange={setReason} value={reason} required>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Misleading Information">Misleading Information</SelectItem>
                      <SelectItem value="Fraudulent Listing">Fraudulent Listing</SelectItem>
                      <SelectItem value="Item is Sold">Item is Sold</SelectItem>
                      <SelectItem value="Spam">Spam</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description (optional)
                    <span className="text-sm text-muted-foreground ml-2">
                      Please provide more details.
                    </span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="This listing is misleading because..."
                    rows={5}
                  />
                </div>
                
                <Button type="submit" disabled={isSubmitting || loading || !reason}>
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportListing;