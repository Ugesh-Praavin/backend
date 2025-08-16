import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcryptjs';
import admin from "src/config/firebase.config";


@Injectable()

export class AuthService {
    async register(userName: string, password: string, bio: string, customUid?: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            
            const userRecord = await admin.auth().createUser({
                uid: customUid || undefined,
                password,
                displayName: userName
            });
            await admin.firestore().collection('users').doc(userRecord.uid).set({
                userName,
                bio,
                password: hashedPassword,
                createdAt: new Date(),
            });
            return { uid: userRecord.uid, userName, bio };
        } catch (error) {
            console.error("Error creating user:", error);
            throw new Error("User registration failed");
        }
    }

    async login(userName: string, password: string) {
        try {
            const userSnapshot = await admin.firestore().collection('users').where('userName', '==', userName).limit(1).get();
            if (userSnapshot.empty) {
                throw new Error("User not found");
            }

            const userDoc = userSnapshot.docs[0];
            const isPasswordValid = await bcrypt.compare(password, userDoc.data().password);
            if (!isPasswordValid) {
                throw new Error("Invalid password");
            }

            return { uid: userDoc.id, userName: userDoc.data().userName };
        } catch (error) {
            console.error("Error logging in:", error);
            throw new Error("User login failed");
        }
    }
}