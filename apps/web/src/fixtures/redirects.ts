import type { Redirect } from './types';

export const redirects: Redirect[] = [
  {
    source: '/pam',
    destination: '/tr/products/pam',
    statusCode: 301,
  },
  {
    source: '/en',
    destination: '/en',
    statusCode: 302,
  },
];
