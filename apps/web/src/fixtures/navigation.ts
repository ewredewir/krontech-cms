import type { NavItem } from './types';

export const navItemsTr: NavItem[] = [
  {
    label: 'Ürünler',
    children: [
      { label: 'PAM', href: '/tr/products/pam' },
      { label: 'DAM', href: '/tr/products/dam' },
      { label: 'DDM', href: '/tr/products/ddm' },
      { label: 'Query Analysis', href: '/tr/products/qa' },
      { label: 'AAA', href: '/tr/products/aaa' },
      { label: 'TLMP', href: '/tr/products/tlmp' },
    ],
  },
  {
    label: 'Kaynaklar',
    href: '/tr/resources',
  },
  {
    label: 'Blog',
    href: '/tr/blog',
  },
  {
    label: 'Hakkımızda',
    href: '/tr/hakkimizda',
  },
  {
    label: 'İletişim',
    href: '/tr/iletisim',
  },
  {
    label: 'Demo Talebi',
    href: '/tr/demo',
  },
];

export const navItemsEn: NavItem[] = [
  {
    label: 'Products',
    children: [
      { label: 'PAM', href: '/en/products/pam' },
      { label: 'DAM', href: '/en/products/dam' },
      { label: 'DDM', href: '/en/products/ddm' },
      { label: 'Query Analysis', href: '/en/products/qa' },
      { label: 'AAA', href: '/en/products/aaa' },
      { label: 'TLMP', href: '/en/products/tlmp' },
    ],
  },
  {
    label: 'Resources',
    href: '/en/resources',
  },
  {
    label: 'Blog',
    href: '/en/blog',
  },
  {
    label: 'About Us',
    href: '/en/about-us',
  },
  {
    label: 'Contact',
    href: '/en/contact',
  },
  {
    label: 'Request Demo',
    href: '/en/demo',
  },
];
