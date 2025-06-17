import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AuthService } from './authService';

export interface PantryItem {
  id?: string;
  userId: string;
  name: string;
  brand?: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: Date;
  purchaseDate: Date;
  location: 'fridge' | 'pantry' | 'freezer' | 'counter';
  cost?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  barcode?: string;
  isOpened: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionLog {
  id?: string;
  userId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  pantryItemId?: string;
  createdAt: Date;
}

export interface Recipe {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  cuisine?: string;
  tags: string[];
  imageUrl?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  totalCalories?: number;
  caloriesPerServing?: number;
  isFavorite: boolean;
  timesCooked: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  pantryItemId?: string;
  isOptional: boolean;
}

export class FirestoreService {
  // Pantry Items
  static async addPantryItem(item: Omit<PantryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const pantryItem: Omit<PantryItem, 'id'> = {
      ...item,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'pantryItems'), {
      ...pantryItem,
      createdAt: Timestamp.fromDate(pantryItem.createdAt),
      updatedAt: Timestamp.fromDate(pantryItem.updatedAt),
      expiryDate: pantryItem.expiryDate ? Timestamp.fromDate(pantryItem.expiryDate) : null,
      purchaseDate: Timestamp.fromDate(pantryItem.purchaseDate),
    });

    return docRef.id;
  }

  static async getPantryItems(): Promise<PantryItem[]> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        expiryDate: data.expiryDate ? data.expiryDate.toDate() : undefined,
        purchaseDate: data.purchaseDate.toDate(),
      } as PantryItem;
    });
  }

  static async updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<void> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (updates.expiryDate) {
      updateData.expiryDate = Timestamp.fromDate(updates.expiryDate);
    }
    if (updates.purchaseDate) {
      updateData.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
    }

    await updateDoc(doc(db, 'pantryItems', id), updateData);
  }

  static async deletePantryItem(id: string): Promise<void> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'pantryItems', id));
  }

  // Nutrition Logs
  static async addNutritionLog(log: Omit<NutritionLog, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const nutritionLog: Omit<NutritionLog, 'id'> = {
      ...log,
      userId: user.uid,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'nutritionLogs'), {
      ...nutritionLog,
      date: Timestamp.fromDate(nutritionLog.date),
      createdAt: Timestamp.fromDate(nutritionLog.createdAt),
    });

    return docRef.id;
  }

  static async getNutritionLogs(date?: Date): Promise<NutritionLog[]> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    let q = query(
      collection(db, 'nutritionLogs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      q = query(
        collection(db, 'nutritionLogs'),
        where('userId', '==', user.uid),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('date', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
      } as NutritionLog;
    });
  }

  // Recipes
  static async addRecipe(recipe: Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const newRecipe: Omit<Recipe, 'id'> = {
      ...recipe,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'recipes'), {
      ...newRecipe,
      createdAt: Timestamp.fromDate(newRecipe.createdAt),
      updatedAt: Timestamp.fromDate(newRecipe.updatedAt),
    });

    return docRef.id;
  }

  static async getRecipes(): Promise<Recipe[]> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'recipes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Recipe;
    });
  }

  static async updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await updateDoc(doc(db, 'recipes', id), updateData);
  }

  static async deleteRecipe(id: string): Promise<void> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'recipes', id));
  }

  // User Profile
  static async getUserProfile(userId: string): Promise<any> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  static async updateUserProfile(userId: string, updates: any): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  // Utility Functions
  static async getExpiringItems(days: number = 7): Promise<PantryItem[]> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', user.uid),
      where('expiryDate', '<=', Timestamp.fromDate(futureDate)),
      orderBy('expiryDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        expiryDate: data.expiryDate ? data.expiryDate.toDate() : undefined,
        purchaseDate: data.purchaseDate.toDate(),
      } as PantryItem;
    });
  }

  static async getDailyNutritionSummary(date: Date): Promise<{
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  }> {
    const logs = await this.getNutritionLogs(date);
    
    return logs.reduce((summary, log) => ({
      totalCalories: summary.totalCalories + log.calories,
      totalProtein: summary.totalProtein + (log.protein || 0),
      totalCarbs: summary.totalCarbs + (log.carbs || 0),
      totalFat: summary.totalFat + (log.fat || 0),
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    });
  }
}