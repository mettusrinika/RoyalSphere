import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EditMessageDto } from './dto/edit-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversation/:bookingId')
  createConversation(@Request() req, @Param('bookingId') bookingId: string) {
    return this.messagingService.createConversation(
      bookingId,
      req.user._id.toString(),
    );
  }

  @Get('conversations')
  getConversations(@Request() req) {
    return this.messagingService.getUserConversations(
      req.user._id.toString(),
    );
  }

  @Get('conversation/:conversationId')
  getConversationMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagingService.getConversationMessages(
      conversationId,
      req.user._id.toString(),
      page,
      limit,
    );
  }

  @Post('send/:conversationId')
  sendMessage(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(
      conversationId,
      req.user._id.toString(),
      dto.content,
      dto.type,
      dto.fileUrl,
      dto.replyTo,
    );
  }

  @Patch('read/:conversationId')
  markAsRead(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.markAsRead(
      conversationId,
      req.user._id.toString(),
    );
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.messagingService.getUnreadCount(req.user._id.toString());
  }

  @Patch('archive/:conversationId')
  archiveConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.archiveConversation(conversationId, req.user._id.toString());
  }

  @Patch('unarchive/:conversationId')
  unarchiveConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.unarchiveConversation(conversationId, req.user._id.toString());
  }

  @Patch('delete/:messageId')
  deleteMessage(@Request() req, @Param('messageId') messageId: string) {
    return this.messagingService.deleteMessage(messageId, req.user._id.toString());
  }

  @Patch('block/:conversationId')
  blockConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.blockConversation(conversationId, req.user._id.toString());
  }

  @Patch('unblock/:conversationId')
  unblockConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.unblockConversation(conversationId, req.user._id.toString());
  }

  @Patch('mute/:conversationId')
  muteConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.muteConversation(conversationId, req.user._id.toString());
  }

  @Patch('unmute/:conversationId')
  unmuteConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.unmuteConversation(conversationId, req.user._id.toString());
  }

  @Patch('close/:conversationId')
  closeConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagingService.closeConversation(conversationId, req.user._id.toString());
  }

  @Get('search/:conversationId')
  searchMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('q') q: string,
  ) {
    return this.messagingService.searchMessages(
      conversationId,
      req.user._id.toString(),
      q,
    );
  }

  @Patch('edit/:messageId')
  editMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
  ) {
    return this.messagingService.editMessage(
      messageId,
      req.user._id.toString(),
      dto.content,
    );
  }
}
