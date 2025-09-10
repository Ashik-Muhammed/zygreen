import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const REVENUE_DOC_ID = 'total_revenue';
const REVENUE_COLLECTION = 'stats';

/**
 * Update the total revenue when a new purchase is made
 * @param amount - The amount to add to the total revenue
 */
export const updateTotalRevenue = async (amount: number): Promise<void> => {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    console.error('Invalid amount provided to updateTotalRevenue');
    return;
  }

  try {
    const revenueRef = doc(db, REVENUE_COLLECTION, REVENUE_DOC_ID);
    
    // Use Firestore's increment to atomically update the total
    await setDoc(
      revenueRef,
      { 
        total: increment(amount),
        lastUpdated: new Date()
      },
      { merge: true }
    );
    
    console.log(`Successfully updated total revenue by $${amount}`);
  } catch (error) {
    console.error('Error updating total revenue:', error);
    throw error;
  }
};

/**
 * Get the current total revenue
 */
export const getTotalRevenue = async (): Promise<number> => {
  try {
    const revenueRef = doc(db, REVENUE_COLLECTION, REVENUE_DOC_ID);
    const revenueDoc = await getDoc(revenueRef);
    
    if (revenueDoc.exists()) {
      return revenueDoc.data().total || 0;
    }
    
    // If no revenue document exists yet, initialize it with 0
    await setDoc(revenueRef, { total: 0, lastUpdated: new Date() });
    return 0;
  } catch (error) {
    console.error('Error getting total revenue:', error);
    throw error;
  }
};

/**
 * Initialize the revenue tracking if it doesn't exist
 */
export const initializeRevenueTracking = async (): Promise<void> => {
  try {
    await getTotalRevenue(); // This will create the document if it doesn't exist
  } catch (error) {
    console.error('Error initializing revenue tracking:', error);
  }
};
