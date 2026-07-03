import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  Param,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // --------------------------------------------------------------------------
  // Smart Vendor Recommendations
  // --------------------------------------------------------------------------

  @Public()
  @Get('recommendations/vendors')
  async vendorRecommendations(
    @Query('categoryId') categoryId?: string,
    @Query('city') city?: string,
    @Query('budget') budget?: number,
    @Query('limit') limit = 8,
    @Request() req?: any,
  ): Promise<any> {
    return this.aiService.getVendorRecommendations({
      categoryId,
      city,
      budget: budget ? Number(budget) : undefined,
      userId: req?.user?._id?.toString(),
      limit: Number(limit),
    });
  }

  // --------------------------------------------------------------------------
  // Smart Service Recommendations
  // --------------------------------------------------------------------------

  @Get('recommendations/services')
  async getServiceRecommendations(
    @Request() req: any,
    @Query('limit') limit = 8,
  ): Promise<any> {
    const userId =
      req?.user?.role === 'customer'
        ? req.user._id.toString()
        : undefined;

    return this.aiService.getServiceRecommendations(
      userId,
      Number(limit),
    );
  }

  // --------------------------------------------------------------------------
  // AI Budget Planner
  // --------------------------------------------------------------------------

  @Public()
  @Post('budget-planner')
  async budgetPlanner(
    @Body()
    dto: {
      eventType: string;
      totalBudget: number;
      guestCount: number;
      city?: string;
      preferences?: string[];
    },
  ): Promise<any> {
    return this.aiService.planBudget(dto);
  }

  // --------------------------------------------------------------------------
  // Update Trending Scores
  // --------------------------------------------------------------------------

  @Roles('admin')
  @ApiBearerAuth()
  @Post('update-trending')
  async updateTrending(): Promise<{ updated: number }> {
    return this.aiService.updateTrendingScores();
  }
  @Get('similar-services/:serviceId')
async getSimilarServices(
  @Param('serviceId') serviceId: string,
  @Query('limit') limit = 10,
) {
  return this.aiService.getSimilarServices(
    serviceId,
    +limit,
  );
}

@Get('frequently-booked/:serviceId')
async getFrequentlyBookedTogether(
  @Param('serviceId') serviceId: string,
  @Query('limit') limit = 5,
) {
  return this.aiService.getFrequentlyBookedTogether(
    serviceId,
    +limit,
  );
}
@Get('home')
async getHomeFeed(
  @Request() req,
) {
  return this.aiService.getHomeFeed(
    req.user._id.toString(),
  );
}
@Get('search')
async smartSearch(
  @Query('q') q: string,
  @Query('city') city?: string,
  @Query('category') category?: string,
  @Query('budget') budget?: number,
  @Query('limit') limit = 20,
) {
  return this.aiService.smartSearch({
    q,
    city,
    category,
    budget: budget ? +budget : undefined,
    limit: +limit,
  });
}

@Get('seasonal')
async seasonalRecommendations(
  @Query('city') city?: string,
) {
  return this.aiService.getSeasonalRecommendations(
    city,
  );
}

@Post('budget-optimizer')
async optimizeBudget(
  @Body() body: {
    eventType: string;
    totalBudget: number;
    guestCount: number;
    city?: string;
  },
) {
  return this.aiService.optimizeBudget(body);
}
@Get('vendor-insights/:vendorId')
async getVendorInsights(
  @Param('vendorId') vendorId: string,
) {
  return this.aiService.getVendorInsights(
    vendorId,
  );
}
@Get('customer-insights')
async getCustomerInsights(
  @Request() req,
) {
  return this.aiService.getCustomerInsights(
    req.user._id.toString(),
  );
}
@Get('trust-analysis/:vendorId')
async trustAnalysis(
  @Param('vendorId') vendorId: string,
) {
  return this.aiService.getTrustAnalysis(
    vendorId,
  );
}
@Get('package/:serviceId')
async recommendPackage(
  @Param('serviceId') serviceId: string,
) {
  return this.aiService.recommendPackage(
    serviceId,
  );
}
}