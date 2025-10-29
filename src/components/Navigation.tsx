import { useState, useEffect } from "react";
import { Car, Menu, User, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // ++ Import useToast

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast(); // ++ Initialize the toast hook

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
        setUserRole(payload.role);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsername(null);
    setUserRole(null);
    window.dispatchEvent(new Event('authChange')); // Ensure other components know
    
    // ++ Add toast notification
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // ++ End toast    
    navigate('/');
  };

  const getLogoPath = () => {
    if (userRole === 'seller') return '/dashboard';
    if (userRole === 'admin') return '/admin';
    return '/';
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo with dynamic link */}
          <Link to={getLogoPath()} className="flex items-center gap-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">CarNeeds.lk</span>
          </Link>

          {/* --- THIS SECTION IS MODIFIED --- */}
          {/* Desktop Navigation - Show only when NOT logged in */}
          {!isLoggedIn && (
            <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
            <span className="text-gray-600 font-medium cursor-default">Buy</span>
              <span className="text-gray-600 font-medium cursor-default">Sell</span>
              <span className="text-gray-600 font-medium cursor-default">Rent</span>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</Link>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-gray-700">Welcome, {username}!</span>
                <Link to="/chat">
                  <Button variant="ghost" className="relative">
                    <MessageCircle className="h-5 w-5" />
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-orange-500">3</Badge>
                  </Button>
                </Link>
                
                {(userRole === 'seller' || userRole === 'admin') && (
                  <Link to="/post-vehicle">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Post Vehicle
                    </Button>
                  </Link>
                )}

                <Link to="/profile">
                  <Button variant="ghost"><User className="h-5 w-5" /></Button>
                </Link>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" className="text-gray-700 hover:text-blue-600">Login</Button></Link>
                <Link to="/signup"><Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button></Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            ><Menu className="h-6 w-6" /></Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          // ... mobile menu code remains the same
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {!isLoggedIn && (
                <>
                  <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>Buy</Link>
                  <Link to="/post-vehicle" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>Sell</Link>
                  <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Rent</a>
                  <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>About</Link>
                </>
              )}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-2 text-sm font-medium text-gray-700">Welcome, {username}!</div>
                    {(userRole === 'seller' || userRole === 'admin') && (
                        <Link to="/post-vehicle" onClick={() => setIsMenuOpen(false)}>
                        <Button className="bg-orange-500 hover:bg-orange-600 justify-start w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Post Vehicle
                        </Button>
                        </Link>
                    )}
                    <Link to="/chat" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="justify-start w-full"><MessageCircle className="h-4 w-4 mr-2" />Messages (3)</Button>
                    </Link>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="justify-start w-full"><User className="h-4 w-4 mr-2" />Profile</Button>
                    </Link>
                    <Button variant="outline" onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="justify-start w-full">Logout</Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}><Button variant="ghost" className="justify-start w-full">Login</Button></Link>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}><Button className="bg-blue-600 hover:bg-blue-700 justify-start w-full">Sign Up</Button></Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;