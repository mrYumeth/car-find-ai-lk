// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { Users, Car, Flag, CheckCircle, XCircle, Edit, Trash2, Search } from "lucide-react";
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
// Import Dialog components for editing
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


// Define types for API data
interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: 'buyer' | 'seller' | 'admin'; // Make role more specific
  created_at: string;
  // Add other fields if your API returns them
}

interface Listing {
   id: number;
   title: string;
   owner_username: string;
   price: string;
   status?: string;
   created_at: string;
   image?: string | null;
   is_rentable: boolean;
   user_id: number;
   make?: string;
   model?: string;
   location?: string;
}

interface Report { // Placeholder
  id: number;
  listingTitle: string;
  reportedBy: string;
  reason: string;
  description: string;
  status: string;
  reportDate: string;
}

// State for the user being edited in the modal
// Use Partial<User> to make fields optional during editing state
interface EditingUserState {
    id: number;
    username: string;
    email: string;
    phone: string | null;
    role: 'buyer' | 'seller' | 'admin';
    created_at: string; // Keep created_at for full User type compatibility
}


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [activeUserTab, setActiveUserTab] = useState("sellers"); // State for nested user tabs
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports] = useState<Report[]>([]); // Placeholder
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // State for the edit modal
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);

  // --- Fetch Users Function ---
  const fetchUsers = async () => { /* ... fetchUsers remains the same ... */
    setLoadingUsers(true);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
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
      if ((error as Error).message.includes("Forbidden")) {
        navigate('/'); // Redirect non-admins
      }
    } finally {
      setLoadingUsers(false);
    }
  };


  // --- Fetch Listings Function ---
  const fetchListings = async () => { /* ... fetchListings remains the same ... */
        setLoadingListings(true);
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
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
             if ((error as Error).message.includes("Forbidden")) {
               navigate('/'); // Redirect non-admins
             }
        } finally {
            setLoadingListings(false);
        }
    };


  // --- Fetch data when tab changes or component mounts ---
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "listings") {
       fetchListings();
    }
  }, [activeTab]);

  // --- Handle User Delete ---
  const handleDeleteUser = async (userId: number, username: string) => { /* ... handleDeleteUser remains the same ... */
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
      setUsers(currentUsers => currentUsers.filter(user => user.id !== userId)); // Update UI
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };


  // --- Handle Open Edit Modal ---
  const handleEditUserClick = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  // --- Handle Input Changes in Edit Modal ---
  // **FIX:** This handler now correctly maps the input's 'id' to the state key
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editingUser) return;
      // Use the input's 'id' (e.g., "username", "email") as the key
      setEditingUser({ ...editingUser, [e.target.id]: e.target.value });
  };

  // --- Handle Role Change in Edit Modal ---
  const handleEditRoleChange = (value: User['role']) => {
       if (!editingUser) return;
       setEditingUser({ ...editingUser, role: value });
  };


  // --- Handle Save User ---
  const handleSaveUser = async () => {
    if (!editingUser) return;
    const token = localStorage.getItem('token');
    if (!token) {
        toast({ title: "Error", description: "Authentication token missing.", variant: "destructive" });
        return;
    }
    
    // **NOTE:** Ensure your backend PUT /api/admin/users/:id endpoint is created
    // and accepts { username, email, phone, role } in the body.

    try {
        console.log("Attempting to save user:", editingUser);
        
        const response = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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
        
        const updatedUserFromServer = await response.json(); // Get the updated user from server
        
        // Update the user in the local state
        setUsers(currentUsers =>
            currentUsers.map(u => (u.id === updatedUserFromServer.id ? updatedUserFromServer : u))
        );

        toast({ title: "Success", description: `User ${updatedUserFromServer.username} updated.` });
        setIsEditDialogOpen(false); // Close the modal
        setEditingUser(null); // Clear editing state

    } catch (error) {
        toast({ title: "Error Updating User", description: (error as Error).message, variant: "destructive" });
    }
  };


  // --- Handle Listing Delete ---
  const handleDeleteListing = async (listingId: number, title: string) => { /* ... handleDeleteListing remains the same ... */
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
            setListings(currentListings => currentListings.filter(listing => listing.id !== listingId)); // Update UI
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

  // --- Filter Logic & User Grouping ---
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sellers = filteredUsers.filter(u => u.role === 'seller');
  const buyers = filteredUsers.filter(u => u.role === 'buyer');
  const admins = filteredUsers.filter(u => u.role === 'admin');

  const filteredListings = listings.filter( /* ... filtering logic remains the same ... */
    listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.owner_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (listing.make && listing.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (listing.model && listing.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (listing.location && listing.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );


  // --- Format Date Helper ---
   const formatDate = (dateString: string) => { /* ... formatDate remains the same ... */
     try {
       return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric', month: 'short', day: 'numeric'
       });
     } catch (e) {
       return 'Invalid Date';
     }
   };

    // --- **MODIFIED** Helper to Render User List (no title) ---
    const renderUserList = (userList: User[]) => (
        <div className="space-y-0"> {/* Container for border logic */}
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
                    {/* Actions */}
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users, listings, and reports</p>
            </div>

            {/* Stats Cards ... */}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users ({filteredUsers.length})</TabsTrigger>
              <TabsTrigger value="listings">Listings ({filteredListings.length})</TabsTrigger>
              <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
            </TabsList>

            {/* --- **MODIFIED** Users Tab --- */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Management</CardTitle>
                    <div className="w-64 relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0"> {/* Remove padding to allow nested tabs to fill */}
                   {loadingUsers ? <div className="p-4">Loading users...</div> :
                   (
                    // --- **NEW** Nested Tabs for User Roles ---
                    <Tabs value={activeUserTab} onValueChange={setActiveUserTab} className="w-full">
                       <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                           <TabsTrigger value="sellers">Sellers ({sellers.length})</TabsTrigger>
                           <TabsTrigger value="buyers">Buyers ({buyers.length})</TabsTrigger>
                           <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
                       </TabsList>
                       
                       <TabsContent value="sellers">
                           {renderUserList(sellers)}
                       </TabsContent>
                       
                       <TabsContent value="buyers">
                           {renderUserList(buyers)}
                       </TabsContent>

                       <TabsContent value="admins">
                           {renderUserList(admins)}
                       </TabsContent>
                    </Tabs>
                   )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Listings Tab */}
            <TabsContent value="listings" className="space-y-6">
                {/* ... Listings content remains the same ... */}
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
                    <CardContent>
                        <div className="space-y-4">
                            {loadingListings ? <p>Loading listings...</p> :
                                filteredListings.length === 0 ? <p>No listings found matching your search.</p> :
                                filteredListings.map((listing) => (
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
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
                    <CardContent><p>Report management UI will be built here.</p></CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* --- **MODIFIED** Edit User Dialog --- */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
                    <DialogDescription>
                        Modify user details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                {editingUser && (
                    <div className="grid gap-4 py-4">
                        {/* ID (Readonly) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id" className="text-right">ID</Label>
                            <Input id="id" value={editingUser.id} readOnly className="col-span-3 bg-muted" />
                        </div>
                        {/* Username */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">Username</Label>
                            <Input
                                id="username" // **FIX:** Changed ID to match state key
                                value={editingUser.username}
                                onChange={handleEditInputChange}
                                className="col-span-3"
                                // **FIX:** Removed readOnly
                            />
                        </div>
                        {/* Email */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input
                                id="email" // **FIX:** Changed ID to match state key
                                type="email"
                                value={editingUser.email}
                                onChange={handleEditInputChange}
                                className="col-span-3"
                                // **FIX:** Removed readOnly
                            />
                        </div>
                        {/* Phone */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input
                                id="phone" // **FIX:** Changed ID to match state key
                                value={editingUser.phone || ""}
                                onChange={handleEditInputChange}
                                className="col-span-3"
                                // **FIX:** Removed readOnly
                            />
                        </div>
                        {/* Role */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Role</Label>
                            <Select
                                value={editingUser.role}
                                onValueChange={handleEditRoleChange}
                            >
                                <SelectTrigger id="role" className="col-span-3">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
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
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveUser}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
};

export default AdminDashboard;