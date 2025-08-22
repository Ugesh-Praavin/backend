import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { admin } from 'src/config/firebase.config';
import { envConfig } from "src/config/env.config";

@Injectable()
export class AuthService {

    private revokedTokens: Set<string> = new Set();
    
    private readonly jwtSecret = envConfig.JWT_SECRET;
    private readonly jwtExpiresIn = envConfig.JWT_EXPIRES_IN;

    async register(userName: string, password: string, customUid?: string) {
  try {
    const existingUser = await admin.firestore()
      .collection('users')
      .where('userName', '==', userName)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      throw new BadRequestException('Username already taken');
    }

    // Sanitize customUid
    const uid = customUid && customUid.trim() !== ""
      ? customUid
      : admin.firestore().collection("users").doc().id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Timestamps
    const now = admin.firestore.FieldValue.serverTimestamp(); 
    const nowDate = new Date(); 
    const todayString = nowDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Firestore write block
    try {
      await admin.firestore().collection('users').doc(uid).set({
        userName,
        password: hashedPassword,
        community: "rit_chennai", // Default community for new users
        createdAt: now,
        first_login_date: now,
        last_login_date: now,
        login_dates: [nowDate],         // ✅ Use Date object here
        unique_dates: [todayString],
        currentStreak: 1,
        longestStreak: 1,
        totalLoginDays: 1,
        total_logins: 1
      });
    } catch (firestoreError) {
      console.error("🔥 Firestore write failed:", {
        message: firestoreError.message,
        stack: firestoreError.stack,
        code: firestoreError.code,
        details: firestoreError.details,
      });
      throw new InternalServerErrorException("Database write failed");
    }

    // Create session token
    const sessionToken = this.generateSessionToken(uid, userName);

    return {
      success: true,
      uid,
      userName,
      sessionToken,
      metadata: {
        createdAt: nowDate,
        loginStats: {
          currentStreak: 1,
          longestStreak: 1,
          totalLogins: 1,
        }
      }
    };
  } catch (error) {
    console.error("❌ Registration error:", {
      message: error.message,
      stack: error.stack,
    });

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

    async logout(token: string) {
        try {
            // Validate the token first
            const decoded = await this.validateSessionToken(token);
            
            // Add token to revoked tokens set
            this.revokedTokens.add(token);
            
            // Clean up old revoked tokens (keep only last 1000)
            if (this.revokedTokens.size > 1000) {
                const tokensArray = Array.from(this.revokedTokens);
                this.revokedTokens = new Set(tokensArray.slice(-500));
            }
            
            return { message: 'Successfully logged out' };
        } catch (error) {
            throw new UnauthorizedException('Invalid token for logout');
        }
    }

    private generateSessionToken(uid: string, userName: string): string {
        const payload = { uid, userName };
        // Use any type to bypass JWT type conflicts
        return (jwt as any).sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
    }

    async validateSessionToken(token: string): Promise<any> {
        try {
            // Check if token is revoked
            if (this.revokedTokens.has(token)) {
                throw new UnauthorizedException("Token has been revoked");
            }
            
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException("Invalid or expired token");
        }
    }

   private async updateUserStreak(uid: string, userData: any) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Normalize last login date
  const lastLoginDateRaw =
    userData.last_login_date?.toDate?.() ||
    userData.last_login_date ||
    new Date(0);
  const lastLoginDay = new Date(
    lastLoginDateRaw.getFullYear(),
    lastLoginDateRaw.getMonth(),
    lastLoginDateRaw.getDate()
  );

  const daysDifference = Math.floor(
    (today.getTime() - lastLoginDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentStreak = userData.currentStreak || 0;
  let longestStreak = userData.longestStreak || 0;
  let totalLoginDays = userData.totalLoginDays || 0;
  let totalLogins = userData.total_logins || 0;

  // ✅ Safely convert all old values to JS Dates
  let loginDates: Date[] = (userData.login_dates || []).map((d: any) =>
    d?.toDate ? d.toDate() : new Date(d)
  );

  // ✅ push new JS Date, not FieldValue
  loginDates.push(now);

  // Unique dates
  let uniqueDates = userData.unique_dates || [];
  const todayString = today.toISOString().split("T")[0];
  if (!uniqueDates.includes(todayString)) {
    uniqueDates.push(todayString);
  }

  // Update streak
  if (daysDifference === 0) {
    totalLogins += 1;
  } else if (daysDifference === 1) {
    currentStreak += 1;
    totalLoginDays += 1;
    totalLogins += 1;
    longestStreak = Math.max(longestStreak, currentStreak);
  } else if (daysDifference > 1) {
    currentStreak = 1;
    totalLoginDays += 1;
    totalLogins += 1;
  }

  const updatedData = {
    last_login_date: admin.firestore.FieldValue.serverTimestamp(), // ✅ only here
    login_dates: loginDates, // ✅ array of plain Dates
    unique_dates: uniqueDates,
    currentStreak,
    longestStreak,
    totalLoginDays,
    total_logins: totalLogins
  };

  await admin.firestore().collection("users").doc(uid).update(updatedData);

  return {
    currentStreak,
    longestStreak,
    last_login_date: now,
    login_dates: loginDates,
    totalLoginDays,
    total_logins: totalLogins
  };
}


    async getUserStreak(uid: string) {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new BadRequestException("User not found");
        }
        return userDoc.data();
    }

    /**
     * Get calendar data for a user (unique dates only)
     */
    async getUserCalendarData(uid: string) {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new BadRequestException("User not found");
        }

        const userData = userDoc.data();
        if (!userData) {
            throw new BadRequestException("User data not found");
        }

        const uniqueDates = userData.unique_dates || [];
        
        // Convert date strings to Date objects and sort them
        const sortedDates = uniqueDates
            .map((dateStr: string) => new Date(dateStr))
            .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        // Group dates by year and month for calendar display
        const calendarData: { [key: string]: { [key: string]: string[] } } = {};
        
        sortedDates.forEach((date: Date) => {
            const year = date.getFullYear().toString();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            
            if (!calendarData[year]) {
                calendarData[year] = {};
            }
            if (!calendarData[year][month]) {
                calendarData[year][month] = [];
            }
            
            calendarData[year][month].push(day);
        });

        // Calculate calendar statistics
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        const thisYearDates = calendarData[currentYear] || {};
        const thisMonthDates = thisYearDates[currentMonth.toString().padStart(2, '0')] || [];

        return {
            uid,
            userName: userData.userName,
            total_unique_days: uniqueDates.length,
            total_logins: userData.total_logins || 0,
            unique_dates: uniqueDates,
            sorted_dates: sortedDates.map(date => date.toISOString().split('T')[0]),
            calendar_data: calendarData,
            current_year_data: thisYearDates,
            current_month_data: thisMonthDates,
            current_month_count: thisMonthDates.length,
            current_year_count: Object.values(thisYearDates).flat().length,
            first_login_date: userData.first_login_date?.toDate?.() || userData.first_login_date,
            last_login_date: userData.last_login_date?.toDate?.() || userData.last_login_date,
            login_frequency: this.calculateLoginFrequency(sortedDates)
        };
    }

