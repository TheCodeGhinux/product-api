// import * as bcrypt from 'bcryptjs';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AbstractBaseEntity } from '@entities/base.entity';

export enum UserType {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  USER = 'vendor',
}

@Entity({ name: 'users' })
export class User extends AbstractBaseEntity {
  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ unique: false, nullable: true })
  status: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  is_active: boolean;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  // hashPassword: string;

  // @BeforeInsert()
  // @BeforeUpdate()
  // async hashPassword() {
  //   this.password = await bcrypt.hash(this.password, 10);
  // }
}
