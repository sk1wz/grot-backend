import { Socket } from 'socket.io';

export abstract class UserRoomGatewayBase {
  public handleConnection(client: Socket): void {
    const userId = this.extractUserId(client.handshake.query.userId);

    if (userId) {
      void client.join(this.getUserRoom(userId));
    }
  }

  protected joinFromPayload(
    client: Socket,
    body: { userId?: string } | undefined,
  ): void {
    if (!body?.userId) {
      return;
    }

    void client.join(this.getUserRoom(body.userId));
  }

  protected getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractUserId(value: unknown): string | null {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
      return value[0];
    }

    return null;
  }
}
