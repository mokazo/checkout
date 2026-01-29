import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getFunctions, 
  httpsCallable 
} from 'firebase/functions';
import { Merchant, Product, Order, PaymentStatus } from '../types';
import { INITIAL_SHIPPING_METHODS } from '../constants';

// ------------------------------------------------------------------
// CONFIGURATION FIREBASE
// Remplacez ces valeurs par celles de votre console Firebase
// https://console.firebase.google.com/
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialisation (Gestion des erreurs si la config est vide)
let app, auth, db, functions;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, 'europe-west1'); // Région recommandée pour la France
} catch (e) {
    console.warn("Firebase n'est pas configuré. Le service ne fonctionnera pas sans clés API valides.");
}

// Nom des collections
const COLLECTIONS = {
    MERCHANTS: 'merchants',
    PRODUCTS: 'products',
    ORDERS: 'orders'
};

export const firebaseApi = {

  // --- AUTHENTIFICATION & COMPTE MARCHAND ---

  getCurrentUser: async (): Promise<Merchant | null> => {
    return new Promise((resolve) => {
        if (!auth) { resolve(null); return; }
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Récupérer les données étendues du marchand depuis Firestore
                const docRef = doc(db, COLLECTIONS.MERCHANTS, user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    resolve({ id: user.uid, ...docSnap.data() } as Merchant);
                } else {
                    // Cas rare: User Auth existe mais pas le doc Firestore
                    resolve(null);
                }
            } else {
                resolve(null);
            }
            unsubscribe();
        });
    });
  },

  login: async (email: string): Promise<Merchant> => {
    // Note: Dans une vraie app, on demande le mot de passe via l'UI.
    // Ici, l'interface AuthPage gère déjà les champs email/password, 
    // il faudrait adapter la signature de cette méthode pour accepter le password.
    // Pour cet exemple structurel, nous supposons que le password est passé ou géré.
    throw new Error("L'implémentation nécessite le mot de passe");
  },

  // Surcharge pour correspondre à votre UI actuelle qui passe email+password
  loginWithPassword: async (email: string, password: string): Promise<Merchant> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const docRef = doc(db, COLLECTIONS.MERCHANTS, uid);
    const docSnap = await getDoc(docRef);
    return { id: uid, ...docSnap.data() } as Merchant;
  },

  registerWithPassword: async (email: string, password: string): Promise<Merchant> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    const newMerchant: Omit<Merchant, 'id'> = {
        email,
        subdomain: '', // Sera défini lors de l'onboarding
        companyName: '',
        logoUrl: '',
        themeColorPrimary: '#4f46e5',
        themeColorSecondary: '#1e1b4b',
        stripePublishableKey: '',
        shippingMethods: INITIAL_SHIPPING_METHODS,
        chronopostConfig: { enabled: false, accountNumber: '', password: '' },
        mondialRelayConfig: { enabled: false, enseigne: '', privateKey: '' }
    };

    // Création du document marchand dans Firestore
    await setDoc(doc(db, COLLECTIONS.MERCHANTS, uid), {
        ...newMerchant,
        createdAt: serverTimestamp()
    });

    return { id: uid, ...newMerchant } as Merchant;
  },

  logout: async (): Promise<void> => {
      await signOut(auth);
  },

  updateMerchant: async (data: Partial<Merchant>): Promise<Merchant> => {
     const user = auth.currentUser;
     if (!user) throw new Error("Non authentifié");
     
     const docRef = doc(db, COLLECTIONS.MERCHANTS, user.uid);
     await updateDoc(docRef, data);
     
     // Retourner l'objet mis à jour
     const updatedSnap = await getDoc(docRef);
     return { id: user.uid, ...updatedSnap.data() } as Merchant;
  },

  checkSubdomainAvailability: async (subdomain: string): Promise<boolean> => {
     const q = query(
         collection(db, COLLECTIONS.MERCHANTS), 
         where("subdomain", "==", subdomain)
     );
     const querySnapshot = await getDocs(q);
     return querySnapshot.empty;
  },

  // --- PRODUITS (Sous-collection du Marchand) ---

  getProducts: async (): Promise<Product[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    // Structure: merchants/{merchantId}/products/{productId}
    const productsRef = collection(db, COLLECTIONS.MERCHANTS, user.uid, COLLECTIONS.PRODUCTS);
    const snapshot = await getDocs(productsRef);
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Product));
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Non authentifié");

    const productsRef = collection(db, COLLECTIONS.MERCHANTS, user.uid, COLLECTIONS.PRODUCTS);
    const docRef = await addDoc(productsRef, {
        ...product,
        createdAt: serverTimestamp()
    });

    return { id: docRef.id, ...product };
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Non authentifié");

    const docRef = doc(db, COLLECTIONS.MERCHANTS, user.uid, COLLECTIONS.PRODUCTS, id);
    await updateDoc(docRef, updates);
    
    // Pour simplifier, on retourne l'objet fusionné (dans une vraie app, on re-fetch si besoin)
    return { id, ...updates } as Product;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Non authentifié");
    
    const docRef = doc(db, COLLECTIONS.MERCHANTS, user.uid, COLLECTIONS.PRODUCTS, id);
    await deleteDoc(docRef);
  },

  // --- COMMANDES (Sous-collection) ---

  getOrders: async (): Promise<Order[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    const ordersRef = collection(db, COLLECTIONS.MERCHANTS, user.uid, COLLECTIONS.ORDERS);
    // On pourrait ajouter orderBy('createdAt', 'desc') ici
    const snapshot = await getDocs(ordersRef);
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Order));
  },

  createOrder: async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'paymentStatus'>): Promise<Order> => {
      // NOTE: Cette fonction est appelée par le FRONTEND (Checkout).
      // Le merchantId est dans orderData.
      
      const ordersRef = collection(db, COLLECTIONS.MERCHANTS, orderData.merchantId, COLLECTIONS.ORDERS);
      
      const newOrderData = {
          ...orderData,
          paymentStatus: PaymentStatus.PAID, // Dans un vrai flux, ceci est mis à jour par Webhook Stripe
          createdAt: new Date().toISOString(), // Ou serverTimestamp()
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`
      };

      const docRef = await addDoc(ordersRef, newOrderData);
      
      return { id: docRef.id, ...newOrderData } as Order;
  },

  // --- CLOUD FUNCTIONS (Backend Logic) ---
  
  // Appelle une Cloud Function pour vérifier les identifiants Chronopost sans les exposer
  verifyChronopostConnection: async (account: string, password: string): Promise<boolean> => {
      try {
          const verifyFn = httpsCallable(functions, 'verifyChronopostAccount');
          const result = await verifyFn({ account, password });
          return (result.data as any).success;
      } catch (e) {
          console.error("Erreur Cloud Function:", e);
          // Fallback pour le dev local si la fonction n'existe pas encore
          return new Promise((resolve, reject) => {
             if (account.length > 5 && password.length > 3) resolve(true);
             else reject(new Error("Invalid mock credentials"));
          });
      }
  },

  // Appelle une Cloud Function pour rechercher les points relais (Proxy SOAP)
  searchRelayPoints: async (zipCode: string, type: 'CHRONOPOST' | 'MONDIAL_RELAY', config: any) => {
      try {
          const searchFn = httpsCallable(functions, 'searchRelayPoints');
          const result = await searchFn({ zipCode, type, config });
          return result.data;
      } catch (e) {
           console.error("Erreur Cloud Function:", e);
           return [];
      }
  }
};
