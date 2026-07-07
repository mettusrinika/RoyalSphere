import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    const smtpPort =
  this.configService.get<number>('SMTP_PORT') ?? 587;

this.transporter = nodemailer.createTransport({
  host: this.configService.get<string>('SMTP_HOST'),
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: this.configService.get<string>('SMTP_USER'),
    pass: this.configService.get<string>('SMTP_PASS'),
  },
});
  }

  async createNotification(data: {
    userId: string | Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
    notifData?: Record<string, any>;
  }) {
    const notification = await this.notificationModel.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      actionUrl: data.actionUrl,
      data: data.notifData || {},
    });

    // Emit for WebSocket delivery
    this.eventEmitter.emit('notification.created', {
      userId: data.userId.toString(),
      notification,
    });    void this.sendPushNotification(data.userId.toString(), {
      title: data.title,
      body: data.message,
      data: {
        notificationId: notification._id.toString(),
        type: data.type,
        actionUrl: data.actionUrl ?? '',
        ...(data.notifData || {}),
      },
    });

    return notification;
  }

  async registerPushToken(userId: string, expoPushToken: string) {
    if (
      !expoPushToken ||
      !/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(expoPushToken)
    ) {
      throw new Error('Invalid Expo push token');
    }

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          expoPushToken,
          pushTokenUpdatedAt: new Date(),
        },
      },
    );

    return {
      message: 'Push token registered successfully',
    };
  }

  async createTestPush(userId: string) {
    return this.createNotification({
      userId,
      title: 'OMIQORA notifications are live',
      message: 'Real push delivery is connected to your authenticated device.',
      type: NotificationType.SYSTEM,
      actionUrl: '/notifications',
      notifData: { proof: 'push-registration' },
    });
  }

  async unregisterPushToken(userId: string) {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $unset: {
          expoPushToken: 1,
          pushTokenUpdatedAt: 1,
        },
      },
    );

    return {
      message: 'Push token removed successfully',
    };
  }

  private async sendPushNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, any>;
    },
  ) {
    try {
      const user = await this.userModel
        .findById(userId)
        .lean();

      if (!user?.expoPushToken) {
        return;
      }

      const response = await fetch(
        'https://exp.host/--/api/v2/push/send',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.expoPushToken,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
          }),
        },
      );

      if (!response.ok) {
        const responseBody = await response.text();

        this.logger.warn(
          `Expo push delivery failed for user ${userId}: ${response.status} ${responseBody}`,
        );
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error(String(err));

      this.logger.warn(
        `Push notification delivery failed for user ${userId}: ${error.message}`,
      );
    }
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find({
  userId: new Types.ObjectId(userId),
  isArchived: false,
})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.notificationModel.countDocuments({
  userId: new Types.ObjectId(userId),
  isArchived: false,
}),
      this.notificationModel.countDocuments({
  userId: new Types.ObjectId(userId),
  isArchived: false,
  isRead: false,
}),
    ]);
    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.notificationModel.findOneAndUpdate(
      {
  _id: notificationId,
  userId: new Types.ObjectId(userId),
},
      { isRead: true, readAt: new Date() },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      {
  userId: new Types.ObjectId(userId),
  isRead: false,
},
      { isRead: true, readAt: new Date() },
    );
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    await this.notificationModel.findOneAndUpdate(
  {
    _id: notificationId,
    userId: new Types.ObjectId(userId),
  },
  {
    isArchived: true,
  },
);
    return { message: 'Notification deleted' };
  }

  // ─── Email Helpers ──────────────────────────────────────────────────────────

  async sendEmailVerification(email: string, name: string, token: string) {
    const url = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Verify your OMIQORA account',
      html: this.emailTemplate('Email Verification', `
        <p>Hi ${name},</p>
        <p>Welcome to OMIQORA! Please verify your email address to get started.</p>
        <a href="${url}" class="btn">Verify Email</a>
        <p style="color:#888;font-size:12px;">Link expires in 24 hours.</p>
      `),
    });
  }

  async sendPasswordReset(email: string, name: string, token: string) {
    const url = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Reset your OMIQORA password',
      html: this.emailTemplate('Password Reset', `
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click below to set a new password.</p>
        <a href="${url}" class="btn">Reset Password</a>
        <p style="color:#888;font-size:12px;">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      `),
    });
  }

  async sendBookingConfirmation(email: string, name: string, bookingNumber: string, details: any) {
    await this.sendEmail({
      to: email,
      subject: `Booking Confirmed – ${bookingNumber}`,
      html: this.emailTemplate('Booking Confirmed', `
        <p>Hi ${name},</p>
        <p>Your booking <strong>${bookingNumber}</strong> has been confirmed!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#888;">Service</td><td style="padding:8px;">${details.serviceName}</td></tr>
          <tr><td style="padding:8px;color:#888;">Vendor</td><td style="padding:8px;">${details.vendorName}</td></tr>
          <tr><td style="padding:8px;color:#888;">Date</td><td style="padding:8px;">${details.eventDate}</td></tr>
          <tr><td style="padding:8px;color:#888;">Amount</td><td style="padding:8px;">₹${details.amount}</td></tr>
        </table>
        <a href="${this.configService.get('FRONTEND_URL')}/bookings/${details.bookingId}" class="btn">View Booking</a>
      `),
    });
  }

  async sendVendorApproval(email: string, name: string) {
    await this.sendEmail({
      to: email,
      subject: 'Congratulations! Your vendor application is approved',
      html: this.emailTemplate('Vendor Approved 🎉', `
        <p>Hi ${name},</p>
        <p>Your OMIQORA vendor application has been <strong>approved</strong>!</p>
        <p>You can now list your services, manage bookings, and start growing your business.</p>
        <a href="${this.configService.get('FRONTEND_URL')}/dashboard/vendor" class="btn">Go to Vendor Dashboard</a>
      `),
    });
  }

  async sendVendorRejection(email: string, name: string, reason: string) {
    await this.sendEmail({
      to: email,
      subject: 'Update on your OMIQORA vendor application',
      html: this.emailTemplate('Application Update', `
        <p>Hi ${name},</p>
        <p>After review, we were unable to approve your vendor application at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You may reapply after addressing the above concerns.</p>
      `),
    });
  }

  async getUnreadCount(userId: string) {
  return this.notificationModel.countDocuments({
    userId: new Types.ObjectId(userId),
    isRead: false,
    isArchived: false,
  });
}

