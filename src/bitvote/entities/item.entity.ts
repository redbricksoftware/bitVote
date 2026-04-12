import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bitvote } from './bitvote.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column()
  bitvoteId: string;

  @ManyToOne(() => Bitvote, (bv) => bv.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bitvoteId' })
  bitvote: Bitvote;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  sortOrder: number;
}
