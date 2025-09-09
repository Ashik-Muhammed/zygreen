export interface Product {
  id?: string; // Optional because it will be set by Firestore
  name: string;
  price: string;
  description: string;
  features: string[];
  image: string;
  category: string;
  isNew?: boolean;
  isPopular?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'active' | 'draft' | 'archived';
}