async archiveAll(userId: string) {
  await this.notificationModel.updateMany(
    {
      userId: new Types.ObjectId(userId),
    },
    {
      isArchived: true,
    },
  );

  return {
    message: 'All notifications archived',
  };
}

private async sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const from = this.configService.get<string>('EMAIL_FROM');

    if (!from) {
      throw new Error('EMAIL_FROM is not configured');
    }

    await this.transporter.sendMail({
      from,
      ...options,
    });

    this.logger.log(`Email sent successfully to ${options.to}`);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    this.logger.error(
      `Email send failed to ${options.to}`,
      error.stack,
    );

    throw error;
  }
}

  private emailTemplate(title: string, body: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;}
  .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);}
  .header{background:linear-gradient(135deg,#0B1F5B,#1a3a8f);padding:32px;text-align:center;}
  .header h1{color:#D4AF37;margin:0;font-size:24px;letter-spacing:1px;}
  .header p{color:#F4E6A1;margin:4px 0 0;}
  .body{padding:32px;}
  h2{color:#0B1F5B;margin-top:0;}
  p{color:#374151;line-height:1.6;}
  .btn{display:inline-block;margin:16px 0;padding:14px 28px;background:#D4AF37;color:#0B1F5B;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;}
  .footer{padding:20px 32px;background:#f8fafc;color:#9ca3af;font-size:12px;text-align:center;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>OMIQORA</h1>
    <p>AI-powered Services Ecosystem</p>
  </div>
  <div class="body">
    <h2>${title}</h2>
    ${body}
  </div>
  <div class="footer">© ${new Date().getFullYear()} OMIQORA. All rights reserved.</div>
</div>
</body>
</html>`;
  }
}
