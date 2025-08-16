import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { GroupType } from '../enums/group-type.enum';
import { GroupMember } from './group-member.entity';
import { GroupMessage } from './group-message.entity';


@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: GroupType,
    default: GroupType.MOOD_BASED
  })
  type: GroupType;

  @Column({ default: 0 })
  member_count: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @OneToMany(() => GroupMessage, (message) => message.group)
  messages: GroupMessage[];
}