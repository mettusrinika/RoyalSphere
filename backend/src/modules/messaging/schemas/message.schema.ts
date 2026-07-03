import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Schema({
  timestamps: true,
  collection: 'messages',
})
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversationId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  senderId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  receiverId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  content: string;

  @Prop({
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  // -----------------------------
  // Attachments
  // -----------------------------

  @Prop({
    default: null,
  })
  fileUrl?: string;

  @Prop({
    default: null,
  })
  fileName?: string;

  @Prop({
    default: null,
  })
  fileSize?: number;

  @Prop({
    default: null,
  })
  mimeType?: string;

  // -----------------------------
  // Read Status
  // -----------------------------

  @Prop({
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Prop({
    default: false,
  })
  isRead: boolean;

  @Prop({
    default: null,
  })
  readAt?: Date;

  // -----------------------------
  // Edit / Delete
  // -----------------------------

  @Prop({
    default: false,
  })
  edited: boolean;

  @Prop({
    default: null,
  })
  editedAt?: Date;

  @Prop({
    default: false,
  })
  deleted: boolean;

  @Prop({
    default: null,
  })
  deletedAt?: Date;

  // -----------------------------
  // Reply Feature
  // -----------------------------

  @Prop({
    type: Types.ObjectId,
    ref: 'Message',
    default: null,
  })
  replyTo?: Types.ObjectId;

  // -----------------------------
  // Reactions (Future)
  // -----------------------------

  @Prop({
    type: [
      {
        userId: {
          type: Types.ObjectId,
          ref: 'User',
        },
        emoji: String,
      },
    ],
    default: [],
  })
  reactions: {
    userId: Types.ObjectId;
    emoji: string;
  }[];
}

export const MessageSchema =
  SchemaFactory.createForClass(Message);

// =====================================
// Indexes
// =====================================

MessageSchema.index({
  conversationId: 1,
  createdAt: -1,
});

MessageSchema.index({
  senderId: 1,
});

MessageSchema.index({
  receiverId: 1,
});

MessageSchema.index({
  status: 1,
});

MessageSchema.index({
  isRead: 1,
});

MessageSchema.index({
  type: 1,
});