import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

import {
  VendorApplication,
  VendorApplicationDocument,
  ApplicationStatus,
} from './schemas/vendor-application.schema';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

import { NotificationsService } from '../notifications/notifications.service';

import {
  NotificationType,
} from '../notifications/schemas/notification.schema';

@Injectable()
export class VendorApplicationsService {
  constructor(
    @InjectModel(VendorApplication.name)
    private appModel: Model<VendorApplicationDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    private configService: ConfigService,

    private notificationsService: NotificationsService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.get(
        'CLOUDINARY_API_KEY',
      ),
      api_secret: this.configService.get(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  // =========================================================
  // APPLY AS VENDOR
  // =========================================================

  async apply(
    userId: string,
    dto: any,
  ) {
    const existing =
      await this.appModel.findOne({
        userId: new Types.ObjectId(userId),
      });

    if (
      existing &&
      existing.status !==
        ApplicationStatus.REJECTED
    ) {
      throw new ConflictException(
        'Application already submitted',
      );
    }

    const app =
      await this.appModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
        },
        {
          ...dto,
          userId: new Types.ObjectId(userId),
          status: ApplicationStatus.PENDING,
          rejectionReason: null,
        },
        {
          upsert: true,
          new: true,
        },
      );

    await this.userModel.findByIdAndUpdate(
      userId,
      {
        vendorApplicationId: app._id,
      },
    );

    return app;
  }

  // =========================================================
  // UPLOAD VENDOR DOCUMENT
  // =========================================================

