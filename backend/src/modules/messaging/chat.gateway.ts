import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { MessagingService } from './messaging.service';
import { MessageType } from './schemas/message.schema';

@WebSocketGateway({
  namespace: '/socket',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly connectedUsers = new Map<string, Set<string>>();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token;
      const bearerToken = client.handshake.headers.authorization?.split(' ')[1];
      const token = authToken || bearerToken;
      const secret = this.configService.get<string>('JWT_SECRET');

      if (!token || !secret) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, { secret });
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }

      const userId = String(payload.sub);
      client.data.userId = userId;

      const sockets = this.connectedUsers.get(userId) ?? new Set<string>();
      sockets.add(client.id);
      this.connectedUsers.set(userId, sockets);

      await client.join(`user:${userId}`);
      client.emit('connected', { userId });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const sockets = this.connectedUsers.get(userId);
    if (!sockets) return;

    sockets.delete(client.id);
    if (sockets.size === 0) this.connectedUsers.delete(userId);
  }

  private requireUser(client: Socket): string {
    const userId = client.data.userId as string | undefined;
    if (!userId) throw new WsException('Authentication required.');
    return userId;
  }

  @SubscribeMessage('join_conversation')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.requireUser(client);
    await this.messagingService.getConversationMessages(
      data.conversationId,
      userId,
      1,
      1,
    );
    await client.join(`conversation:${data.conversationId}`);
    return { joined: data.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    this.requireUser(client);
    await client.leave(`conversation:${data.conversationId}`);
    return { left: data.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      type?: MessageType;
      fileUrl?: string;
      replyTo?: string;
    },
  ) {
    try {
      const senderId = this.requireUser(client);
      const message = await this.messagingService.sendMessage(
        data.conversationId,
        senderId,
        data.content,
        data.type,
        data.fileUrl,
        data.replyTo,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new_message', message);

      return { success: true, message };
    } catch (error: any) {
      throw new WsException(error?.message || 'Unable to send message.');
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.requireUser(client);
    await this.messagingService.getConversationMessages(
      data.conversationId,
      userId,
      1,
      1,
    );
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.requireUser(client);
    client.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @OnEvent('notification.created')
  handleNotification(payload: { userId: string; notification: unknown }) {
    this.sendToUser(payload.userId, 'notification', payload.notification);
  }

  @OnEvent('booking.created')
  handleBookingCreated(payload: { vendorId: string; booking: unknown }) {
    this.sendToUser(payload.vendorId, 'booking_created', payload.booking);
  }

  @OnEvent('booking.accepted')
  handleBookingAccepted(payload: { customerId: string; booking: unknown }) {
    this.sendToUser(payload.customerId, 'booking_accepted', payload.booking);
  }

  @OnEvent('booking.cancelled')
  handleBookingCancelled(payload: {
    customerId: string;
    vendorId: string;
    booking: unknown;
  }) {
    this.sendToUser(payload.customerId, 'booking_cancelled', payload.booking);
    this.sendToUser(payload.vendorId, 'booking_cancelled', payload.booking);
  }

  @OnEvent('payment.completed')
  handlePaymentCompleted(payload: { customerId: string; payment: unknown }) {
    this.sendToUser(payload.customerId, 'payment_completed', payload.payment);
  }

  @OnEvent('payment.refunded')
  handleRefund(payload: { customerId: string; payment: unknown }) {
    this.sendToUser(payload.customerId, 'payment_refunded', payload.payment);
  }

  @OnEvent('vendor.approved')
  handleVendorApproved(payload: { userId: string }) {
    this.sendToUser(payload.userId, 'vendor_approved', payload);
  }

  @OnEvent('vendor.rejected')
  handleVendorRejected(payload: { userId: string; reason: string }) {
    this.sendToUser(payload.userId, 'vendor_rejected', payload);
  }

  @OnEvent('review.created')
  handleReviewCreated(payload: { vendorId: string; review: unknown }) {
    this.sendToUser(payload.vendorId, 'review_created', payload.review);
  }

  @OnEvent('ai.completed')
  handleAICompleted(payload: { userId: string; result: unknown }) {
    this.sendToUser(payload.userId, 'ai_completed', payload.result);
  }

  isUserOnline(userId: string): boolean {
    return (this.connectedUsers.get(userId)?.size ?? 0) > 0;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
