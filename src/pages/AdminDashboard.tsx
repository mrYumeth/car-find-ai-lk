// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
// **Added AlertTriangle and Check icons**
import { Users, Car, Flag, CheckCircle, Edit, Trash2, Search, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";


// --- Define types for API data ---
interface User { /* ... User interface ... */
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: 'buyer' | 'seller' | 'admin';
  created_at: string;
}

interface Listing { /* ... Listing interface ... */
   id: number;
   title: string;
   description: string;
   price: string;
   make: string;
   model: string;
   year: number;
   mileage: number;
   fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'Other';
   transmission: 'Manual' | 'Automatic';
   location: string;
   is_rentable: boolean;
   created_at: string;
   user_id: number;
   owner_username: string;
   image?: string | null;
   condition?: string;
}

// **NEW Report interface**
interface Report {
  id: number;
  reason: string;
  description: string;
  created_at: string;
  vehicle_id: number;
  vehicle_title: string;
  reporter_username: string;
}

interface EditingUserState { /* ... EditingUserState ... */
    id: number;
    username: string;
    email: string;
    phone: string | null;
    role: 'buyer' | 'seller' | 'admin';
    created_at: string;
}

interface EditingListingState extends Omit<Listing, 'owner_username' | 'created_at' | 'user_id'> {
    // ...
}


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [activeUserTab, setActiveUserTab] = useState("sellers");
  const [activeListingTab, setActiveListingTab] = useState("forSale");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]); // **NEW**
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false); // **NEW**
  const { toast } = useToast();
  const navigate = useNavigate();

  // State for Edit User modal
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);

  // State for Edit Listing modal
  const [isEditListingDialogOpen, setIsEditListingDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<EditingListingState | null>(null);


  // --- Fetch Users Function ---
  const fetchUsers = async () => { /* ... fetchUsers ... */
    setLoadingUsers(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
           if (response.status === 403) throw new Error("Access Forbidden: Admins only.");
           throw new Error("Failed to fetch users");
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      if ((error as Error).message.includes("Forbidden")) { navigate('/'); }
    } finally {
      setLoadingUsers(false);
    }
  };


  // --- Fetch Listings Function ---
  const fetchListings = async () => { /* ... fetchListings ... */
        setLoadingListings(true);
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        try {
            const response = await fetch('http://localhost:3001/api/admin/vehicles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 if (response.status === 403) throw new Error("Access Forbidden: Admins only.");
                throw new Error("Failed to fetch listings");
            }
            const data: Listing[] = await response.json();
            setListings(data);
        } catch (error) {
            console.error("Error fetching listings:", error);
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
             if ((error as Error).message.includes("Forbidden")) { navigate('/'); }
        } finally {
            setLoadingListings(false);
        }
    };

  // **NEW: Fetch Reports Function**
  const fetchReports = async () => {
    setLoadingReports(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
        const response = await fetch('http://localhost:3001/api/admin/reports', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
             if (response.status === 403) throw new Error("Access Forbidden: Admins only.");
            throw new Error("Failed to fetch reports");
        }
        const data: Report[] = await response.json();
        setReports(data);
    } catch (error) {
        console.error("Error fetching reports:", error);
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
         if ((error as Error).message.includes("Forbidden")) { navigate('/'); }
    } finally {
        setLoadingReports(false);
    }
  };


  // --- **MODIFIED** Fetch data ---
  useEffect(() => {
    // Fetch all data needed for the dashboard stats on initial load
    fetchUsers();
    fetchListings();
    fetchReports(); // **NEW**
  }, []); // Empty dependency array [] means this runs only ONCE on mount


  // --- User Edit/Delete Handlers ---
  const handleDeleteUser = async (userId: number, username: string) => { /* ... handleDeleteUser ... */ 
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to delete user.");
      }
      toast({ title: "Success", description: `User ${username} deleted.` });
      setUsers(currentUsers => currentUsers.filter(user => user.id !== userId));
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };
  const handleEditUserClick = (user: User) => { /* ... handleEditUserClick ... */
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... handleEditInputChange ... */
      if (!editingUser) return;
      setEditingUser({ ...editingUser, [e.target.id]: e.target.value });
  };
  const handleEditRoleChange = (value: User['role']) => { /* ... handleEditRoleChange ... */
       if (!editingUser) return;
       setEditingUser({ ...editingUser, role: value });
  };
  const handleSaveUser = async () => { /* ... handleSaveUser ... */ 
    if (!editingUser) return;
    const token = localStorage.getItem('token');
    if (!token) {
        toast({ title: "Error", description: "Authentication token missing.", variant: "destructive" });
        return;
    }
    try {
        const response = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                username: editingUser.username,
                email: editingUser.email,
                phone: editingUser.phone,
                role: editingUser.role
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to update user.");
        }
        const updatedUserFromServer = await response.json();
        setUsers(currentUsers =>
            currentUsers.map(u => (u.id === updatedUserFromServer.id ? updatedUserFromServer : u))
        );
        toast({ title: "Success", description: `User ${updatedUserFromServer.username} updated.` });
        setIsEditDialogOpen(false);
        setEditingUser(null);
    } catch (error) {
        toast({ title: "Error Updating User", description: (error as Error).message, variant: "destructive" });
    }
  };


  // --- Listing Edit/Delete Handlers ---
  
  // **MODIFIED** handleDeleteListing to also update reports state
  const handleDeleteListing = async (listingId: number, title: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:3001/api/admin/vehicles/${listingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to delete listing.");
            }
            toast({ title: "Success", description: `Listing "${title}" deleted.` });
            
            // Update local listings state
            setListings(currentListings => currentListings.filter(listing => listing.id !== listingId));
            
            // **NEW**: Also remove any reports associated with this deleted listing from local state
            // This works because the DB cascade deletes the report, so we just sync the UI
            setReports(currentReports => currentReports.filter(report => report.vehicle_id !== listingId));

        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };
  const handleEditListingClick = (listing: Listing) => { /* ... handleEditListingClick ... */ 
    const { owner_username, created_at, user_id, ...editableFields } = listing;
    setEditingListing(editableFields); 
    setIsEditListingDialogOpen(true);
  };
  const handleEditListingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { /* ... handleEditListingInputChange ... */
      if (!editingListing) return;
      const { id, value, type } = e.target;
      const newValue = type === 'number' ? (value === '' ? null : parseFloat(value)) : value;
      setEditingListing({ ...editingListing, [id]: newValue });
  };
  const handleEditListingSelectChange = (name: string, value: string) => { /* ... handleEditListingSelectChange ... */
       if (!editingListing) return;
       setEditingListing({ ...editingListing, [name]: value as any });
  };
  const handleEditListingSwitchChange = (checked: boolean) => { /* ... handleEditListingSwitchChange ... */
      if (!editingListing) return;
      setEditingListing({ ...editingListing, is_rentable: checked });
  };
  const handleSaveListing = async () => { /* ... handleSaveListing ... */
    if (!editingListing) return;
    const token = localStorage.getItem('token');
    if (!token) {
        toast({ title: "Error", description: "Authentication token missing.", variant: "destructive" });
        return;
    }
    try {
        const { image, condition, ...payload } = editingListing;
        const response = await fetch(`http://localhost:3001/api/admin/vehicles/${editingListing.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to update listing.");
        }
        const updatedListingFromServer: Listing = await response.json(); 
        setListings(currentListings =>
            currentListings.map(l => (l.id === updatedListingFromServer.id ? updatedListingFromServer : l))
        );
        toast({ title: "Success", description: `Listing "${updatedListingFromServer.title}" updated.` });
        setIsEditListingDialogOpen(false);
        setEditingListing(null);
    } catch (error) {
        toast({ title: "Error Updating Listing", description: (error as Error).message, variant: "destructive" });
    }
  };

  // **NEW: Report Handlers**
  const handleDismissReport = async (reportId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3001/api/admin/reports/${reportId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to dismiss report.");
        }
        toast({ title: "Success", description: "Report dismissed." });
        // Update local reports state
        setReports(currentReports => currentReports.filter(report => report.id !== reportId));
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  // This function now just calls the modified handleDeleteListing
  const handleRemoveListingAndReport = async (listingId: number, title: string) => {
      // The handleDeleteListing function will now also clear the report from local state
      await handleDeleteListing(listingId, title);
  };


  // --- Filter Logic & Grouping ---
  const filteredUsers = users.filter(
    user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sellers = filteredUsers.filter(u => u.role === 'seller');
  const buyers = filteredUsers.filter(u => u.role === 'buyer');
  const admins = filteredUsers.filter(u => u.role === 'admin');

  const filteredListings = listings.filter(
    listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.owner_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (listing.make && listing.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (listing.model && listing.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (listing.location && listing.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
  const listingsForSale = filteredListings.filter(l => !l.is_rentable);
  const listingsForRent = filteredListings.filter(l => l.is_rentable);

  // **NEW: Filtered Reports**
  const filteredReports = reports.filter(report =>
      report.vehicle_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // --- Format Date Helper ---
   const formatDate = (dateString: string) => {
     try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
     catch (e) { return 'Invalid Date'; }
   };

    // --- Render User List Helper ---
    const renderUserList = (userList: User[]) => ( /* ... renderUserList ... */
        <div className="space-y-0">
            {userList.length === 0 ? (
                <p className="p-4 text-muted-foreground">
                    No users found in this category{searchTerm ? " matching your search" : ""}.
                </p>
             ) : (
             userList.map((user) => (
                <div key={user.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border-t first:border-t-0 hover:bg-accent">
                    <Avatar className="mt-1 md:mt-0">
                        <AvatarFallback>{user.username?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{user.username}</h4>
                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'seller' ? 'secondary' : 'outline'}>
                            {user.role}
                        </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone || 'No phone'}</p>
                    </div>
                    <div className="text-left md:text-right mt-2 md:mt-0">
                        <p className="text-xs text-muted-foreground">Joined {formatDate(user.created_at)}</p>
                    </div>
                    <div className="flex gap-2 self-start md:self-center">
                        <Button variant="outline" size="sm" onClick={() => handleEditUserClick(user)} disabled={user.role === 'admin'}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={user.role === 'admin'}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user '{user.username}'
                                    and all associated data (including their listings).
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.username)}>
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )))}
        </div>
    );
    
    // --- Render Listing List Helper ---
    const renderListingList = (listingList: Listing[]) => ( /* ... renderListingList ... */
       <div className="space-y-4 p-4">
            {listingList.length === 0 ? (
                <p className="text-muted-foreground">
                    No listings found in this category{searchTerm ? " matching your search" : ""}.
                </p>
             ) : (
             listingList.map((listing) => (
                <div key={listing.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-lg hover:bg-accent">
                    <img
                        src={listing.image ? `http://localhost:3001${listing.image}` : "/placeholder.svg"}
                        alt={listing.title}
                        className="w-full md:w-20 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{listing.title}</h4>
                            <Badge variant={listing.is_rentable ? 'secondary' : 'default'}>
                                {listing.is_rentable ? 'Rent' : 'Sale'}
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-blue-600">Rs. {listing.price}</p>
                        <p className="text-sm text-muted-foreground">Owner: {listing.owner_username} (ID: {listing.user_id})</p>
                        <p className="text-xs text-muted-foreground">Posted: {formatDate(listing.created_at)}</p>
                    </div>
                    <div className="flex gap-2 self-start md:self-center">
                        <Button variant="outline" size="sm" onClick={() => handleEditListingClick(listing)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/vehicle/${listing.id}`)}>View</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the listing "{listing.title}"
                                        and all associated data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteListing(listing.id, listing.title)}>
                                        Delete Listing
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )))}
        </div>
    );


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users, listings, and reports</p>
            </div>

            {/* --- Stats Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-muted-foreground">Total Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Car className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{listings.length}</div>
                  <div className="text-muted-foreground">Total Listings</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Flag className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  {/* **MODIFIED** Report Count */}
                  <div className="text-2xl font-bold">{reports.length}</div>
                  <div className="text-muted-foreground">Pending Reports</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">N/A</div> 
                  <div className="text-muted-foreground">Approval Rate</div>
                </CardContent>
              </Card>
            </div>
            {/* --- End Stats Cards --- */}


          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users ({filteredUsers.length})</TabsTrigger>
              <TabsTrigger value="listings">Listings ({filteredListings.length})</TabsTrigger>
              {/* **MODIFIED** Report Count */}
              <TabsTrigger value="reports">Reports ({filteredReports.length})</TabsTrigger>
            </TabsList>

            {/* --- Users Tab (with nested tabs) --- */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Management</CardTitle>
                    <div className="w-64 relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                   {loadingUsers ? <div className="p-4">Loading users...</div> :
                   (
                    <Tabs value={activeUserTab} onValueChange={setActiveUserTab} className="w-full">
                       <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                           <TabsTrigger value="sellers">Sellers ({sellers.length})</TabsTrigger>
                           <TabsTrigger value="buyers">Buyers ({buyers.length})</TabsTrigger>
                           <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
                       </TabsList>
                       <TabsContent value="sellers"> {renderUserList(sellers)} </TabsContent>
                       <TabsContent value="buyers"> {renderUserList(buyers)} </TabsContent>
                       <TabsContent value="admins"> {renderUserList(admins)} </TabsContent>
                    </Tabs>
                   )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Listings Tab --- */}
            <TabsContent value="listings" className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Listing Management</CardTitle>
                            <div className="w-64 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search listings..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0"> 
                        <div className="space-y-0">
                            {loadingListings ? <p className="p-4">Loading listings...</p> :
                                (
                                <Tabs value={activeListingTab} onValueChange={setActiveListingTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                                        <TabsTrigger value="forSale">For Sale ({listingsForSale.length})</TabsTrigger>
                                        <TabsTrigger value="forRent">For Rent ({listingsForRent.length})</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="forSale"> {renderListingList(listingsForSale)} </TabsContent>
                                    <TabsContent value="forRent"> {renderListingList(listingsForRent)} </TabsContent>
                                </Tabs>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* **NEW** Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
                 <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Report Management</CardTitle>
                         <div className="w-64 relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loadingReports ? <p>Loading reports...</p> :
                         filteredReports.length === 0 ? <p className="text-muted-foreground">No reports found{searchTerm ? " matching your search" : ""}.</p> :
                         filteredReports.map((report) => (
                           <div key={report.id} className="p-4 border rounded-lg hover:bg-accent">
                             <div className="flex justify-between items-start mb-3">
                               <div>
                                 <div className="flex items-center gap-2 mb-1">
                                   <AlertTriangle className="h-5 w-5 text-orange-500" />
                                   <h4 className="font-semibold">{report.vehicle_title}</h4>
                                 </div>
                                 <p className="text-sm text-muted-foreground ml-7">
                                   Reported by: <span className="font-medium">{report.reporter_username}</span> on {formatDate(report.created_at)}
                                 </p>
                               </div>
                               <Badge variant="destructive">{report.reason}</Badge>
                             </div>
                             
                             {report.description && (
                               <div className="mb-4 ml-7">
                                 <p className="text-sm text-muted-foreground">{report.description}</p>
                               </div>
                             )}

                             <div className="flex flex-wrap gap-2 ml-7">
                               {/* Alert Dialog for Removing Listing */}
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Remove Listing
                                    </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the listing "{report.vehicle_title}"
                                        and all associated reports. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRemoveListingAndReport(report.vehicle_id, report.vehicle_title)}>
                                        Yes, Remove Listing
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                               </AlertDialog>

                               {/* Alert Dialog for Dismissing Report */}
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Check className="h-4 w-4 mr-1" />
                                      Dismiss Report
                                    </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will dismiss the report, but the listing will remain active.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDismissReport(report.id)}>
                                        Yes, Dismiss Report
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                               </AlertDialog>
                               
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/vehicle/${report.vehicle_id}`)}>
                                  View Listing
                                </Button>
                             </div>
                           </div>
                         ))
                        }
                      </div>
                    </CardContent>
                 </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* --- Edit User Dialog --- */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
           <DialogContent className="sm:max-w-[425px]">
                {/* ... Edit User Dialog (no change) ... */}
                <DialogHeader>
                    <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
                    <DialogDescription>
                        Modify user details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                {editingUser && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="id" className="text-right">ID</Label><Input id="id" value={editingUser.id} readOnly className="col-span-3 bg-muted" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="username" className="text-right">Username</Label><Input id="username" value={editingUser.username} onChange={handleEditInputChange} className="col-span-3"/></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="email" className="text-right">Email</Label><Input id="email" type="email" value={editingUser.email} onChange={handleEditInputChange} className="col-span-3"/></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone" className="text-right">Phone</Label><Input id="phone" value={editingUser.phone || ""} onChange={handleEditInputChange} className="col-span-3"/></div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Role</Label>
                            <Select value={editingUser.role} onValueChange={handleEditRoleChange}>
                                <SelectTrigger id="role" className="col-span-3"><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="buyer">Buyer</SelectItem>
                                    <SelectItem value="seller">Seller</SelectItem>
                                    <SelectItem value="admin" disabled>Admin</SelectItem> 
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSaveUser}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>

       {/* --- Edit Listing Dialog --- */}
       <Dialog open={isEditListingDialogOpen} onOpenChange={setIsEditListingDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                {/* ... Edit Listing Dialog (no change) ... */}
                <DialogHeader>
                    <DialogTitle>Edit Listing: {editingListing?.title}</DialogTitle>
                    <DialogDescription>
                        Modify listing details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                {editingListing && (
                    <div className="grid gap-4 py-4">
                        
                        <div className="w-full h-48 mb-2 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={editingListing.image ? `http://localhost:3001${editingListing.image}` : "/placeholder.svg"}
                            alt={editingListing.title || 'Listing image'}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Title</Label><Input id="title" value={editingListing.title} onChange={handleEditListingInputChange} className="col-span-3"/></div>
                        <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="description" className="text-right pt-2">Description</Label><Textarea id="description" value={editingListing.description || ""} onChange={handleEditListingInputChange} className="col-span-3" rows={4}/></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="price" className="text-right">Price (Rs.)</Label><Input id="price" type="number" value={editingListing.price} onChange={handleEditListingInputChange} className="col-span-3"/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="make" className="text-right">Make</Label><Input id="make" value={editingListing.make || ""} onChange={handleEditListingInputChange} className="col-span-3"/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="model" className="text-right">Model</Label><Input id="model" value={editingListing.model || ""} onChange={handleEditListingInputChange} className="col-span-3"/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="year" className="text-right">Year</Label><Input id="year" type="number" value={editingListing.year || ""} onChange={handleEditListingInputChange} className="col-span-3"/></div>
                         <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="mileage" className="text-right">Mileage (km)</Label><Input id="mileage" type="number" value={editingListing.mileage || ""} onChange={handleEditListingInputChange} className="col-span-3"/></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="location" className="text-right">Location</Label><Input id="location" value={editingListing.location || ""} onChange={handleEditListingInputChange} className="col-span-3"/></div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fuel_type" className="text-right">Fuel Type</Label>
                            <Select value={editingListing.fuel_type || undefined} onValueChange={(value) => handleEditListingSelectChange('fuel_type', value)}>
                                <SelectTrigger id="fuel_type" className="col-span-3"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Petrol">Petrol</SelectItem>
                                    <SelectItem value="Diesel">Diesel</SelectItem>
                                    <SelectItem value="Electric">Electric</SelectItem>
                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="transmission" className="text-right">Transmission</Label>
                            <Select value={editingListing.transmission || undefined} onValueChange={(value) => handleEditListingSelectChange('transmission', value)}>
                                <SelectTrigger id="transmission" className="col-span-3"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manual">Manual</SelectItem>
                                    <SelectItem value="Automatic">Automatic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="is_rentable" className="text-right">For Rent</Label>
                            <Switch id="is_rentable" checked={editingListing.is_rentable} onCheckedChange={handleEditListingSwitchChange} />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" onClick={() => setEditingListing(null)}>Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSaveListing}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
};

export default AdminDashboard;