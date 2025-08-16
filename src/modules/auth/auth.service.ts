import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import admin from "src/config/firebase.config";

@Injectable()
export class AuthService {
    logout(token: any) {
        throw new Error("Method not implemented.");
    }
    private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    private readonly jwtExpiresIn = '7d'; // 7 days

    async register(userName: string, password: string, customUid?: string) {
  try {
    // 🔹 Check if username already exists
    const existingUser = await admin.firestore()
      .collection('users')
      .where('userName', '==', userName)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      throw new BadRequestException('Username already taken');
    }

    // Generate UID
    const uid = customUid || admin.firestore().collection("users").doc().id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('users').doc(uid).set({
      userName,
      password: hashedPassword,
      createdAt: now,
      lastLoginDate: now,
      currentStreak: 1,
      longestStreak: 1,
      totalLoginDays: 1
    });

    // Create session token
    const sessionToken = this.generateSessionToken(uid, userName);

    return { 
      uid, 
      userName,
      sessionToken,
      currentStreak: 1,
      longestStreak: 1
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error instanceof BadRequestException 
      ? error 
      : new BadRequestException("User registration failed");
  }
}


    async login(userName: string, password: string) {
        try {
            const userSnapshot = await admin.firestore().collection('users')
                .where('userName', '==', userName)
                .limit(1)
                .get();
            
            if (userSnapshot.empty) {
                throw new UnauthorizedException("User not found");
            }

            const userDoc = userSnapshot.docs[0];
            const userData: any = userDoc.data();
            
            const isPasswordValid = await bcrypt.compare(password, userData.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException("Invalid password");
            }

            // Update streak and login date
            const updatedUserData = await this.updateUserStreak(userDoc.id, userData);

            // Create session token
            const sessionToken = this.generateSessionToken(userDoc.id, userData.userName);

            return { 
                uid: userDoc.id, 
                userName: userData.userName,
                sessionToken,
                ...updatedUserData
            };
        } catch (error) {
            console.error("Error logging in:", error);
            throw new UnauthorizedException("User login failed");
        }
    }

    private generateSessionToken(uid: string, userName: string): string {
        const payload = { uid, userName };
        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
    }

    async validateSessionToken(token: string): Promise<any> {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }

    private async updateUserStreak(uid: string, userData: any) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Firestore Timestamp check
        const lastLoginDateRaw = userData.lastLoginDate?.toDate?.() || userData.lastLoginDate || new Date(0);
        const lastLoginDay = new Date(lastLoginDateRaw.getFullYear(), lastLoginDateRaw.getMonth(), lastLoginDateRaw.getDate());

        const daysDifference = Math.floor((today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24));

        let currentStreak = userData.currentStreak || 0;
        let longestStreak = userData.longestStreak || 0;
        let totalLoginDays = userData.totalLoginDays || 0;

        if (daysDifference === 0) {
            // Same day login
        } else if (daysDifference === 1) {
            currentStreak += 1;
            totalLoginDays += 1;
            if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else if (daysDifference > 1) {
            currentStreak = 1;
            totalLoginDays += 1;
        }

        const updatedData = {
            lastLoginDate: admin.firestore.FieldValue.serverTimestamp(),
            currentStreak,
            longestStreak,
            totalLoginDays
        };

        await admin.firestore().collection('users').doc(uid).update(updatedData);
        return updatedData;
    }

    async getUserStreak(uid: string) {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new BadRequestException("User not found");
        }
        return userDoc.data();
    }

    async refreshToken(oldToken: string): Promise<string> {
        const decoded: any = await this.validateSessionToken(oldToken);
        return this.generateSessionToken(decoded.uid, decoded.userName);
    }
}
