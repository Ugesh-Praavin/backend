import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';        

const serviceAccount=require('../../firebase-adminsdk.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

export default admin;