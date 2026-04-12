import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Bitvote } from '../../bitvote/entities/bitvote.entity';
import { Dimension } from '../../bitvote/entities/dimension.entity';
import { Item } from '../../bitvote/entities/item.entity';

@Entity('user_rankings')
@Unique(['userId', 'dimensionId', 'itemId'])
export class UserRanking {
  @PrimaryGeneratedColumn('uuid')
  userRankingId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  bitvoteId: string;

  @ManyToOne(() => Bitvote, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bitvoteId' })
  bitvote: Bitvote;

  @Column()
  dimensionId: string;

  @ManyToOne(() => Dimension, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dimensionId' })
  dimension: Dimension;

  @Column()
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  rank: number;

  @Column({ default: false })
  complete: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
