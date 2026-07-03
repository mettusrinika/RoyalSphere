import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from './schemas/service.schema';
import { User, UserDocument } from '../users/schemas/user.schema';


@Injectable()
export class ServicesService {
 constructor(
  @InjectModel(Service.name)
  private serviceModel: Model<ServiceDocument>,

  @InjectModel(User.name)
  private userModel: Model<UserDocument>,

  private configService: ConfigService,
) {
    cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async search(query: {
    q?: string; category?: string; city?: string;
    minPrice?: number; maxPrice?: number; rating?: number;
    page?: number; limit?: number; sort?: string;
  }) {
    const { q, category, city, minPrice, maxPrice, rating, page = 1, limit = 12, sort = 'relevance' } = query;
    const filter: any = {
    status: ServiceStatus.ACTIVE,
};
    if (q) filter.$text = { $search: q };
   if (category) {
  if (Types.ObjectId.isValid(category)) {
    filter.categoryId = new Types.ObjectId(category);
  } else {
    return {
      services: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }
}
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = +minPrice;
      if (maxPrice) filter.basePrice.$lte = +maxPrice;
    }
    if (rating) filter.rating = { $gte: +rating };

    const sortMap: any = {
      relevance: { trendingScore: -1 },
      rating: { rating: -1 },
      price_asc: { basePrice: 1 },
      price_desc: { basePrice: -1 },
      newest: { createdAt: -1 },
      popular: { bookingCount: -1 },
    };

    const skip = (page - 1) * limit;
    const [services, total] = await Promise.all([
      this.serviceModel
        .find(filter)
        .sort(sortMap[sort] || sortMap.relevance)
        .skip(skip)
        .limit(+limit)
        .populate('vendorId', 'firstName lastName vendorProfile avatar')
        .populate('categoryId', 'name slug icon'),
      this.serviceModel.countDocuments(filter),
    ]);

    return { services, total, page: +page, totalPages: Math.ceil(total / +limit) };
  }

  async findById(id: string) {
    const service = await this.serviceModel
      .findById(id)
      .populate('vendorId', 'firstName lastName vendorProfile avatar phone')
      .populate('categoryId', 'name slug icon');
    if (!service) throw new NotFoundException('Service not found');
    // Increment view count
    await this.serviceModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    return service;
  }

  async getVendorServices(vendorId: string) {
    return this.serviceModel
      .find({ vendorId: new Types.ObjectId(vendorId) })
      .populate('categoryId', 'name slug icon')
      .sort({ createdAt: -1 });
  }

async create(vendorId: string, dto: any) {
  const vendor = await this.userModel.findById(vendorId);

  if (!vendor) {
    throw new NotFoundException('Vendor not found');
  }

  if (vendor.role !== 'vendor' || !vendor.isVendorApproved) {
    throw new ForbiddenException(
      'Vendor account is not approved yet.',
    );
  }

  return this.serviceModel.create({
  ...dto,
  vendorId: new Types.ObjectId(vendorId),

  // Vendor is already approved by admin
status: ServiceStatus.ACTIVE,
approvedBy: null,
approvedAt: new Date(),
rejectionReason: null,
});
}
async getPendingServices(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    this.serviceModel
      .find({ status: ServiceStatus.PENDING })
      .populate('vendorId', 'firstName lastName email vendorProfile')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    this.serviceModel.countDocuments({
      status: ServiceStatus.PENDING,
    }),
  ]);

