import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(room?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    if (room) {
      newSocket.emit('join_room', room);
    }

    return () => {
      newSocket.close();
    };
  }, [room]);

  return socket;
}
