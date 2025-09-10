import { Listing } from '../../../core/models/listing.model';

export const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Camiseta Club Tu Barrio 2024',
    description: 'Camiseta oficial del club temporada 2024',
    shortDescription: 'Camiseta oficial 2024',
    price: 25990,
    originalPrice: 29990,
    currency: 'ARS',
    type: 'product',
    categoryId: 'indumentaria',
    categoryName: 'Indumentaria',
    advertiserName: 'Tienda Oficial',
    advertiserId: 'tienda-1',
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=280&h=200&fit=crop',
        altText: 'Camiseta oficial',
        isMain: true,
        sortOrder: 1
      }
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Servicio de Catering',
    description: 'Catering para eventos del club',
    price: 15000,
    currency: 'ARS',
    type: 'service',
    categoryId: 'servicios',
    categoryName: 'Servicios',
    advertiserName: 'Catering Los Amigos',
    advertiserId: 'catering-1',
    images: [
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=280&h=200&fit=crop',
        altText: 'Servicio de catering',
        isMain: true,
        sortOrder: 1
      }
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Gorro Oficial del Club',
    description: 'Gorro oficial con bordado del escudo',
    price: 8990,
    currency: 'ARS',
    type: 'product',
    categoryId: 'accesorios',
    categoryName: 'Accesorios',
    advertiserName: 'Tienda Oficial',
    advertiserId: 'tienda-1',
    images: [
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=280&h=200&fit=crop',
        altText: 'Gorro oficial',
        isMain: true,
        sortOrder: 1
      }
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];