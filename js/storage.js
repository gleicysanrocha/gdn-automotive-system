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
    formatOSNumber: (number, date) => {
        if (!number) return '';
        let numStr = String(number).trim().replace(/^OS\-?/i, '').replace(/^#/g, '');
        
        if (/^\d{4}\.\d{3,}$/.test(numStr)) {
            return numStr;
        }
        
        let year = new Date().getFullYear();
        if (date) {
            const parts = String(date).split(/[\/\-]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) year = parseInt(parts[0]);
                else if (parts[2].length === 4) year = parseInt(parts[2]);
            }
        }
        
        if (/^\d{4}\.\d+$/.test(numStr)) {
            const parts = numStr.split('.');
            const seq = parseInt(parts[1]);
            return `${parts[0]}.${String(seq).padStart(3, '0')}`;
        }
        
        if (/^\d{7}$/.test(numStr)) {
            const y = numStr.slice(0, 4);
            const seq = parseInt(numStr.slice(4));
            return `${y}.${String(seq).padStart(3, '0')}`;
        }
        
        if (/^\d+$/.test(numStr)) {
            const seq = parseInt(numStr);
            if (seq > 1000000) {
                const seqStr = String(seq);
                const y = seqStr.slice(0, 4);
                const s = parseInt(seqStr.slice(4));
                return `${y}.${String(s).padStart(3, '0')}`;
            }
            return `${year}.${String(seq).padStart(3, '0')}`;
        }
        
        return numStr;
    },

    get: (key) => {
        try {
            const data = localStorage.getItem(DB_PREFIX + key);
            if (!data) return null;
            let parsed = JSON.parse(data);
            
            if (key === 'os_records' && Array.isArray(parsed)) {
                let changed = false;
                parsed = parsed.map(os => {
                    const formatted = window.StorageApp.formatOSNumber(os.number, os.date);
                    if (os.number !== formatted) {
                        os.number = formatted;
                        changed = true;
                    }
                    return os;
                });
                
                if (changed) {
                    window.StorageApp.save(key, parsed);
                }
            }
            return parsed;
        } catch (e) {
            console.error('Error reading from storage', e);
            return null;
        }
    },

    /**
     * Upload all LocalStorage data to Cloud (Sync Up)
     */
    syncLocalToCloud: async () => {
        if (!window.auth || !window.auth.currentUser) throw new Error("Você precisa estar logado para enviar dados.");
        const userId = window.auth.currentUser.uid;
        let count = 0;
        
        const batch = window.db.batch();
        const dataRef = window.db.collection('users').doc(userId).collection('data');

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(DB_PREFIX)) {
                    const cleanKey = key.replace(DB_PREFIX, '');
                    const data = JSON.parse(localStorage.getItem(key));
                    
                    batch.set(dataRef.doc(cleanKey), {
                        content: data,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    count++;
                }
            }
            if (count > 0) {
                await batch.commit();
                await window.StorageApp.createCloudSnapshot(`Forçou Upload Local para Nuvem (${count})`);
            }
            return true;
        } catch (e) {
            console.error('Upload Sync Error:', e);
            throw e;
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

