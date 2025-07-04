
import { useState, useRef, useEffect } from "react";
import { X, Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  vehicleTitle: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'seller';
  timestamp: string;
}

const ChatModal = ({ isOpen, onClose, sellerName, vehicleTitle }: ChatModalProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hi! I'm interested in your ${vehicleTitle}. Is it still available?`,
      sender: 'user',
      timestamp: '10:30 AM'
    },
    {
      id: 2,
      text: "Hello! Yes, the vehicle is still available. Would you like to schedule a viewing?",
      sender: 'seller',
      timestamp: '10:35 AM'
    },
    {
      id: 3,
      text: "That would be great! What time works best for you?",
      sender: 'user',
      timestamp: '10:36 AM'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: message,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      
      // Simulate seller response
      setTimeout(() => {
        const sellerResponse: Message = {
          id: messages.length + 2,
          text: "Thanks for your message. I'll get back to you shortly!",
          sender: 'seller',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, sellerResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-blue-500 text-white">
                  {sellerName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-white">{sellerName}</DialogTitle>
                <p className="text-blue-100 text-sm">Usually responds quickly</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-blue-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Vehicle Info */}
        <div className="p-3 bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <img
              src="/placeholder.svg"
              alt={vehicleTitle}
              className="w-12 h-8 object-cover rounded"
            />
            <div>
              <p className="font-medium text-sm">{vehicleTitle}</p>
              <p className="text-blue-600 text-sm font-semibold">Rs. 4,500,000</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${
                  msg.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {msg.timestamp}
                </p>
              </div>
              {msg.sender === 'seller' && (
                <Avatar className="h-8 w-8 mr-2 order-0">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-gray-400 text-white text-xs">
                    {sellerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
              />
              <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
