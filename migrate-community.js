const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up your service account)
const serviceAccount = require('./firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateCommunityField() {
  try {
    console.log('Starting community field migration...');
    
    // First, backfill users without community field
    const usersSnapshot = await db.collection('users').get();
    let usersUpdated = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (!userData.community) {
        await userDoc.ref.update({ community: "rit_chennai" });
        usersUpdated++;
        console.log(`Updated user ${userDoc.id} with community: rit_chennai`);
      }
    }
    
    console.log(`Updated ${usersUpdated} users with community field`);
    
    // Then, backfill posts without community field
    const postsSnapshot = await db.collection('posts').get();
    let postsUpdated = 0;
    
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      if (!postData.community) {
        // Try to get community from author's profile
        let community = "rit_chennai";
        try {
          const authorDoc = await db.collection('users').doc(postData.author_id).get();
          const authorData = authorDoc.data();
          community = authorData?.community || "rit_chennai";
        } catch (e) {
          console.warn(`Could not get community for post ${postDoc.id}, using default`);
        }
        
        await postDoc.ref.update({ community: community.toLowerCase() });
        postsUpdated++;
        console.log(`Updated post ${postDoc.id} with community: ${community.toLowerCase()}`);
      }
    }
    
    console.log(`Updated ${postsUpdated} posts with community field`);
    console.log('Migration completed successfully!');
    
    return { usersUpdated, postsUpdated };
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateCommunityField()
    .then(result => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCommunityField };
