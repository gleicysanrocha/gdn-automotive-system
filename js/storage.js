/**
 * GDN Automotive - Storage Service
 * Handles data persistence using localStorage
 */

const DB_PREFIX = 'GDN_AUTO_';

window.StorageApp = {
    /**
     * Save data to localStorage and Cloud (Firestore)
     */
    save: async (key, data) => {
        try {
            // 1. Save locally (Always works offline)
            localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));

            // 2. Save to Cloud if logged in
            if (window.auth && window.auth.currentUser) {
                const userId = window.auth.currentUser.uid;
                await window.db.collection('users').doc(userId).collection('data').doc(key).set({
                    content: data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Cloud Sync Success: ${key}`);

                // Trigger Automatic Backup Snapshot
                await window.StorageApp.createCloudSnapshot(`Alteração em: ${key}`);
            }
            return true;
        } catch (e) {
            console.error('Error saving to storage', e);
            return false;
        }
    },

    /**
     * Create a full system snapshot in the cloud
     */
    createCloudSnapshot: async (reason = 'Manual Backup') => {
        if (!window.auth || !window.auth.currentUser) return;
        const userId = window.auth.currentUser.uid;

        try {
            const allData = {};
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(DB_PREFIX)) {
                    allData[key] = localStorage.getItem(key);
                }
            });

            await window.db.collection('users').doc(userId).collection('backups').add({
                data: allData,
                reason: reason,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Cloud Snapshot Created:', reason);

            // Cleanup old backups (keep last 20)
            const snapshots = await window.db.collection('users').doc(userId).collection('backups')
                .orderBy('timestamp', 'desc').get();

            if (snapshots.size > 20) {
                const toDelete = snapshots.docs.slice(20);
                const batch = window.db.batch();
                toDelete.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        } catch (e) {
            console.error('Snapshot Error:', e);
        }
    },

    /**
     * Get backup history from cloud
     */
    getBackupHistory: async () => {
        if (!window.auth || !window.auth.currentUser) return [];
        const userId = window.auth.currentUser.uid;

        try {
            const snapshot = await window.db.collection('users').doc(userId).collection('backups')
                .orderBy('timestamp', 'desc').limit(20).get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dateLabel: doc.data().timestamp ? doc.data().timestamp.toDate().toLocaleString('pt-BR') : 'Agora'
            }));
        } catch (e) {
            console.error('Error fetching backup history:', e);
            return [];
        }
    },

    /**
     * Restore a specific backup
     */
    restoreBackup: async (backupId) => {
        if (!window.auth || !window.auth.currentUser) return false;
        const userId = window.auth.currentUser.uid;

        try {
            const doc = await window.db.collection('users').doc(userId).collection('backups').doc(backupId).get();
            if (!doc.exists) return false;

            const backupData = doc.data().data;

            // Clear current local storage for app
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(DB_PREFIX)) localStorage.removeItem(key);
            });

            // Apply backup data
            Object.keys(backupData).forEach(key => {
                localStorage.setItem(key, backupData[key]);
            });

            // Also update the 'live' data in Firestore
            for (const keyId in backupData) {
                const cleanKey = keyId.replace(DB_PREFIX, '');
                await window.db.collection('users').doc(userId).collection('data').doc(cleanKey).set({
                    content: JSON.parse(backupData[keyId]),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            console.log('System Restored from Backup:', backupId);
            return true;
        } catch (e) {
            console.error('Restore Error:', e);
            return false;
        }
    },

    /**
     * Get data from localStorage
     */
    get: (key) => {
        try {
            const data = localStorage.getItem(DB_PREFIX + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from storage', e);
            return null;
        }
    },

    /**
     * Load all data from Cloud to LocalStorage (Sync Down)
     */
    syncCloudToLocal: async () => {
        if (!window.auth || !window.auth.currentUser) return;
        const userId = window.auth.currentUser.uid;

        try {
            const snapshot = await window.db.collection('users').doc(userId).collection('data').get();
            snapshot.forEach(doc => {
                const key = doc.id;
                const data = doc.data().content;
                localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
            });
            console.log('Cloud Download Complete');
            return true;
        } catch (e) {
            console.error('Sync Error:', e);
            return false;
        }
    },

    /**
     * Delete data
     */
    remove: async (key) => {
        localStorage.removeItem(DB_PREFIX + key);
        if (window.auth && window.auth.currentUser) {
            const userId = window.auth.currentUser.uid;
            await window.db.collection('users').doc(userId).collection('data').doc(key).delete();
            // Trigger Automatic Backup Snapshot after deletion
            await window.StorageApp.createCloudSnapshot(`Exclusão de: ${key}`);
        }
    },
    /**
     * Clear all app data
     */
    clearAll: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(DB_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};

