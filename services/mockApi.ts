import { Merchant, Order, Product, PaymentStatus } from '../types';
import { MOCK_MERCHANT } from '../constants';

// In-memory storage simulated
// Initialize WITH data so the user is instantly logged in with the Shop2Shop config
let merchantStore: Merchant | null = MOCK_MERCHANT; 

let productsStore: Product[] = [
  {
    id: 'prod_1',
    merchantId: 'merch_123',
    name: 'Sac en Cuir Vintage',
    description: 'Sac en cuir véritable fait main avec finition vintage.',
    price: 129.99,
    imageUrl: 'https://picsum.photos/400/400?random=1',
    stock: 10,
    isActive: true,
  },
  {
    id: 'prod_2',
    merchantId: 'merch_123',
    name: 'Montre Minimaliste',
    description: 'Montre élégante pour le quotidien.',
    price: 89.50,
    imageUrl: 'https://picsum.photos/400/400?random=2',
    stock: 25,
    isActive: true,
  },
];

let ordersStore: Order[] = [
  {
    id: 'ord_1',
    orderNumber: 'ORD-0001',
    merchantId: 'merch_123',
    productId: 'prod_1',
    productName: 'Sac en Cuir Vintage',
    amount: 129.99,
    shippingCost: 4.99,
    totalAmount: 134.98,
    customerName: 'Alice Dupont',
    customerEmail: 'alice@example.com',
    shippingAddress: '123 Rue des Érables',
    shippingCity: 'Paris',
    shippingZip: '75001',
    shippingCountry: 'France',
    paymentStatus: PaymentStatus.PAID,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const mockApi = {
  // Simulates checking if a user is logged in
  getCurrentUser: async (): Promise<Merchant | null> => {
    return new Promise((resolve) => setTimeout(() => resolve(merchantStore), 500));
  },

  login: async (email: string, password?: string): Promise<Merchant> => {
    console.log(`Simulating login for ${email} with password...`);
    // Simulate login finding an existing merchant
    if (!merchantStore) {
        // For demo purposes, if logging in fresh, we restore the mock merchant
        // In a real app, this would check DB
        merchantStore = { ...MOCK_MERCHANT, email };
    }
    return new Promise((resolve) => setTimeout(() => resolve(merchantStore!), 800));
  },

  register: async (email: string, password?: string): Promise<Merchant> => {
    console.log(`Simulating registration for ${email} with password...`);
    // Create a fresh merchant without a subdomain yet
    const newMerchant: Merchant = {
        ...MOCK_MERCHANT,
        id: `merch_${Date.now()}`,
        email,
        companyName: '',
        subdomain: '',
        logoUrl: '',
        stripePublishableKey: '',
        stripeSecretKey: '',
        shippingMethods: [],
    };
    merchantStore = newMerchant;
    return new Promise((resolve) => setTimeout(() => resolve(newMerchant), 800));
  },

  updateMerchant: async (data: Partial<Merchant>): Promise<Merchant> => {
    if (!merchantStore) throw new Error("No session");
    merchantStore = { ...merchantStore, ...data };
    return new Promise((resolve) => setTimeout(() => resolve(merchantStore!), 500));
  },

  checkSubdomainAvailability: async (subdomain: string): Promise<boolean> => {
     // Simulate network check
     return new Promise((resolve) => setTimeout(() => resolve(true), 400));
  },

  // Simulate Chronopost API verification
  verifyChronopostConnection: async (account: string, password: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simple mock validation: account must be at least 8 chars
            if (account.length >= 8 && password.length > 0) {
                resolve(true);
            } else {
                reject(new Error("Identifiants Chronopost invalides"));
            }
        }, 1500);
    });
  },

  getProducts: async (): Promise<Product[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(productsStore), 300));
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
     return new Promise((resolve) => setTimeout(() => resolve(productsStore.find(p => p.id === id)), 200));
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const newProduct = { ...product, id: `prod_${Date.now()}` };
    productsStore.push(newProduct);
    return new Promise((resolve) => setTimeout(() => resolve(newProduct), 500));
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    productsStore = productsStore.map(p => p.id === id ? { ...p, ...updates } : p);
    return new Promise((resolve) => setTimeout(() => resolve(productsStore.find(p => p.id === id)!), 300));
  },

  deleteProduct: async (id: string): Promise<void> => {
    productsStore = productsStore.filter(p => p.id !== id);
    return new Promise((resolve) => setTimeout(() => resolve(), 300));
  },

  getOrders: async (): Promise<Order[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(ordersStore), 300));
  },

  createOrder: async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'paymentStatus'>): Promise<Order> => {
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentStatus: PaymentStatus.PAID,
      createdAt: new Date().toISOString(),
    };
    ordersStore.unshift(newOrder);
    return new Promise((resolve) => setTimeout(() => resolve(newOrder), 1500));
  },

  logout: async (): Promise<void> => {
      merchantStore = null;
      return Promise.resolve();
  }
};