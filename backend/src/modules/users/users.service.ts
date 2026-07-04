import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import {
  User,
  UserDocument,
  UserStatus,
} from './schemas/user.schema';
import {
  Service,
  ServiceDocument,
} from '../services/schemas/service.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
  @InjectModel(User.name)
  private userModel: Model<UserDocument>,

  @InjectModel(Service.name)
  private serviceModel: Model<ServiceDocument>,

  private configService: ConfigService,
) {
  cloudinary.config({
    cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
    api_key: this.configService.get('CLOUDINARY_API_KEY'),
    api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
  });
}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).populate('savedServices');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: any) {
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (dto.firstName !== undefined) {
    user.firstName = dto.firstName;
  }

  if (dto.lastName !== undefined) {
    user.lastName = dto.lastName;
  }

  if (dto.phone !== undefined) {
    user.phone = dto.phone;
  }

  if (dto.address !== undefined) {
    user.address = {
      ...((user.address as any) ?? {}),
      ...dto.address,
    };
  }

  await user.save();

  return user;
}

  async uploadAvatar(
  userId: string,
  file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException(
      'Avatar file is required',
    );
  }

  if (!file.mimetype?.startsWith('image/')) {
    throw new BadRequestException(
      'Only image files are allowed',
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new BadRequestException(
      'Avatar must be under 5MB',
    );
  }

  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const result = await new Promise<any>(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder: 'omiqora/avatars',
            resource_type: 'image',
            transformation: [
              {
                width: 400,
                height: 400,
                crop: 'fill',
                gravity: 'face',
              },
            ],
          },
          (err, res) =>
            err ? reject(err) : resolve(res),
        );

      stream.end(file.buffer);
    },
  );

  const oldAvatarPublicId = user.avatarPublicId;

  user.avatar = result.secure_url;
  user.avatarPublicId = result.public_id;

  await user.save();

  if (oldAvatarPublicId) {
    await cloudinary.uploader
      .destroy(oldAvatarPublicId)
      .catch(() => undefined);
  }

  return {
    avatar: user.avatar,
    profileCompletion: user.profileCompletion,
  };
}

  async toggleSavedService(userId: string, serviceId: string) {
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const serviceObjId = new Types.ObjectId(serviceId);

  const isSaved = user.savedServices?.some(
    (id) => id.toString() === serviceObjId.toString(),
  );

  if (isSaved) {
    user.savedServices = user.savedServices.filter(
      (id) => id.toString() !== serviceObjId.toString(),
    );
  } else {
    user.savedServices.push(serviceObjId);
  }

  await user.save();

  return {
    saved: !isSaved,
    message: isSaved
      ? 'Service removed from favorites'
      : 'Service added to favorites',
  };
}

  async getSavedServices(userId: string) {
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return await this.serviceModel
    .find({
      _id: { $in: user.savedServices },
    })
    .populate('vendorId')
    .populate('categoryId');
}

async deleteAccount(
  userId: string,
  password: string,
) {
  if (!password) {
    throw new BadRequestException(
      'Password is required',
    );
  }

  const user = await this.userModel
    .findById(userId)
    .select('+password +refreshTokens');

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.role === 'admin') {
    throw new BadRequestException(
      'Admin accounts cannot be deleted from the profile page',
    );
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.password,
  );

  if (!passwordValid) {
    throw new UnauthorizedException(
      'Password is incorrect',
    );
  }

  if (user.avatarPublicId) {
    await cloudinary.uploader
      .destroy(user.avatarPublicId)
      .catch(() => undefined);
  }

  user.status = UserStatus.DELETED;
  user.refreshTokens = [];
  user.avatar = undefined;
  user.avatarPublicId = undefined;

  await user.save();

  return {
    message: 'Account deleted successfully',
  };
}



  // Admin only
  async getAllUsers(page = 1, limit = 20, role?: string, status?: string, search?: string) {
    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
    ];

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -refreshTokens'),
      this.userModel.countDocuments(query),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUserStatus(userId: string, status: string) {
    const user = await this.userModel.findByIdAndUpdate(userId, { status }, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).select('-password -refreshTokens');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
