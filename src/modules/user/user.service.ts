import { Injectable, NotFoundException } from '@nestjs/common';
import admin from 'src/config/firebase.config';
import { UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  private userCollection: FirebaseFirestore.CollectionReference;

  constructor() {
    this.userCollection = admin.firestore().collection('users');
  }

  // Get user by UID
  async getUserById(uid: string) {
    const doc = await this.userCollection.doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }
    return { uid, ...doc.data() };
  }

  // Get user by username
  async getUserByUsername(userName: string) {
    const snapshot = await this.userCollection.where('userName', '==', userName).limit(1).get();
    if (snapshot.empty) {
      throw new NotFoundException(`User with username ${userName} not found`);
    }
    const doc = snapshot.docs[0];
    return { uid: doc.id, ...doc.data() };
  }

  // Update user profile
  async updateUser(uid: string, updateUserDto: UpdateUserDto) {
    await this.userCollection.doc(uid).set(updateUserDto, { merge: true });
    const updated = await this.userCollection.doc(uid).get();
    return { uid, ...updated.data() };
  }

  // Delete user
  async deleteUser(uid: string) {
    await this.userCollection.doc(uid).delete();
    return { message: `User ${uid} deleted successfully` };
  }
}
