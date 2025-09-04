import { collection, addDoc, updateDoc, doc, getDocs, query, where, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Assignment } from '../types/assignment';

const ASSIGNMENTS_COLLECTION = 'assignments';

export const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const assignmentRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), {
      ...assignmentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return assignmentRef.id;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw new Error('Failed to create assignment');
  }
};

export const updateAssignment = async (assignmentId: string, assignmentData: Partial<Assignment>): Promise<void> => {
  try {
    await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId), {
      ...assignmentData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw new Error('Failed to update assignment');
  }
};

export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
  try {
    const assignmentDoc = await getDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId));
    if (assignmentDoc.exists()) {
      return { id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment;
    }
    return null;
  } catch (error) {
    console.error('Error fetching assignment:', error);
    throw new Error('Failed to fetch assignment');
  }
};

export const getAssignmentsByCourse = async (courseId: string): Promise<Assignment[]> => {
  try {
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION), 
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Assignment[];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw new Error('Failed to fetch assignments');
  }
};

export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId));
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw new Error('Failed to delete assignment');
  }
};

export const publishAssignment = async (assignmentId: string, isPublished: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId), {
      isPublished,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error publishing assignment:', error);
    throw new Error('Failed to update assignment status');
  }
};
