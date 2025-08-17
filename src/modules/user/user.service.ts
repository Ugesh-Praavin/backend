import { Injectable, NotFoundException } from '@nestjs/common';
import { admin } from 'src/config/firebase.config';

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
    const snapshot = await this.userCollection
      .where('userName', '==', userName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException(`User with username ${userName} not found`);
    }

    const doc = snapshot.docs[0];
    return { uid: doc.id, ...doc.data() };
  }
}
