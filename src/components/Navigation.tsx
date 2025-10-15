
import { useState } from "react";
import { Car, Menu, User, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">CarNeeds.lk</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Buy
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Sell
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Rent
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Finance
            </a>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              About
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" className="relative">
                  <MessageCircle className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-orange-500">
                    3
                  </Badge>
                </Button>
                <Link to="/post-vehicle">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Vehicle
                  </Button>
                </Link>
                <Button variant="ghost">
                  <User className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Buy</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Sell</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Rent</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Finance</a>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
              
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {isLoggedIn ? (
                  <>
                    <Link to="/post-vehicle">
                      <Button className="bg-orange-500 hover:bg-orange-600 justify-start w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Post Vehicle
                      </Button>
                    </Link>
                    <Button variant="ghost" className="justify-start">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages (3)
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" className="justify-start w-full">Login</Button>
                    </Link>
                    <Link to="/signup">
                      <Button className="bg-blue-600 hover:bg-blue-700 justify-start w-full">Sign Up</Button>
                    </Link>
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
