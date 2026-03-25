var admin = require("firebase-admin");
var path = require("path");
var serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

var db = null;

function initializeFirebase() {
    try {
        if (admin.apps.length > 0) {
            console.log('✅ Firebase already initialized');
            db = admin.firestore();
            return db;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('🔥 Firebase Admin SDK initialized successfully');
        db = admin.firestore();
        return db;

    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        console.log('⚠️  Running in demo mode with simulated data');
        return null;
    }
}

function getDatabase() {
    if (!db) {
        db = initializeFirebase();
    }
    return db;
}

function isConnected() {
    return db !== null && admin.apps.length > 0;
}

module.exports = {
    initializeFirebase,
    getDatabase,
    isConnected,
    admin
};
