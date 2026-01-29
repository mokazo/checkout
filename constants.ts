import { Merchant, ShippingMethod } from './types';

export const INITIAL_SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'ship_relay', name: 'Livraison en Point Relais Chronopost', price: 4.50, isActive: true },
  { id: 'ship_mr', name: 'Mondial Relay', price: 3.90, isActive: true },
  { id: 'ship_home', name: 'Livraison Domicile (Chronopost)', price: 12.90, isActive: true },
];

export const MOCK_MERCHANT: Merchant = {
  id: 'merch_123',
  email: 'faissal.saaf@gmail.com',
  subdomain: 'faissal-shop',
  companyName: 'Boutique Faissal',
  logoUrl: 'https://picsum.photos/150/50',
  themeColorPrimary: '#4f46e5', // Indigo 600
  themeColorSecondary: '#1e1b4b', // Indigo 950
  stripePublishableKey: 'pk_test_12345',
  shippingMethods: INITIAL_SHIPPING_METHODS,
  chronopostConfig: {
    enabled: true,
    accountNumber: 'W2961154',
    password: 'Faissal@1986'
  },
  mondialRelayConfig: {
    enabled: true,
    enseigne: 'BDTEST13',
    privateKey: 'PrivateK'
  }
};