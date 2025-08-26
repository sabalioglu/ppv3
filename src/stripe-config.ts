export interface Product {
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
}

export const products: Product[] = [
  {
    priceId: 'price_1S0JK3Emd2R9npIslZBvpCQK',
    name: 'Pantry Pal',
    description: 'All included monthly usage for pantry pal.',
    mode: 'subscription',
  },
];