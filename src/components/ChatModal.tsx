import { useState, useRef, useEffect, ReactNode } from "react";
import { X, Send, Paperclip, Smile, Car } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
}

interface ChatModalProps {
  sellerName: string;
  vehicleTitle: string;
  sellerContact: string; 
  children?: ReactNode; // Make children optional for ChatPage usage
  
  // Props for chat identification
  initialChatId?: number | null; 
  initialReceiverId?: number | null; 
  initialVehicleId?: number | null; 
  
  // Props for controlling visibility and lifecycle from parent components (VehicleDetail/ChatPage)
  isOpen?: boolean;
  onClose?: () => void;
  onMessageSent?: () => void; // New prop to sync the ChatPage list
}

const ChatModal = ({ sellerName, vehicleTitle, sellerContact, children, initialChatId, initialReceiverId, initialVehicleId, isOpen: parentIsOpen, onClose: parentOnClose, onMessageSent }: ChatModalProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatId, setChatId] = useState<number | null>(initialChatId || null);
  const [modalOpen, setModalOpen] = useState(parentIsOpen || false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to load messages when chat ID changes or modal opens
  useEffect(() => {
    if (!chatId || !modalOpen) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
            const response = await fetch(`http://localhost:3001/api/chats/${chatId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load messages');
            const data = await response.json();
            setMessages(data.messages);
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast({ title: "Chat Error", description: "Could not load conversation history.", variant: 'destructive' });
        } finally {
            setLoadingMessages(false);
        }
    };

    fetchMessages();
  }, [chatId, modalOpen, toast]); // Removed userId, it's safer to rely on the backend JWT

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    // Local message update for immediate feedback
    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, tempMessage]);
    setMessage("");

    try {
        const response = await fetch('http://localhost:3001/api/chats/message', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                message: tempMessage.text,
                chatId: chatId,
                receiverId: initialReceiverId,
                vehicleId: initialVehicleId
            })
        });

        if (!response.ok) throw new Error('Failed to send message');
        
        const data = await response.json();
        setChatId(data.chatId); // Update local state with the new permanent chatId
        
        // Final action: Notify parent (ChatPage) that a message was sent so it can refresh the list
        if (onMessageSent) {
            onMessageSent();
        }
        
        // Update local messages array with the server ID
        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, id: data.message.id } : msg));

    } catch (error) {
        console.error("Error sending message:", error);
        toast({ title: "Send Failed", description: "Could not send message. Please try again.", variant: 'destructive' });
        // Revert message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setMessage(tempMessage.text);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (parentOnClose) {
        parentOnClose();
    }
    setModalOpen(open);
  };

  // --- FIX: Conditional size classes applied here ---
  const modalSizeClasses = parentIsOpen 
      ? "w-full h-full p-0 md:max-w-none md:p-0" // Full height/width for ChatPage view
      : "max-w-md h-[600px]"; // Default pop-up size for VehicleDetail view


  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
        {/* Render children only if NOT controlled by parent (VehicleDetail) */}
        {!parentIsOpen && <DialogTrigger asChild>{children}</DialogTrigger>}

        <DialogContent className={`${modalSizeClasses} flex flex-col`}>
            {/* Header */}
            <div className="p-4 border-b bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* ... Avatar and Seller Info ... */}
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">{sellerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-white font-semibold">{sellerName}</p>
                        <p className="text-blue-100 text-sm">{sellerContact}</p>
                    </div>
                </div>
                {/* Close Button is only rendered if parent IS NOT controlling (i.e., when it's a small pop-up) */}
                {!parentIsOpen && (
                     <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} className="text-white hover:bg-blue-700">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Vehicle Info */}
            <div className="p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                    <Car className="h-6 w-6 text-gray-500" />
                    <div>
                        <p className="font-medium text-sm">{vehicleTitle}</p>
                        <p className="text-blue-600 text-sm font-semibold">Chat ID: {chatId || 'New'}</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                    <p className='text-center text-gray-500'>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className='text-center text-gray-500'>Start the conversation!</p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                                <div
                                    className={`px-4 py-2 rounded-lg ${
                                        msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
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
                            {msg.sender === 'other' && (
                                <Avatar className="h-8 w-8 mr-2 order-0">
                                    <AvatarFallback className="bg-gray-400 text-white text-xs">{sellerName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Paperclip className="h-4 w-4" /></Button>
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