const admin = require('firebase-admin');

const serviceAccount = require('../path-to-your-service-account-file.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateGuards() {
  const guardsRef = db.collection('guards');
  const snapshot = await guardsRef.get();

  if (snapshot.empty) {
    console.log('No guard documents found.');
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    const data = doc.data();
    const docRef = guardsRef.doc(doc.id);

    const updates = {};
    if (typeof data.status !== 'boolean') {
      updates.status = false; // default status
    }
    if (!data.timestamp) {
      updates.timestamp = admin.firestore.FieldValue.serverTimestamp();
    }

    if (Object.keys(updates).length > 0) {
      batch.update(docRef, updates);
      console.log(`Scheduled update for guard ${doc.id}:`, updates);
    }
  });

  await batch.commit();
  console.log('Guard documents update completed.');
}

updateGuards().catch(console.error);
