import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, User, Car } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import ChatModal from '@/components/ChatModal';
import { Badge } from '@/components/ui/badge'; // Import the Badge component

interface ChatSummary {
  id: number;
  vehicle_id: number;
  vehicle_title: string;
  other_user_name: string;
  other_user_id: number;
  last_message: string;
  created_at: string;
  unread_count: string; // From the COUNT(*) query, which returns a string
}

const ChatPage = () => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // This function is now used to refresh the list
  const fetchChats = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }
    try {
        const response = await fetch('http://localhost:3001/api/chats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch chats');
        const data: ChatSummary[] = await response.json();
        setChats(data);
    } catch (error) {
        toast({ title: "Error", description: `Could not load messages: ${(error as Error).message}`, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []); // Only run on initial component mount

  const filteredChats = chats.filter(chat => 
    chat.other_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.vehicle_title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleChatClose = () => {
    setSelectedChat(null);
    fetchChats(); // Refresh chat list on close to show latest message
  };

  const handleSelectChat = (chat: ChatSummary) => {
    setSelectedChat(chat);
    // Optimistically set the unread count to 0 in the UI
    setChats(prevChats => 
        prevChats.map(c => 
            c.id === chat.id ? { ...c, unread_count: "0" } : c
        )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-blue-600" /> Messaging Hub
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
          {/* Left Column: Chat List */}
          <div className="md:col-span-1 flex flex-col">
            <Card className="flex-1 shadow-lg">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Input 
                      placeholder="Search conversations..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-8"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className='p-4 text-center text-gray-500'>Loading chats...</div>
                  ) : filteredChats.length === 0 ? (
                    <div className='p-4 text-center text-gray-500'>No conversations started.</div>
                  ) : (
                    filteredChats.map((chat) => (
                      <div 
                        key={chat.id}
                        className={`flex items-center gap-3 p-4 border-b cursor-pointer hover:bg-gray-100 ${selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-orange-500 text-white">{chat.other_user_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <p className="font-semibold truncate">{chat.other_user_name}</p>
                          {/* Make last message bold if unread */}
                          <p className={`text-sm truncate ${Number(chat.unread_count) > 0 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                              {chat.last_message || `Regarding: ${chat.vehicle_title}`}
                          </p>
                        </div>
                        {/* Show unread count badge */}
                        {Number(chat.unread_count) > 0 && (
                          <Badge className="bg-orange-500 text-white h-6 w-6 flex items-center justify-center p-0 rounded-full">
                              {chat.unread_count}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Chat Window */}
          <div className="md:col-span-2">
            <Card className="h-full shadow-lg">
              <CardContent className="p-0 h-full">
                {selectedChat ? (
                  <ChatModal 
                    initialChatId={selectedChat.id}
                    sellerName={selectedChat.other_user_name}
                    vehicleTitle={selectedChat.vehicle_title}
                    sellerContact={"Viewed from Chat Hub"}
                    initialReceiverId={selectedChat.other_user_id}
                    initialVehicleId={selectedChat.vehicle_id}
                    isOpen={true} 
                    onClose={handleChatClose}
                    onMessageSent={fetchChats}
                  >
                    {/* FIX: Supplying the required 'children' prop with an invisible placeholder */}
                    <div style={{ display: 'none' }} />
                  </ChatModal>
                ) : (
                  <div className='h-full flex flex-col justify-center items-center text-gray-500'>
                    <MessageCircle className='h-12 w-12 mb-3' />
                    <p className='text-lg'>Select a conversation to start chatting.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;