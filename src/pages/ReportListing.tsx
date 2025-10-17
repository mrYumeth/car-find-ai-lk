import { useState } from "react";
import { Flag, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { useNavigate } from "react-router-dom";

const ReportListing = () => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [listingId, setListingId] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason || !description || !listingId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Submitted",
      description: "Thank you for your report. Our team will review it shortly.",
    });

    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Flag className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Report a Listing</h1>
            <p className="text-muted-foreground">
              Help us maintain a safe and trustworthy marketplace
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Listing ID */}
                <div className="space-y-2">
                  <Label htmlFor="listingId">
                    Listing ID or URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="listingId"
                    placeholder="e.g., VEH-12345 or paste listing URL"
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                    required
                  />
                </div>

                {/* Reason */}
                <div className="space-y-3">
                  <Label>
                    Reason for Report <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={reason} onValueChange={setReason} required>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="fraudulent" id="fraudulent" />
                      <Label htmlFor="fraudulent" className="cursor-pointer flex-1">
                        Fraudulent or Scam Listing
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="misleading" id="misleading" />
                      <Label htmlFor="misleading" className="cursor-pointer flex-1">
                        Misleading Information
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="duplicate" id="duplicate" />
                      <Label htmlFor="duplicate" className="cursor-pointer flex-1">
                        Duplicate Listing
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="inappropriate" id="inappropriate" />
                      <Label htmlFor="inappropriate" className="cursor-pointer flex-1">
                        Inappropriate Content
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="stolen" id="stolen" />
                      <Label htmlFor="stolen" className="cursor-pointer flex-1">
                        Suspected Stolen Vehicle
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="cursor-pointer flex-1">
                        Other
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Detailed Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide specific details about why you're reporting this listing..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 20 characters. Be as specific as possible to help our review team.
                  </p>
                </div>

                {/* Evidence Upload */}
                <div className="space-y-2">
                  <Label htmlFor="evidence">
                    Evidence (Optional)
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload screenshots or documents
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, PDF up to 5MB
                    </p>
                    <Input
                      id="evidence"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                  </div>
                </div>

                {/* Important Notice */}
                <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Important Notice</p>
                    <p>
                      False reports may result in account suspension. All reports are reviewed
                      by our team within 24-48 hours.
                    </p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    Submit Report
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">What happens after I submit a report?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">1. Review Process</h4>
                <p className="text-sm text-muted-foreground">
                  Our team reviews all reports within 24-48 hours
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">2. Investigation</h4>
                <p className="text-sm text-muted-foreground">
                  We investigate the reported listing and contact the seller if needed
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">3. Action Taken</h4>
                <p className="text-sm text-muted-foreground">
                  Appropriate action is taken, including listing removal or seller suspension
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">4. Notification</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive an email update on the outcome of your report
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportListing;