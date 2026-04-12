import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bitvote } from './entities/bitvote.entity';
import { Item } from './entities/item.entity';
import { Dimension } from './entities/dimension.entity';
import { BitvoteService } from './services/bitvote.service';
import { BitvoteController } from './controllers/bitvote.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bitvote, Item, Dimension])],
  providers: [BitvoteService],
  controllers: [BitvoteController],
  exports: [BitvoteService],
})
export class BitvoteModule {}
