'use client';
import { Refine } from '@refinedev/core';
import dataProvider from '@refinedev/simple-rest';
import routerProvider from '@refinedev/nextjs-router';
import axios from 'axios';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { setAccessToken } from '@/lib/api';
import { useEffect } from 'react';

const axiosInstance = axios.create({ baseURL: '/api/v1', withCredentials: true });

function RefineSetup({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuth();

  useEffect(() => {
    setAccessToken(accessToken);
    if (accessToken) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      delete axiosInstance.defaults.headers.common.Authorization;
    }
  }, [accessToken]);

  return (
    <Refine
      dataProvider={dataProvider('/api/v1', axiosInstance)}
      routerProvider={routerProvider}
      resources={[
        { name: 'pages', list: '/pages', create: '/pages/create', edit: '/pages/:id/edit' },
        { name: 'blog/posts', list: '/blog/posts', create: '/blog/posts/create', edit: '/blog/posts/:id/edit' },
        { name: 'blog/categories', list: '/blog/categories' },
        { name: 'blog/tags', list: '/blog/tags' },
        { name: 'products', list: '/products', edit: '/products/:id/edit' },
        { name: 'media', list: '/media' },
        { name: 'forms', list: '/forms' },
        { name: 'redirects', list: '/redirects' },
        { name: 'users', list: '/users', meta: { hide: user?.role !== 'ADMIN' } },
        { name: 'audit-log', list: '/audit-log', meta: { hide: user?.role !== 'ADMIN' } },
      ]}
      options={{ syncWithLocation: true, warnWhenUnsavedChanges: false }}
    >
      {children}
    </Refine>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RefineSetup>{children}</RefineSetup>
    </AuthProvider>
  );
}