    /**
     * Get enhanced login statistics including unique dates
     */
    async getUserLoginStats(uid: string) {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new BadRequestException("User not found");
        }

        const userData = userDoc.data();
        if (!userData) {
            throw new BadRequestException("User data not found");
        }

        const now = new Date();

        // Calculate days since first login
        const firstLoginDate = userData.first_login_date?.toDate?.() || userData.first_login_date || now;
        const lastLoginDate = userData.last_login_date?.toDate?.() || userData.last_login_date || now;
        
        const daysSinceFirstLogin = Math.floor((now.getTime() - firstLoginDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastLogin = Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
            uid,
            userName: userData.userName,
            first_login_date: firstLoginDate,
            last_login_date: lastLoginDate,
            days_since_first_login: daysSinceFirstLogin,
            days_since_last_login: daysSinceLastLogin,
            current_streak: userData.currentStreak || 0,
            longest_streak: userData.longestStreak || 0,
            total_login_days: userData.totalLoginDays || 0,
            total_logins: userData.total_logins || 0,
            total_unique_days: userData.unique_dates?.length || 0,
            average_logins_per_day: userData.total_logins && userData.totalLoginDays ? 
                (userData.total_logins / userData.totalLoginDays).toFixed(2) : 0,
            average_logins_per_unique_day: userData.total_logins && userData.unique_dates ? 
                (userData.total_logins / userData.unique_dates.length).toFixed(2) : 0,
            created_at: userData.createdAt,
            login_dates: userData.login_dates || [],
            unique_dates: userData.unique_dates || []
        };
    }

