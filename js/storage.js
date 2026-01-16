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
            }
            return true;
        } catch (e) {
            console.error('Error saving to storage', e);
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