  return {
    services,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
async update(id: string, vendorId: string, dto: any) {
  const service = await this.serviceModel.findById(id);

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  if (service.vendorId.toString() !== vendorId) {
    throw new ForbiddenException('Not your service');
  }

  return this.serviceModel.findByIdAndUpdate(
  id,
  {
    $set: {
      ...dto,
      status: ServiceStatus.ACTIVE,
approvedBy: null,
approvedAt: new Date(),
rejectionReason: null,
    },
  },
  { new: true },
);
}
  async delete(id: string, vendorId: string) {
    const service = await this.serviceModel.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    if (service.vendorId.toString() !== vendorId) throw new ForbiddenException('Not your service');
    await this.serviceModel.findByIdAndDelete(id);
    return { message: 'Service deleted' };
  }
async approveService(
  serviceId: string,
  adminId: string,
) {
  const service = await this.serviceModel.findById(serviceId);

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  if (service.status === ServiceStatus.ACTIVE) {
    return service;
  }

  service.status = ServiceStatus.ACTIVE;
  service.approvedBy = new Types.ObjectId(adminId);
  service.approvedAt = new Date();
  service.rejectionReason = null;

  await service.save();

  return service;
}
async rejectService(
  serviceId: string,
  reason: string,
) {
  const service = await this.serviceModel.findById(serviceId);

  if (!service) {
    throw new NotFoundException('Service not found');
  }

service.status = ServiceStatus.REJECTED;
service.rejectionReason = reason;
service.approvedBy = null;
service.approvedAt = null;

  await service.save();

  return service;
}
async getAllServices(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    this.serviceModel
      .find()
      .populate('vendorId', 'firstName lastName email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    this.serviceModel.countDocuments(),
  ]);

  return {
    services,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
} 
async uploadImages(
  id: string,
  vendorId: string,
  files: Express.Multer.File[],
) {
  console.log('Uploading images...');
  console.log('Service ID:', id);
  console.log('Vendor ID:', vendorId);
  console.log('Files:', files?.length);

  const service = await this.serviceModel.findById(id);

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  if (service.vendorId.toString() !== vendorId) {
    throw new ForbiddenException('Not your service');
  }

  if (!files || files.length === 0) {
    throw new NotFoundException('No files uploaded');
  }

  try {
    const uploads = await Promise.all(
      files.map(
        file =>
          new Promise<{ url: string; publicId: string }>(
            (resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: 'royal-sphere/services',
                },
                (error, result) => {
                  if (error) {
                    console.error(error);
                    reject(error);
                  } else {
                    resolve({
                      url: result!.secure_url,
                      publicId: result!.public_id,
                    });
                  }
                },
              );

              stream.end(file.buffer);
            },
          ),
      ),
    );

    service.images.push(...uploads.map(u => u.url));
    service.imagePublicIds.push(...uploads.map(u => u.publicId));

    await service.save();

    return service;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
}
async deleteImage(
  serviceId: string,
  vendorId: string,
  index: number,
) {
  const service = await this.serviceModel.findById(serviceId);

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  if (service.vendorId.toString() !== vendorId) {
    throw new ForbiddenException('Not your service');
  }

  if (
    index < 0 ||
    index >= service.images.length
  ) {
    throw new NotFoundException('Image not found');
  }

  const publicId = service.imagePublicIds[index];

  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {}
  }

  service.images.splice(index, 1);
  service.imagePublicIds.splice(index, 1);

  await service.save();

  return {
    message: 'Image deleted successfully',
  };
}
  async getFeatured(limit = 8) {
    return this.serviceModel
      .find({ status: ServiceStatus.ACTIVE })
      .sort({ trendingScore: -1, rating: -1 })
      .limit(limit)
      .populate('vendorId', 'firstName lastName vendorProfile avatar')
      .populate('categoryId', 'name slug icon');
  }

 async getByCategory(categoryId: string, page = 1, limit = 12) {
  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    this.serviceModel
      .find({
        categoryId: new Types.ObjectId(categoryId),
        status: ServiceStatus.ACTIVE,
      })
      .sort({ trendingScore: -1 })
      .skip(skip)
      .limit(limit)
      .populate('vendorId', 'firstName lastName vendorProfile avatar')
      .populate('categoryId', 'name slug'),

    this.serviceModel.countDocuments({
      categoryId: new Types.ObjectId(categoryId),
      status: ServiceStatus.ACTIVE,
    }),
  ]);

  return {
    services,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

async getPendingServicesCount() {
  return this.serviceModel.countDocuments({
    status: ServiceStatus.PENDING,
  });
}
}