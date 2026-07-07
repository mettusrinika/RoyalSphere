import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Request() req, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notificationsService.getUserNotifications(req.user._id.toString(), +page, +limit);
  }

  @Patch(':id/read')
  markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user._id.toString(), id);
  }

  @Patch('read-all')
  markAllRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user._id.toString());
  }

  @Post('push-token')
  registerPushToken(
    @Request() req,
    @Body() body: { expoPushToken: string },
  ) {
    return this.notificationsService.registerPushToken(
      req.user._id.toString(),
      body.expoPushToken,
    );
  }

  @Delete('push-token')
  unregisterPushToken(@Request() req) {
    return this.notificationsService.unregisterPushToken(
      req.user._id.toString(),
    );
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(req.user._id.toString(), id);
  }
}
