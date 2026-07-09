import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VendorApplication,
  VendorApplicationDocument,
} from '../vendor-applications/schemas/vendor-application.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';

@Injectable()
export class PlatformReadinessService {
  constructor(
    @InjectModel(VendorApplication.name)
    private readonly vendors: Model<VendorApplicationDocument>,
    @InjectModel(Service.name)
    private readonly services: Model<ServiceDocument>,
  ) {}

  async submitKyc(userId: string, provider = 'manual_admin_review') {
    const app = await this.vendors.findOne({ userId });
    if (!app) throw new NotFoundException('Vendor application not found');
    if (!app.documents?.length) {
      throw new BadRequestException('Upload verification documents before KYC submission');
    }
    app.kyc = {
      status: provider === 'manual_admin_review' ? 'documents_submitted' : 'provider_pending',
      provider,
      submittedAt: new Date(),
    };
    await app.save();
    return {
      kyc: app.kyc,
      providerSetupRequired: provider !== 'manual_admin_review',
    };
  }

  async submitPayout(userId: string, body: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  }) {
    const app = await this.vendors.findOne({ userId }).select('+bankDetails');
    if (!app) throw new NotFoundException('Vendor application not found');

    const accountNumber = String(body.accountNumber ?? '').replace(/\s/g, '');
    const ifscCode = String(body.ifscCode ?? '').trim().toUpperCase();
    if (!/^\d{6,18}$/.test(accountNumber)) {
      throw new BadRequestException('Invalid bank account number');
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      throw new BadRequestException('Invalid IFSC code');
    }

    app.bankDetails = {
      accountName: String(body.accountName ?? '').trim(),
      accountNumber,
      ifscCode,
      bankName: String(body.bankName ?? '').trim(),
    };
    app.payoutOnboarding = {
      status: 'details_submitted',
      provider: 'razorpay_route',
      accountLast4: accountNumber.slice(-4),
      ifscCode,
      bankName: app.bankDetails.bankName,
      submittedAt: new Date(),
    };
    await app.save();

    return {
      payoutOnboarding: app.payoutOnboarding,
      message: 'Bank details saved for payout onboarding',
      providerSetupRequired: true,
    };
  }

  async vendorReadiness(userId: string) {
    const app = await this.vendors.findOne({ userId });
    if (!app) throw new NotFoundException('Vendor application not found');
    return {
      applicationStatus: app.status,
      kyc: app.kyc ?? { status: 'not_started' },
      payoutOnboarding: app.payoutOnboarding ?? { status: 'not_started' },
      payoutEligible:
        app.status === 'approved' &&
        app.kyc?.status === 'verified' &&
        app.payoutOnboarding?.status === 'active',
    };
  }

  async resolveGeoConfiguration(serviceId: string) {
    const service = await this.services.findById(serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const serviceLat = Number(service.location?.latitude);
    const serviceLng = Number(service.location?.longitude);
    const serviceRadius = Number(service.location?.serviceRadius ?? 0);

    if (Number.isFinite(serviceLat) && Number.isFinite(serviceLng) && serviceRadius > 0) {
      return {
        configured: true as const,
        source: 'service' as const,
        latitude: serviceLat,
        longitude: serviceLng,
        serviceRadiusKm: serviceRadius,
      };
    }

    const vendorApplication = await this.vendors.findOne({
      userId: service.vendorId,
      status: 'approved',
    });

    const vendorLat = Number(vendorApplication?.serviceLocation?.latitude);
    const vendorLng = Number(vendorApplication?.serviceLocation?.longitude);
    const vendorRadius = Number(vendorApplication?.serviceLocation?.serviceRadiusKm ?? 0);

    if (Number.isFinite(vendorLat) && Number.isFinite(vendorLng) && vendorRadius > 0) {
      return {
        configured: true as const,
        source: 'vendor_application' as const,
        latitude: vendorLat,
        longitude: vendorLng,
        serviceRadiusKm: vendorRadius,
      };
    }

    return {
      configured: false as const,
      source: 'unconfigured' as const,
    };
  }

  async checkServiceability(serviceId: string, latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('Valid latitude and longitude are required');
    }

    const geo = await this.resolveGeoConfiguration(serviceId);

    if (!geo.configured) {
      return {
        serviceable: null,
        configured: false,
        source: geo.source,
        reason: 'Vendor has not configured geo serviceability',
      };
    }

    const latitudeOrigin = geo.latitude;
    const longitudeOrigin = geo.longitude;
    const serviceRadiusKm = geo.serviceRadiusKm;
    const source = geo.source;

    const toRad = (value: number) => value * Math.PI / 180;
    const earthKm = 6371;
    const dLat = toRad(latitude - latitudeOrigin);
    const dLng = toRad(longitude - longitudeOrigin);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latitudeOrigin)) *
      Math.cos(toRad(latitude)) *
      Math.sin(dLng / 2) ** 2;
    const distanceKm = earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return {
      serviceable: distanceKm <= serviceRadiusKm,
      configured: true,
      source,
      distanceKm: Number(distanceKm.toFixed(2)),
      serviceRadiusKm,
    };
  }
}