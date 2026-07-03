import {
  Controller, Get, Put, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user._id.toString());
  }

  @Put('profile')
  updateProfile(@Request() req, @Body() dto: any) {
    return this.usersService.updateProfile(req.user._id.toString(), dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(req.user._id.toString(), file);
  }

  @Post('saved-services/:serviceId')
toggleSaved(
  @Request() req,
  @Param('serviceId') serviceId: string,
) {
  console.log('======================');
  console.log('Logged in user:', req.user);
  console.log('Service ID:', serviceId);
  console.log('======================');

  return this.usersService.toggleSavedService(
    req.user._id.toString(),
    serviceId,
  );
}

  @Get('saved-services')
  getSaved(@Request() req) {
    return this.usersService.getSavedServices(req.user._id.toString());
  }

  @Delete('account')
@ApiOperation({ summary: 'Delete current user account' })
deleteAccount(
  @Request() req,
  @Body('password') password: string,
) {
  return this.usersService.deleteAccount(
    req.user._id.toString(),
    password,
  );
}

  // Admin routes
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.getAllUsers(+page, +limit, role, status, search);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateUserStatus(id, status);
  }
}
