import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ServicesService } from './services.service';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // =========================
  // PUBLIC
  // =========================

  @Get()
  @Public()
  search(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('rating') rating?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
    @Query('sort') sort?: string,
  ) {
    return this.servicesService.search({
      q,
      category,
      city,
      minPrice,
      maxPrice,
      rating,
      page: +page,
      limit: +limit,
      sort,
    });
  }

  @Get('featured')
  @Public()
  getFeatured(@Query('limit') limit = 8) {
    return this.servicesService.getFeatured(+limit);
  }

  @Get('category/:categoryId')
  @Public()
  getByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
  ) {
    return this.servicesService.getByCategory(
      categoryId,
      +page,
      +limit,
    );
  }

  @Get('vendor/:vendorId')
  @Public()
  getVendorServices(
    @Param('vendorId') vendorId: string,
  ) {
    return this.servicesService.getVendorServices(
      vendorId,
    );
  }

  

  // =========================
  // VENDOR
  // =========================

  @Get('my-services')
  @Roles('vendor')
  @ApiBearerAuth()
  getMyServices(@Request() req) {
    return this.servicesService.getVendorServices(
      req.user._id.toString(),
    );
  }

  @Post()
  @Roles('vendor')
  @ApiBearerAuth()
  create(
    @Request() req,
    @Body() dto: any,
  ) {
    return this.servicesService.create(
      req.user._id.toString(),
      dto,
    );
  }

  @Put(':id')
  @Roles('vendor')
  @ApiBearerAuth()
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.servicesService.update(
      id,
      req.user._id.toString(),
      dto,
    );
  }

  @Delete(':id')
  @Roles('vendor')
  @ApiBearerAuth()
  delete(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.servicesService.delete(
      id,
      req.user._id.toString(),
    );
  }

  @Post(':id/images')
  @Roles('vendor')
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('files', 12),
  )
  uploadImages(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.servicesService.uploadImages(
      id,
      req.user._id.toString(),
      files,
    );
  }
  @Delete(':id/images/:index')
@Roles('vendor')
@ApiBearerAuth()
deleteImage(
  @Request() req,
  @Param('id') id: string,
  @Param('index') index: string,
) {
  return this.servicesService.deleteImage(
    id,
    req.user._id.toString(),
    Number(index),
  );
}

  // =========================
  // ADMIN
  // =========================

  @Get('admin/pending')
  @Roles('admin')
  @ApiBearerAuth()
  getPendingServices(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.servicesService.getPendingServices(
      +page,
      +limit,
    );
  }

  @Get('admin/all')
  @Roles('admin')
  @ApiBearerAuth()
  getAllServices(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.servicesService.getAllServices(
      +page,
      +limit,
    );
  }
  @Get(':id')
  @Public()
  findById(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id/approve')
  @Roles('admin')
  @ApiBearerAuth()
  approveService(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.servicesService.approveService(
      id,
      req.user._id.toString(),
    );
  }

  @Patch(':id/reject')
  @Roles('admin')
  @ApiBearerAuth()
  rejectService(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.servicesService.rejectService(
      id,
      reason,
    );
  }
}