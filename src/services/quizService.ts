import { collection, addDoc, updateDoc, doc, getDocs, query, where, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Quiz, QuizQuestion } from '../types/quiz';

const QUIZZES_COLLECTION = 'quizzes';

export const createQuiz = async (quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const quizRef = await addDoc(collection(db, QUIZZES_COLLECTION), {
      ...quizData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return quizRef.id;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw new Error('Failed to create quiz');
  }
};

export const updateQuiz = async (quizId: string, quizData: Partial<Quiz>): Promise<void> => {
  try {
    await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
      ...quizData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw new Error('Failed to update quiz');
  }
};

export const getQuizById = async (quizId: string): Promise<Quiz | null> => {
  try {
    const quizDoc = await getDoc(doc(db, QUIZZES_COLLECTION, quizId));
    if (quizDoc.exists()) {
      return { id: quizDoc.id, ...quizDoc.data() } as Quiz;
    }
    return null;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    throw new Error('Failed to fetch quiz');
  }
};

export const getQuizzesByCourse = async (courseId: string): Promise<Quiz[]> => {
  try {
    const q = query(collection(db, QUIZZES_COLLECTION), where('courseId', '==', courseId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Quiz[];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw new Error('Failed to fetch quizzes');
  }
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, QUIZZES_COLLECTION, quizId));
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw new Error('Failed to delete quiz');
  }
};

export const publishQuiz = async (quizId: string, isPublished: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
      isPublished,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error publishing quiz:', error);
    throw new Error('Failed to update quiz status');
  }
};
