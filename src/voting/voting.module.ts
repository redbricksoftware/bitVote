import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comparison } from './entities/comparison.entity';
import { UserRanking } from './entities/userRanking.entity';
import { Bitvote } from '../bitvote/entities/bitvote.entity';
import { Item } from '../bitvote/entities/item.entity';
import { Dimension } from '../bitvote/entities/dimension.entity';
import { RankingService } from './services/ranking.service';
import { VotingService } from './services/voting.service';
import { VotingController } from './controllers/voting.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comparison, UserRanking, Bitvote, Item, Dimension]),
  ],
  providers: [RankingService, VotingService],
  controllers: [VotingController],
  exports: [VotingService, RankingService],
})
export class VotingModule {}
