import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('accessToken');
      const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(
        '/api',
        ''
      );
      const newSocket = io(socketUrl, {
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('connect_error', () => {
        setIsConnected(false);
      });

      const socketTimer = setTimeout(() => {
        setSocket(newSocket);
      }, 0);

      return () => {
        clearTimeout(socketTimer);
        newSocket.disconnect();
      };
    } else {
      setTimeout(() => {
        setSocket(null);
        setIsConnected(false);
      }, 0);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
};
