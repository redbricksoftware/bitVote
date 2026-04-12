import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { BitvoteModule } from './bitvote/bitvote.module';
import { Bitvote } from './bitvote/entities/bitvote.entity';
import { Dimension } from './bitvote/entities/dimension.entity';
import { Item } from './bitvote/entities/item.entity';
import { getConfig } from './shared/config/appConfig';
import { Comparison } from './voting/entities/comparison.entity';
import { UserRanking } from './voting/entities/userRanking.entity';
import { VotingModule } from './voting/voting.module';

const cfg = getConfig();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: cfg.db.host,
      port: cfg.db.port,
      username: cfg.db.username,
      password: cfg.db.password,
      database: cfg.db.database,
      entities: [User, Bitvote, Item, Dimension, Comparison, UserRanking],
      synchronize: cfg.runtime.isLocal,
      migrationsRun: !cfg.runtime.isLocal,
      migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
    }),
    AuthModule,
    BitvoteModule,
    VotingModule,
  ],
})
export class AppModule {}
