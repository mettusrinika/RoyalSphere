import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { ReviewsService } from './reviews.service';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { ReportReviewDto } from './dto/report-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  @Roles('customer')
  @ApiBearerAuth()
  create(
    @Request() req,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(
      req.user._id.toString(),
      dto,
    );
  }

  @Patch(':id')
  @Roles('customer')
  @ApiBearerAuth()
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(
      id,
      req.user._id.toString(),
      dto,
    );
  }

  @Delete(':id')
  @Roles('customer')
  @ApiBearerAuth()
  remove(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.reviewsService.deleteReview(
      id,
      req.user._id.toString(),
    );
  }

  @Get('my')
  @Roles('customer')
  @ApiBearerAuth()
  getMyReviews(@Request() req) {
    return this.reviewsService.getMyReviews(
      req.user._id.toString(),
    );
  }

  @Public()
  @Get('service/:serviceId')
  getServiceReviews(
    @Param('serviceId') serviceId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.getServiceReviews(
      serviceId,
      query,
    );
  }

  @Public()
  @Get('vendor/:vendorId')
  getVendorReviews(
    @Param('vendorId') vendorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getVendorReviews(
      vendorId,
      Number(page),
      Number(limit),
    );
  }

  @Patch(':id/reply')
  @Roles('vendor')
  @ApiBearerAuth()
  reply(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.replyToReview(
      id,
      req.user._id.toString(),
      dto.reply,
    );
  }

  @Post(':id/helpful')
  @ApiBearerAuth()
  helpful(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.reviewsService.markHelpful(
      id,
      req.user._id.toString(),
    );
  }

  @Post(':id/report')
  @ApiBearerAuth()
  report(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReportReviewDto,
  ) {
    return this.reviewsService.reportReview(
      id,
      req.user._id.toString(),
      dto,
    );
  }

  @Patch(':id/moderate')
  @Roles('admin')
  @ApiBearerAuth()
  moderate(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderateReview(
      id,
      dto,
    );
  }

  @Get('analytics/vendor/:vendorId')
  @Roles('vendor', 'admin')
  @ApiBearerAuth()
  analytics(
    @Param('vendorId') vendorId: string,
  ) {
    return this.reviewsService.getReviewAnalytics(
      vendorId,
    );
  }
}