    /**
     * Get complete login history for a user
     */
    async getUserLoginHistory(uid: string) {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new BadRequestException("User not found");
        }

        const userData = userDoc.data();
        if (!userData) {
            throw new BadRequestException("User data not found");
        }

        // Convert Firestore timestamps to readable dates
        const loginDates = userData.login_dates || [];
        const formattedLoginDates = loginDates.map((timestamp: any) => {
            if (timestamp?.toDate) {
                return timestamp.toDate();
            }
            return timestamp;
        });

        // Sort dates in descending order (most recent first)
        const sortedDates = formattedLoginDates.sort((a: Date, b: Date) => b.getTime() - a.getTime());

        // Group dates by month for better organization
        const datesByMonth: { [key: string]: Date[] } = {};
        sortedDates.forEach((date: Date) => {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!datesByMonth[monthKey]) {
                datesByMonth[monthKey] = [];
            }
            datesByMonth[monthKey].push(date);
        });

        return {
            uid,
            userName: userData.userName,
            total_logins: userData.total_logins || 0,
            login_dates: sortedDates,
            dates_by_month: datesByMonth,
            first_login: userData.first_login_date?.toDate?.() || userData.first_login_date,
            last_login: userData.last_login_date?.toDate?.() || userData.last_login_date,
            login_frequency: this.calculateLoginFrequency(sortedDates)
        };
    }

    /**
     * Calculate login frequency patterns
     */
    private calculateLoginFrequency(loginDates: Date[]) {
        if (loginDates.length < 2) {
            return {
                average_days_between_logins: 0,
                most_active_day: 'N/A',
                most_active_hour: 'N/A',
                login_pattern: 'insufficient_data'
            };
        }

        // Calculate average days between logins
        let totalDays = 0;
        for (let i = 1; i < loginDates.length; i++) {
            const daysDiff = Math.floor((loginDates[i-1].getTime() - loginDates[i].getTime()) / (1000 * 60 * 60 * 24));
            totalDays += daysDiff;
        }
        const averageDaysBetweenLogins = (totalDays / (loginDates.length - 1)).toFixed(2);

        // Find most active day of week
        const dayCounts: { [key: string]: number } = {};
        loginDates.forEach(date => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });
        const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        // Find most active hour
        const hourCounts: { [key: string]: number } = {};
        loginDates.forEach(date => {
            const hour = date.getHours();
            const hourKey = `${hour}:00`;
            hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
        });
        const mostActiveHour = Object.entries(hourCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        // Determine login pattern
        let loginPattern = 'regular';
        const avgDays = parseFloat(averageDaysBetweenLogins);
        if (avgDays <= 1) {
            loginPattern = 'daily';
        } else if (avgDays <= 7) {
            loginPattern = 'weekly';
        } else if (avgDays <= 30) {
            loginPattern = 'monthly';
        } else {
            loginPattern = 'occasional';
        }

        return {
            average_days_between_logins: parseFloat(averageDaysBetweenLogins),
            most_active_day: mostActiveDay,
            most_active_hour: mostActiveHour,
            login_pattern: loginPattern
        };
    }

    async refreshToken(oldToken: string): Promise<string> {
        const decoded: any = await this.validateSessionToken(oldToken);
        return this.generateSessionToken(decoded.uid, decoded.userName);
    }

    async updateLoginDates(userId: string) {
        const userRef = admin.firestore().collection('users').doc(userId);
        const userSnap = await userRef.get();
        const userData = userSnap.data();

        const loginDates = Array.isArray(userData?.login_dates) ? userData.login_dates : [];
        loginDates.push(new Date().toISOString()); 

        await userRef.update({
          login_dates: loginDates, // Only JS values here!
          last_login: admin.firestore.FieldValue.serverTimestamp(), // This is OK
        });
    }
}
