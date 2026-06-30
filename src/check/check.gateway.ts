import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserRoomGatewayBase } from '@/common/socket/user-room.gateway.base';

@WebSocketGateway({
  namespace: 'check',
  cors: { origin: true, credentials: true },
})
export class CheckGateway extends UserRoomGatewayBase {
  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('subscribe')
  public subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId?: string },
  ): void {
    this.joinFromPayload(client, body);
  }

  public emitCheckUpdated(userId: string, payload: unknown): void {
    this.server.to(this.getUserRoom(userId)).emit('check.updated', payload);
  }
}