  async uploadDocument(
    userId: string,
    type: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Document file is required',
      );
    }

    const normalizedType =
      type.toLowerCase().trim();

    const allowedDocumentTypes = [
      'aadhaar',
      'pan',
    ];

    if (
      !allowedDocumentTypes.includes(
        normalizedType,
      )
    ) {
      throw new BadRequestException(
        'Only Aadhaar or PAN documents are accepted',
      );
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        'Only JPG, PNG, WEBP and PDF documents are allowed',
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Document must be under 10MB',
      );
    }

    const app =
      await this.appModel.findOne({
        userId: new Types.ObjectId(userId),
      });

    if (!app) {
      throw new NotFoundException(
        'Application not found. Please apply first.',
      );
    }

    if (
      app.status === ApplicationStatus.APPROVED
    ) {
      throw new ConflictException(
        'Approved applications cannot modify documents',
      );
    }

    const result = await new Promise<any>(
      (resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder:
                'royal-sphere/documents',
              resource_type: 'auto',
            },
            (err, res) =>
              err
                ? reject(err)
                : resolve(res),
          );

        stream.end(file.buffer);
      },
    );

    const document = {
      type: normalizedType,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
      verificationStatus:
        'pending' as const,
    };

    const docIndex =
      app.documents.findIndex(
        (doc) =>
          doc.type.toLowerCase() ===
          normalizedType,
      );

    if (docIndex >= 0) {
      const oldPublicId =
        app.documents[docIndex].publicId;

      app.documents[docIndex] =
        document as any;

      if (oldPublicId) {
        await cloudinary.uploader
          .destroy(oldPublicId)
          .catch(() => undefined);
      }
    } else {
      app.documents.push(
        document as any,
      );
    }

    if (
      app.status ===
      ApplicationStatus.REJECTED
    ) {
      app.status =
        ApplicationStatus.PENDING;

      app.rejectionReason = undefined;
    }

    app.markModified('documents');

    await app.save();

    return {
      message:
        'Document uploaded and awaiting verification',
      document: {
        type: normalizedType,
        url: result.secure_url,
        verificationStatus: 'pending',
      },
    };
  }

  // =========================================================
  // GET CURRENT USER APPLICATION
  // =========================================================

  async getMyApplication(
    userId: string,
  ) {
    const app =
      await this.appModel.findOne({
        userId: new Types.ObjectId(userId),
      });

    if (!app) {
      return null;
    }

    return app;
  }

  // =========================================================
  // ADMIN - GET ALL APPLICATIONS
  // =========================================================

  async getAllApplications(
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const query: any = {};

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [applications, total] =
      await Promise.all([
        this.appModel
          .find(query)
          .populate(
            'userId',
            'firstName lastName email phone createdAt',
          )
          .populate(
            'reviewedBy',
            'firstName lastName',
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit),

        this.appModel.countDocuments(query),
      ]);

    return {
      applications,
      total,
      page,
      totalPages: Math.ceil(
        total / limit,
      ),
    };
  }

  // =========================================================
  // ADMIN - GET APPLICATION
  // =========================================================

  async getApplicationById(
    id: string,
  ) {
    const app =
      await this.appModel
        .findById(id)
        .populate(
          'userId',
          'firstName lastName email phone createdAt',
        )
        .populate(
          'reviewedBy',
          'firstName lastName',
        );

    if (!app) {
      throw new NotFoundException(
        'Application not found',
      );
    }

    return app;
  }

  // =========================================================
  // ADMIN - VERIFY OR REJECT DOCUMENT
  // =========================================================

  async verifyDocument(
    applicationId: string,
    documentType: string,
    adminId: string,
    status: 'verified' | 'rejected',
    reason?: string,
  ) {
    if (
      status !== 'verified' &&
      status !== 'rejected'
    ) {
      throw new BadRequestException(
        'Document status must be verified or rejected',
      );
    }

    const app =
      await this.appModel.findById(
        applicationId,
      );

    if (!app) {
      throw new NotFoundException(
        'Application not found',
      );
    }

    if (
      app.status ===
      ApplicationStatus.APPROVED
    ) {
      throw new ConflictException(
        'Documents of approved applications cannot be reviewed',
      );
    }

    const normalizedType =
      documentType.toLowerCase().trim();

    const document =
      app.documents.find(
        (item) =>
          item.type.toLowerCase() ===
          normalizedType,
      );

    if (!document) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    if (
      status === 'rejected' &&
      !reason?.trim()
    ) {
      throw new BadRequestException(
        'Rejection reason is required',
      );
    }

    document.verificationStatus =
      status;

    document.verifiedBy =
      new Types.ObjectId(adminId);

    document.verifiedAt =
      new Date();

    document.rejectionReason =
      status === 'rejected'
        ? reason?.trim()
        : undefined;

    app.markModified('documents');

    await app.save();

    return {
      message:
        status === 'verified'
          ? 'Document verified successfully'
          : 'Document rejected',
      document,
    };
  }

  // =========================================================
  // ADMIN - APPROVE VENDOR
  // Aadhaar OR PAN verified is enough
  // =========================================================

  async approve(
    id: string,
    adminId: string,
    notes?: string,
  ) {
    const app =
      await this.appModel
        .findById(id)
        .populate('userId');

    if (!app) {
      throw new NotFoundException(
        'Application not found',
      );
    }

    if (
      app.status ===
      ApplicationStatus.APPROVED
    ) {
      throw new ConflictException(
        'Vendor application already approved',
      );
    }

    const acceptedDocumentTypes = [
      'aadhaar',
      'pan',
    ];

    const hasIdentityDocument =
      app.documents.some(
        (document) =>
          acceptedDocumentTypes.includes(
            document.type
              .toLowerCase()
              .trim(),
          ),
      );

    if (!hasIdentityDocument) {
      throw new BadRequestException(
        'Cannot approve vendor. Aadhaar or PAN document is required.',
      );
    }

    const verifiedIdentityDocument =
      app.documents.some(
        (document) =>
          acceptedDocumentTypes.includes(
            document.type
              .toLowerCase()
              .trim(),
          ) &&
          document.verificationStatus ===
            'verified',
      );

    if (!verifiedIdentityDocument) {
      throw new BadRequestException(
        'Cannot approve vendor until Aadhaar or PAN is verified',
      );
    }

    app.status =
      ApplicationStatus.APPROVED;

    app.adminNotes = notes;

    app.reviewedBy =
      new Types.ObjectId(adminId);

    app.reviewedAt = new Date();

    await app.save();

    const user = app.userId as any;

    if (!user?._id) {
      throw new NotFoundException(
        'Application user not found',
      );
    }

    await this.userModel.findByIdAndUpdate(
      user._id,
      {
        $set: {
          role: 'vendor',
          status: 'active',
          isVendorApproved: true,

          vendorApplicationId: app._id,

          vendorProfile: {
            businessName:
              app.businessName,

            businessDescription:
              app.businessDescription,

            categories:
              app.categories,

            rating: 0,

            reviewCount: 0,

            completedBookings: 0,

            totalEarnings: 0,

            isVerified: true,

            verificationBadge:
              'verified',
          },
        },
      },
      {
        new: true,
      },
    );

    const updatedUser =
      await this.userModel.findById(
        user._id,
      );

    console.log(
      'Vendor Approved Successfully',
    );

    console.log(updatedUser);

    await this.notificationsService
      .createNotification({
        userId: user._id,

        title:
          '🎉 Vendor Application Approved!',

        message:
          'Congratulations! Your Royal Sphere vendor application has been approved. Start listing your services now.',

        type:
          NotificationType.VENDOR_APPROVED,

        actionUrl:
          '/dashboard/vendor',
      });

    this.notificationsService
      .sendVendorApproval(
        user.email,
        user.firstName,
      )
      .catch(console.error);

    return app;
  }

  // =========================================================
  // ADMIN - REJECT VENDOR
  // =========================================================

  async reject(
    id: string,
    adminId: string,
    reason: string,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException(
        'Rejection reason is required',
      );
    }

    const app =
      await this.appModel
        .findById(id)
        .populate('userId');

    if (!app) {
      throw new NotFoundException(
        'Application not found',
      );
    }

    if (
      app.status ===
      ApplicationStatus.APPROVED
    ) {
      throw new ConflictException(
        'Vendor application already approved',
      );
    }

    app.status =
      ApplicationStatus.REJECTED;

    app.rejectionReason =
      reason.trim();

    app.reviewedBy =
      new Types.ObjectId(adminId);

    app.reviewedAt = new Date();

    await app.save();

    const user = app.userId as any;

    if (!user?._id) {
      throw new NotFoundException(
        'Application user not found',
      );
    }

    await this.notificationsService
      .createNotification({
        userId: user._id,

        title:
          'Vendor Application Update',

        message:
          `Your application was not approved. Reason: ${reason.trim()}`,

        type:
          NotificationType.VENDOR_REJECTED,
      });

    this.notificationsService
      .sendVendorRejection(
        user.email,
        user.firstName,
        reason.trim(),
      )
      .catch(console.error);

    return app;
  }

  // =========================================================
  // ADMIN - PENDING APPLICATION COUNT
  // =========================================================

  async getPendingCount() {
    return this.appModel.countDocuments({
      status:
        ApplicationStatus.PENDING,
    });
  }
}