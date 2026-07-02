import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Notification } from '@/db';
import { Server, Socket } from 'socket.io';
import { UserRoomGatewayBase } from '@/common/socket/user-room.gateway.base';

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationGateway extends UserRoomGatewayBase {
  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('subscribe')
  public subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId?: string },
  ): void {
    this.joinFromPayload(client, body);
  }

  public emitNotificationUpdated(userId: string, payload: Notification): void {
    this.server
      .to(this.getUserRoom(userId))
      .emit('notification.updated', payload);
  }
}
