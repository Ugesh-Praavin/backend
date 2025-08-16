import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';



@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  group_id: number;

  @Column()
  user_id: number;

  @Column()
  anonymous_name: string; // "Anonymous 1", "Anonymous 2", etc.

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  joined_at: Date;

  @ManyToOne(() => Group, (group) => group.members)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
