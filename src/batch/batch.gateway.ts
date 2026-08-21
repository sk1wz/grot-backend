import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UserRoomGatewayBase } from '@/common/socket/user-room.gateway.base';

@WebSocketGateway({
  namespace: 'batch',
  cors: { origin: true, credentials: true },
})
export class BatchGateway extends UserRoomGatewayBase {
  @WebSocketServer() private server!: Server;
  public emitUpdated(userId: string, payload: unknown): void {
    this.server.to(this.getUserRoom(userId)).emit('batch.updated', payload);
  }
}
