import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import {
  Conversation,
  ConversationDocument,
  ConversationStatus,
} from './schemas/conversation.schema';
import {
  Message,
  MessageDocument,
  MessageStatus,
  MessageType,
} from './schemas/message.schema';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private objectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}.`);
    }
    return new Types.ObjectId(id);
  }

  private assertParticipant(conversation: ConversationDocument, userId: string) {
    const isCustomer = conversation.customerId.toString() === userId;
    const isVendor = conversation.vendorId.toString() === userId;
    if (!isCustomer && !isVendor) {
      throw new ForbiddenException('Access denied.');
    }
    return { isCustomer, isVendor };
  }

  private async getConversationOrThrow(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    this.objectId(conversationId, 'conversation ID');
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation || conversation.isDeleted) {
      throw new NotFoundException('Conversation not found.');
    }
    this.assertParticipant(conversation, userId);
    return conversation;
  }

  async createConversation(
    bookingId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    this.objectId(bookingId, 'booking ID');
    this.objectId(userId, 'user ID');

    const booking = await this.bookingModel.findById(bookingId).lean();
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    const customerId = booking.customerId?.toString();
    const vendorId = booking.vendorId?.toString();
    if (!customerId || !vendorId) {
      throw new BadRequestException('Booking does not have valid chat participants.');
    }
    if (customerId !== userId && vendorId !== userId) {
      throw new ForbiddenException('You cannot access this booking.');
    }

    const existing = await this.conversationModel.findOne({
      bookingId: booking._id,
      isDeleted: false,
    });
    if (existing) return existing;

    try {
      return await this.conversationModel.create({
        bookingId: booking._id,
        serviceId: booking.serviceId,
        customerId: booking.customerId,
        vendorId: booking.vendorId,
        lastMessage: '',
        unreadCustomer: 0,
        unreadVendor: 0,
        status: ConversationStatus.ACTIVE,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const conversation = await this.conversationModel.findOne({
          bookingId: booking._id,
        });
        if (conversation) return conversation;
      }
      throw error;
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    rawContent: string,
    type: MessageType = MessageType.TEXT,
    fileUrl?: string,
    replyTo?: string,
  ) {
    const conversation = await this.getConversationOrThrow(
      conversationId,
      senderId,
    );

    if (conversation.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Conversation is closed.');
    }
    if (conversation.isBlocked) {
      throw new BadRequestException('Conversation is blocked.');
    }

    const content = rawContent.trim();
    if (!content) {
      throw new BadRequestException('Message content is required.');
    }

    const { isCustomer } = this.assertParticipant(conversation, senderId);
    const receiverId = isCustomer
      ? conversation.vendorId.toString()
      : conversation.customerId.toString();

    let replyToId: Types.ObjectId | undefined;
    if (replyTo) {
      replyToId = this.objectId(replyTo, 'reply message ID');
      const replyMessage = await this.messageModel.exists({
        _id: replyToId,
        conversationId: conversation._id,
        deleted: false,
      });
      if (!replyMessage) {
        throw new BadRequestException('Reply message does not belong to this conversation.');
      }
    }

    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderId: this.objectId(senderId, 'sender ID'),
      receiverId: this.objectId(receiverId, 'receiver ID'),
      content,
      type,
      fileUrl,
      replyTo: replyToId,
      status: MessageStatus.SENT,
    });

    await this.conversationModel.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessage: type === MessageType.TEXT ? content : 'Attachment',
          lastMessageBy: this.objectId(senderId, 'sender ID'),
          lastMessageAt: new Date(),
          ...(isCustomer ? { customerArchived: false } : { vendorArchived: false }),
        },
        $inc: isCustomer ? { unreadVendor: 1 } : { unreadCustomer: 1 },
      },
    );

    const receiverMuted = isCustomer
      ? conversation.vendorMuted
      : conversation.customerMuted;

    if (!receiverMuted) {
      await this.notificationsService.createNotification({
        userId: receiverId,
        title: 'New Message',
        message: type === MessageType.TEXT ? content : 'You received an attachment.',
        type: NotificationType.NEW_MESSAGE,
        actionUrl: `/chat?conversation=${conversation._id.toString()}`,
        notifData: {
          conversationId: conversation._id,
          messageId: message._id,
        },
      });
    }

    return message.populate([
      { path: 'senderId', select: 'firstName lastName avatar' },
      { path: 'receiverId', select: 'firstName lastName avatar' },
      { path: 'replyTo' },
    ]);
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    if (page < 1) throw new BadRequestException('Page must be at least 1.');
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: conversation._id, deleted: false })
        .populate('senderId', 'firstName lastName avatar')
        .populate('receiverId', 'firstName lastName avatar')
        .populate('replyTo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.messageModel.countDocuments({
        conversationId: conversation._id,
        deleted: false,
      }),
    ]);

    return {
      conversation,
      messages: messages.reverse(),
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getUserConversations(userId: string) {
  const userObjectId = this.objectId(userId, 'user ID');

  const conversations = await this.conversationModel
    .find({
      $and: [
        {
          $or: [
            {
              customerId: userObjectId,
              customerArchived: { $ne: true },
            },
            {
              vendorId: userObjectId,
              vendorArchived: { $ne: true },
            },
          ],
        },
        {
          isDeleted: { $ne: true },
        },
      ],
    })
    .populate('customerId', 'firstName lastName avatar')
    .populate(
      'vendorId',
      'firstName lastName avatar vendorProfile',
    )
    .populate('serviceId', 'name images')
    .sort({
      lastMessageAt: -1,
      updatedAt: -1,
    })
    .lean();

  return conversations.map((conversation: any) => {
    const customerId =
      conversation.customerId?._id?.toString() ??
      conversation.customerId?.toString();

    const currentUserIsCustomer = customerId === userId;

    return {
      conversationId: conversation._id,
      bookingId: conversation.bookingId,
      serviceId: conversation.serviceId,

      otherUser: currentUserIsCustomer
        ? conversation.vendorId
        : conversation.customerId,

      lastMessage: conversation.lastMessage ?? '',
      lastMessageAt: conversation.lastMessageAt ?? null,

      unreadCount: currentUserIsCustomer
        ? conversation.unreadCustomer ?? 0
        : conversation.unreadVendor ?? 0,

      status:
        conversation.status ?? ConversationStatus.ACTIVE,

      isMuted: currentUserIsCustomer
        ? conversation.customerMuted ?? false
        : conversation.vendorMuted ?? false,

      isBlocked: conversation.isBlocked ?? false,
      blockedBy: conversation.blockedBy ?? null,
    };
  });
}

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    const { isCustomer } = this.assertParticipant(conversation, userId);
    const now = new Date();

    await Promise.all([
      this.messageModel.updateMany(
        {
          conversationId: conversation._id,
          receiverId: this.objectId(userId, 'user ID'),
          isRead: false,
          deleted: false,
        },
        {
          $set: {
            isRead: true,
            readAt: now,
            status: MessageStatus.READ,
          },
        },
      ),
      this.conversationModel.updateOne(
        { _id: conversation._id },
        { $set: isCustomer ? { unreadCustomer: 0 } : { unreadVendor: 0 } },
      ),
    ]);

    return { success: true, message: 'Conversation marked as read.' };
  }

  async getUnreadCount(userId: string) {
    const userObjectId = this.objectId(userId, 'user ID');
    const conversations = await this.conversationModel
      .find({
        $or: [{ customerId: userObjectId }, { vendorId: userObjectId }],
        isDeleted: false,
      })
      .select('customerId unreadCustomer unreadVendor')
      .lean();

    const unreadCount = conversations.reduce((total, conversation: any) => {
      return total + (
        conversation.customerId.toString() === userId
          ? conversation.unreadCustomer
          : conversation.unreadVendor
      );
    }, 0);

    return { unreadCount };
  }

  async deleteMessage(messageId: string, userId: string) {
    this.objectId(messageId, 'message ID');
    const message = await this.messageModel.findById(messageId);
    if (!message || message.deleted) throw new NotFoundException('Message not found.');
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can delete only your own messages.');
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    return { success: true, message: 'Message deleted.' };
  }

  async archiveConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    const { isCustomer } = this.assertParticipant(conversation, userId);
    if (isCustomer) conversation.customerArchived = true;
    else conversation.vendorArchived = true;
    await conversation.save();
    return { success: true, message: 'Conversation archived.' };
  }

  async unarchiveConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    const { isCustomer } = this.assertParticipant(conversation, userId);
    if (isCustomer) conversation.customerArchived = false;
    else conversation.vendorArchived = false;
    await conversation.save();
    return { success: true, message: 'Conversation restored.' };
  }

  async blockConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    conversation.isBlocked = true;
    conversation.blockedBy = this.objectId(userId, 'user ID');
    conversation.blockedAt = new Date();
    await conversation.save();
    return { success: true, message: 'Conversation blocked.' };
  }

  async unblockConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    if (!conversation.blockedBy || conversation.blockedBy.toString() !== userId) {
      throw new ForbiddenException(
        'Only the user who blocked this conversation can unblock it.',
      );
    }
    conversation.isBlocked = false;
    conversation.blockedBy = undefined;
    conversation.blockedAt = undefined;
    await conversation.save();
    return { success: true, message: 'Conversation unblocked.' };
  }

  async muteConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    const { isCustomer } = this.assertParticipant(conversation, userId);
    if (isCustomer) conversation.customerMuted = true;
    else conversation.vendorMuted = true;
    await conversation.save();
    return { success: true, message: 'Conversation muted.' };
  }

  async unmuteConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    const { isCustomer } = this.assertParticipant(conversation, userId);
    if (isCustomer) conversation.customerMuted = false;
    else conversation.vendorMuted = false;
    await conversation.save();
    return { success: true, message: 'Conversation unmuted.' };
  }

  async closeConversation(conversationId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    conversation.status = ConversationStatus.CLOSED;
    await conversation.save();
    return { success: true, message: 'Conversation closed.' };
  }

  async searchMessages(conversationId: string, userId: string, rawQuery: string) {
    const conversation = await this.getConversationOrThrow(conversationId, userId);
    const query = rawQuery?.trim();
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must contain at least 2 characters.');
    }
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return this.messageModel
      .find({
        conversationId: conversation._id,
        deleted: false,
        content: { $regex: escapedQuery, $options: 'i' },
      })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async editMessage(messageId: string, userId: string, rawContent: string) {
    this.objectId(messageId, 'message ID');
    const message = await this.messageModel.findById(messageId);
    if (!message || message.deleted) throw new NotFoundException('Message not found.');
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages.');
    }

    const content = rawContent.trim();
    if (!content) throw new BadRequestException('Message content is required.');

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await this.conversationModel.updateOne(
      { _id: message.conversationId, lastMessageBy: message.senderId },
      { $set: { lastMessage: content } },
    );

    return message.populate([
      { path: 'senderId', select: 'firstName lastName avatar' },
      { path: 'receiverId', select: 'firstName lastName avatar' },
    ]);
  }
}
