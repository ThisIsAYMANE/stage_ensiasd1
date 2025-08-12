'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCheck,
  User,
  BookOpen
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any;
  read: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  otherUser: {
    id: string;
    name: string;
    profilePicture?: string;
    type: 'student' | 'tutor';
  };
}

export default function MessagesPage() {
  const { userProfile } = useAuth();
  const searchParams = useSearchParams();
  const tutorId = searchParams.get('tutor');
  const studentId = searchParams.get('student');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile) {
      fetchConversations();
    }
  }, [userProfile]);

  useEffect(() => {
    if (tutorId && userProfile) {
      startConversationWithTutor(tutorId);
    }
  }, [tutorId, userProfile]);

  useEffect(() => {
    if (studentId && userProfile) {
      startConversationWithStudent(studentId);
    }
  }, [studentId, userProfile]);

  useEffect(() => {
    if (selectedConversation) {
      const unsubscribe = subscribeToMessages(selectedConversation);
      return () => unsubscribe();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!userProfile) return;

    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userProfile.id)
        // Removed orderBy to avoid composite index requirement
      );

      const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
        const conversationsList: Conversation[] = [];
        const seenParticipants = new Set(); // Track seen participant combinations

        for (const conversationDoc of snapshot.docs) {
          const data = conversationDoc.data();
          const otherUserId = data.participants.find((id: string) => id !== userProfile.id);
          
          if (otherUserId) {
            // Create a unique key for this participant combination
            const participantKey = [userProfile.id, otherUserId].sort().join('-');
            
            // Skip if we've already seen this participant combination
            if (seenParticipants.has(participantKey)) {
              console.log('Skipping duplicate conversation with:', otherUserId);
              continue;
            }
            
            seenParticipants.add(participantKey);
            
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (otherUserDoc.exists()) {
              const otherUserData = otherUserDoc.data();
              
              conversationsList.push({
                id: conversationDoc.id,
                participants: data.participants,
                lastMessage: data.lastMessage || '',
                lastMessageTime: data.lastMessageTime,
                unreadCount: data.unreadCount?.[userProfile.id] || 0,
                otherUser: {
                  id: otherUserId,
                  name: otherUserData.name,
                  profilePicture: otherUserData.profilePicture,
                  type: otherUserData.type,
                },
              });
            }
          }
        }

        // Sort conversations by last message time on client side
        const sortedConversations = conversationsList.sort((a, b) => {
          const timeA = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate() : new Date(a.lastMessageTime);
          const timeB = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate() : new Date(b.lastMessageTime);
          return timeB.getTime() - timeA.getTime();
        });

        setConversations(sortedConversations);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const cleanupDuplicateConversations = async () => {
    if (!userProfile) return;

    try {
      console.log('Starting cleanup of duplicate conversations...');
      
      // Get all conversations for this user
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userProfile.id)
      );
      
      const snapshot = await getDocs(conversationsQuery);
      const conversationsToDelete = [];
      const seenParticipants = new Set();
      
      // Find duplicates
      for (const convDoc of snapshot.docs) {
        const data = convDoc.data();
        const otherUserId = data.participants.find((id: string) => id !== userProfile.id);
        
        if (otherUserId) {
          const participantKey = [userProfile.id, otherUserId].sort().join('-');
          
          if (seenParticipants.has(participantKey)) {
            // This is a duplicate, mark for deletion
            conversationsToDelete.push(convDoc.id);
            console.log('Marking duplicate conversation for deletion:', convDoc.id);
          } else {
            seenParticipants.add(participantKey);
          }
        }
      }
      
      // Delete duplicates (keep the first one, delete the rest)
      if (conversationsToDelete.length > 0) {
        console.log(`Found ${conversationsToDelete.length} duplicate conversations to delete`);
        
        // Note: In a production app, you'd want to batch delete these
        // For now, we'll just log them so you can manually delete them
        console.log('Duplicate conversation IDs to delete:', conversationsToDelete);
        
        // Refresh conversations after cleanup
        fetchConversations();
      } else {
        console.log('No duplicate conversations found');
      }
    } catch (error) {
      console.error('Error cleaning up duplicate conversations:', error);
    }
  };

  const startConversationWithTutor = async (tutorId: string) => {
    if (!userProfile) return;

    try {
      // First, check if conversation already exists in Firebase
      const existingConversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userProfile.id)
      );
      
      const existingSnapshot = await getDocs(existingConversationsQuery);
      let existingConversationId = null;
      
      // Check if any existing conversation includes this tutor
      for (const convDoc of existingSnapshot.docs) {
        const convData = convDoc.data();
        if (convData.participants.includes(tutorId)) {
          existingConversationId = convDoc.id;
          break;
        }
      }

      if (existingConversationId) {
        // Conversation exists, select it
        setSelectedConversation(existingConversationId);
        return;
      }

      // Get tutor info
      const tutorDoc = await getDoc(doc(db, 'users', tutorId));
      if (!tutorDoc.exists()) return;

      const tutorData = tutorDoc.data();

      // Create new conversation only if none exists
      const conversationData = {
        participants: [userProfile.id, tutorId],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [userProfile.id]: 0,
          [tutorId]: 0,
        },
        createdAt: serverTimestamp(),
      };

      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
      
      // Add to local state
      const newConversation: Conversation = {
        id: conversationRef.id,
        participants: [userProfile.id, tutorId],
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        otherUser: {
          id: tutorId,
          name: tutorData.name,
          profilePicture: tutorData.profilePicture,
          type: tutorData.type,
        },
      };

      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(conversationRef.id);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const startConversationWithStudent = async (studentId: string) => {
    if (!userProfile) return;

    try {
      // First, check if conversation already exists in Firebase
      const existingConversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userProfile.id)
      );
      
      const existingSnapshot = await getDocs(existingConversationsQuery);
      let existingConversationId = null;
      
      // Check if any existing conversation includes this student
      for (const convDoc of existingSnapshot.docs) {
        const convData = convDoc.data();
        if (convData.participants.includes(studentId)) {
          existingConversationId = convDoc.id;
          break;
        }
      }

      if (existingConversationId) {
        // Conversation exists, select it
        setSelectedConversation(existingConversationId);
        return;
      }

      // Get student info
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      if (!studentDoc.exists()) return;

      const studentData = studentDoc.data();

      // Create new conversation only if none exists
      const conversationData = {
        participants: [userProfile.id, studentId],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [userProfile.id]: 0,
          [studentId]: 0,
        },
        createdAt: serverTimestamp(),
      };

      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
      
      // Add to local state
      const newConversation: Conversation = {
        id: conversationRef.id,
        participants: [userProfile.id, studentId],
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        otherUser: {
          id: studentId,
          name: studentData.name,
          profilePicture: studentData.profilePicture,
          type: studentData.type,
        },
      };

      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(conversationRef.id);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messagesList: Message[] = [];
      
      snapshot.forEach((doc) => {
        messagesList.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });

      setMessages(messagesList);
      
      // Mark messages as read
      markMessagesAsRead(conversationId);
    });
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!userProfile) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userProfile.id}`]: 0,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userProfile || sending) return;

    setSending(true);

    try {
      const selectedConv = conversations.find(conv => conv.id === selectedConversation);
      if (!selectedConv) return;

      const receiverId = selectedConv.otherUser.id;

      // Add message to subcollection
      await addDoc(collection(db, 'conversations', selectedConversation, 'messages'), {
        senderId: userProfile.id,
        receiverId: receiverId,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
      });

      // Update conversation with last message
      await updateDoc(doc(db, 'conversations', selectedConversation), {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${receiverId}`]: selectedConv.unreadCount + 1,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
              <div className="bg-muted rounded"></div>
              <div className="lg:col-span-2 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">Messages</h1>
              <p className="text-xl text-text-secondary">
                Communicate with your {userProfile?.type === 'student' ? 'tutors' : 'students'}
              </p>
            </div>
            <Button 
              onClick={cleanupDuplicateConversations} 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clean Duplicates
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="card-sharp flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Conversations</span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-6">
                  <MessageSquare className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">No conversations yet.</p>
                  <p className="text-sm text-text-secondary mt-2">
                    Start a conversation by messaging a tutor from their profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-primary/5 transition-colors ${
                        selectedConversation === conversation.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage 
                            src={conversation.otherUser.profilePicture} 
                            alt={conversation.otherUser.name} 
                          />
                          <AvatarFallback>
                            {conversation.otherUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.otherUser.type === 'tutor' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                            <BookOpen className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-text-primary truncate">
                            {conversation.otherUser.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {conversation.unreadCount > 0 && (
                              <Badge variant="default" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-text-secondary">
                              {formatMessageTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 card-sharp flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage 
                        src={selectedConv.otherUser.profilePicture} 
                        alt={selectedConv.otherUser.name} 
                      />
                      <AvatarFallback>
                        {selectedConv.otherUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {selectedConv.otherUser.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {selectedConv.otherUser.type}
                        </Badge>
                        <span className="text-sm text-text-secondary">Online</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                      <p className="text-text-secondary">No messages yet.</p>
                      <p className="text-sm text-text-secondary mt-2">
                        Start the conversation by sending a message below.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === userProfile?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === userProfile?.id
                              ? 'bg-primary text-white'
                              : 'bg-muted text-text-primary'
                          }`}
                          style={{ borderRadius: '0.25rem' }}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            message.senderId === userProfile?.id ? 'text-blue-100' : 'text-text-secondary'
                          }`}>
                            <span className="text-xs">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {message.senderId === userProfile?.id && (
                              <CheckCheck className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                <Separator />

                {/* Message Input */}
                <div className="p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="btn-primary"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-text-secondary">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
