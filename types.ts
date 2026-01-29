
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CHECKOUT = 'CHECKOUT',
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Merchant {
  id: string;
  email: string;
  subdomain: string;
  companyName: string;
  logoUrl: string;
  themeColorPrimary: string;
  themeColorSecondary: string;
  stripePublishableKey: string;
  shippingMethods: ShippingMethod[];
  chronopostConfig?: {
    enabled: boolean;
    accountNumber: string;
    password: string;
  };
  mondialRelayConfig?: {
    enabled: boolean;
    enseigne: string;
    privateKey: string;
  };
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  merchantId: string;
  productId: string | null; // Null if custom amount
  productName: string;
  amount: number;
  shippingCost: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  shippingMethodId?: string;
  reference?: string;
  pseudo?: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface CartItem {
  product: Product | null;
  quantity: number;
  customAmount?: number;
}