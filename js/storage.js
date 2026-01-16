/**
 * GDN Automotive - Storage Service
 * Handles data persistence using localStorage
 */

const DB_PREFIX = 'GDN_AUTO_';

window.StorageApp = {
    /**
     * Save data to localStorage
     * @param {string} key - Collection name (e.g., 'clients', 'os')
     * @param {any} data - Data to save
     */
    save: (key, data) => {
        try {
            localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving to storage', e);
            return false;
        }
    },

    /**
     * Get data from localStorage
     * @param {string} key - Collection name
     * @returns {any} Data retrieved or null
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
     * Delete data from localStorage
     * @param {string} key - Collection name
     */
    remove: (key) => {
        localStorage.removeItem(DB_PREFIX + key);
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
