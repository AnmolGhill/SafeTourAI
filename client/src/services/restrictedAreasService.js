import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'restrictedAreas';

export const restrictedAreasService = {
  /**
   * Save a new restricted area to Firestore
   */
  async saveRestrictedArea(areaData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        name: areaData.name,
        type: areaData.type, // 'polygon' or 'circle'
        polygon: areaData.polygon || [], // Array of {lat, lng}
        center: areaData.center || null, // {lat, lng}
        radius: areaData.radius || 0, // in meters
        active: true,
        createdAt: serverTimestamp(),
        description: areaData.description || '',
        riskLevel: areaData.riskLevel || 'medium'
      });
      
      console.log('✅ Restricted area saved:', docRef.id);
      return {
        success: true,
        id: docRef.id,
        message: 'Restricted area created successfully'
      };
    } catch (error) {
      console.error('❌ Error saving restricted area:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get all restricted areas
   */
  async getAllRestrictedAreas() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const areas = [];
      
      querySnapshot.forEach((doc) => {
        areas.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ Loaded ${areas.length} restricted areas`);
      return {
        success: true,
        data: areas
      };
    } catch (error) {
      console.error('❌ Error fetching restricted areas:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Get only active restricted areas
   */
  async getActiveRestrictedAreas() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const areas = [];
      
      querySnapshot.forEach((doc) => {
        areas.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ Loaded ${areas.length} active restricted areas`);
      return {
        success: true,
        data: areas
      };
    } catch (error) {
      console.error('❌ Error fetching active restricted areas:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Listen to real-time updates of restricted areas
   */
  listenToRestrictedAreas(callback) {
    try {
      const unsubscribe = onSnapshot(
        collection(db, COLLECTION_NAME),
        (snapshot) => {
          const areas = [];
          snapshot.forEach((doc) => {
            areas.push({
              id: doc.id,
              ...doc.data()
            });
          });
          callback(areas);
        },
        (error) => {
          console.error('❌ Error listening to restricted areas:', error);
          callback([]);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  },

  /**
   * Listen to only active restricted areas in real-time
   */
  listenToActiveRestrictedAreas(callback) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('active', '==', true)
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const areas = [];
          snapshot.forEach((doc) => {
            areas.push({
              id: doc.id,
              ...doc.data()
            });
          });
          callback(areas);
        },
        (error) => {
          console.error('❌ Error listening to active restricted areas:', error);
          callback([]);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up active areas listener:', error);
      return () => {};
    }
  },

  /**
   * Delete a restricted area
   */
  async deleteRestrictedArea(areaId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, areaId));
      console.log('✅ Restricted area deleted:', areaId);
      return {
        success: true,
        message: 'Restricted area deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting restricted area:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update a restricted area
   */
  async updateRestrictedArea(areaId, updateData) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, areaId), updateData);
      console.log('✅ Restricted area updated:', areaId);
      return {
        success: true,
        message: 'Restricted area updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating restricted area:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Toggle active status of a restricted area
   */
  async toggleRestrictedAreaStatus(areaId, active) {
    return this.updateRestrictedArea(areaId, { active });
  }
};
