import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn } from 'typeorm';
import { AbstractBaseEntity } from '@entities/base.entity';

@Entity('products')
export class Product extends AbstractBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('text')
  description: string;

  @Column('int')
  stockQuantity: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  ownerId: string;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
