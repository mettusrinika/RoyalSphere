import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VendorApplicationsService } from './vendor-applications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateVendorApplicationDto } from './dto/create-vendor-application.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ApproveVendorDto } from './dto/approve-vendor.dto';
import { RejectVendorDto } from './dto/reject-vendor.dto';

@ApiTags('Vendor Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor-applications')
export class VendorApplicationsController {
  constructor(private service: VendorApplicationsService) {}

  @Post('apply')
  apply(@Request() req, @Body() dto: CreateVendorApplicationDto) {
    return this.service.apply(req.user._id.toString(), dto);
  }

 @Post('upload-document')
@UseInterceptors(FileInterceptor('file'))
uploadDoc(
  @Request() req,
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadDocumentDto,
) {
  return this.service.uploadDocument(
    req.user._id.toString(),
    dto.type,
    file,
  );
}

  @Get('my-application')
  getMyApp(@Request() req) {
    return this.service.getMyApplication(req.user._id.toString());
  }

  @Get()
@Roles('admin')
getAll(
  @Query('status') status?: string,
  @Query('page') page = 1,
  @Query('limit') limit = 20,
) {
  return this.service.getAllApplications(status, +page, +limit);
}
  @Get('pending-count')
  @Roles('admin')
  getPendingCount() {
    return this.service.getPendingCount();
  }

  @Get(':id')
  @Roles('admin')
  getById(@Param('id') id: string) {
    return this.service.getApplicationById(id);
  }

  @Patch(':id/documents/:type/verify')
@Roles('admin')
verifyDocument(
  @Request() req,
  @Param('id') id: string,
  @Param('type') type: string,
  @Body()
  body: {
    status: 'verified' | 'rejected';
    reason?: string;
  },
) {
  return this.service.verifyDocument(
    id,
    type,
    req.user._id.toString(),
    body.status,
    body.reason,
  );
}

@Patch(':id/approve')
@Roles('admin')
approve(
  @Request() req,
  @Param('id') id: string,
  @Body() dto: ApproveVendorDto,
) {
  return this.service.approve(
    id,
    req.user._id.toString(),
    dto.notes,
  );
}

  @Patch(':id/reject')
@Roles('admin')
reject(
  @Request() req,
  @Param('id') id: string,
  @Body() dto: RejectVendorDto,
) {
  return this.service.reject(
    id,
    req.user._id.toString(),
    dto.reason,
  );
}
}
