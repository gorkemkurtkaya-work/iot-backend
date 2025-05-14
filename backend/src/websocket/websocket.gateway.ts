import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })
  export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    handleConnection(client: Socket) {
      console.log('🔌 Kullanıcı bağlandı:', client.id);
      client.emit('test', { message: 'Test mesajı' });
    }
  
    handleDisconnect(client: Socket) {
      console.log('🔌 Kullanıcı ayrıldı:', client.id);
    }
  
    // İstemciden gelen özel mesaj
    @SubscribeMessage('clientMessage')
    handleClientMessage(client: Socket, payload: any) {
      console.log('📩 İstemciden mesaj geldi:', payload);
      // Geri yayın
      client.emit('serverMessage', { message: 'Mesaj alındı!' });
    }
  
    // Dışarıdan yayın göndermek istersen bu metodu kullan
    sendToAll(event: string, data: any) {
      this.server.emit(event, data);
    }
  }
  