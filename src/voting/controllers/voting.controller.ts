import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/guards/accessToken.guard';
import { UserDecorator } from '../../auth/decorators/user.decorator';
import { VotingService } from '../services/voting.service';
import { AnswerDto } from '../dtos/answer.dto';

@ApiTags('Voting')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('voting')
export class VotingController {
  constructor(private votingService: VotingService) {}

  @Version('1')
  @Get(':bitvoteId/question')
  getQuestion(
    @UserDecorator() user: any,
    @Param('bitvoteId') bitvoteId: string,
    @Query('dimensionId') dimensionId?: string,
  ) {
    return this.votingService.getQuestion(user.sub, bitvoteId, dimensionId);
  }

  @Version('1')
  @Post(':bitvoteId/answer')
  answer(
    @UserDecorator() user: any,
    @Param('bitvoteId') bitvoteId: string,
    @Body() dto: AnswerDto,
  ) {
    return this.votingService.answer(user.sub, bitvoteId, dto);
  }

  @Version('1')
  @Get(':bitvoteId/progress')
  getProgress(
    @UserDecorator() user: any,
    @Param('bitvoteId') bitvoteId: string,
  ) {
    return this.votingService.getProgress(user.sub, bitvoteId);
  }

  @Version('1')
  @Get(':bitvoteId/results')
  getResults(@Param('bitvoteId') bitvoteId: string) {
    return this.votingService.getResults(bitvoteId);
  }
}
