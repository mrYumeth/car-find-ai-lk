import { useState } from "react";
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  vehicleTitle: string;
  online: boolean;
}

interface Message {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
}

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const chats: Chat[] = [
    {
      id: 1,
      name: "Saman Silva",
      lastMessage: "Is the vehicle still available?",
      timestamp: "10:30 AM",
      unread: 2,
      avatar: "/placeholder.svg",
      vehicleTitle: "Toyota Prius 2019",
      online: true
    },
    {
      id: 2,
      name: "Priya Fernando",
      lastMessage: "Can we arrange a viewing?",
      timestamp: "Yesterday",
      unread: 0,
      avatar: "/placeholder.svg",
      vehicleTitle: "Honda Vezel 2020",
      online: false
    },
    {
      id: 3,
      name: "Kamal Perera",
      lastMessage: "What's your best price?",
      timestamp: "2 days ago",
      unread: 1,
      avatar: "/placeholder.svg",
      vehicleTitle: "BMW X3 2021",
      online: true
    }
  ];

  const messages: Message[] = [
    {
      id: 1,
      senderId: 1,
      text: "Hello! I'm interested in your Toyota Prius 2019",
      timestamp: "10:15 AM"
    },
    {
      id: 2,
      senderId: 2,
      text: "Hi! Yes, it's still available. Would you like to know more details?",
      timestamp: "10:20 AM"
    },
    {
      id: 3,
      senderId: 1,
      text: "Is the vehicle still available?",
      timestamp: "10:30 AM"
    }
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  const selectedChatData = chats.find(chat => chat.id === selectedChat);
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.vehicleTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Messages</h1>
          
          <Card className="h-[calc(100vh-250px)] flex overflow-hidden">
            {/* Chat List Sidebar */}
            <div className={`w-full md:w-80 border-r bg-background ${selectedChat ? 'hidden md:block' : ''}`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-80px)]">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedChat === chat.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={chat.avatar} />
                          <AvatarFallback>{chat.name[0]}</AvatarFallback>
                        </Avatar>
                        {chat.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm truncate">{chat.name}</h4>
                          <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 truncate">{chat.vehicleTitle}</p>
                        <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      </div>
                      {chat.unread > 0 && (
                        <Badge className="bg-orange-500">{chat.unread}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : ''}`}>
              {selectedChatData ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-background flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedChat(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar>
                        <AvatarImage src={selectedChatData.avatar} />
                        <AvatarFallback>{selectedChatData.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedChatData.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedChatData.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-3 bg-blue-50 border-b">
                    <p className="text-sm text-center">
                      Chatting about: <span className="font-semibold">{selectedChatData.vehicleTitle}</span>
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-accent/20">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === 2 ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === 2
                              ? 'bg-blue-600 text-white'
                              : 'bg-background border shadow-sm'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === 2 ? 'text-blue-100' : 'text-muted-foreground'
                            }`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-background">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>Select a chat to start messaging</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;