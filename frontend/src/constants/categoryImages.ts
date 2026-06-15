export interface CategoryImage {
  url: string;
  alt: string;
}

export const CATEGORY_IMAGES: Record<string, CategoryImage> = {
  'agua': {
    url: 'https://images.unsplash.com/photo-1504818844734-820e7acdc356?w=500&h=300&fit=crop',
    alt: 'Água - Conservação',
  },
  'energia': {
    url: 'https://images.unsplash.com/photo-1466611653022-2f88e8b60d5d?w=500&h=300&fit=crop',
    alt: 'Energia Renovável',
  },
  'reciclagem': {
    url: 'https://images.unsplash.com/photo-1559996515-cd4628902d4a?w=500&h=300&fit=crop',
    alt: 'Reciclagem',
  },
  'natureza': {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=300&fit=crop',
    alt: 'Preservação da Natureza',
  },
  'transportes': {
    url: 'https://images.unsplash.com/photo-1559163499-641a39f40b97?w=500&h=300&fit=crop',
    alt: 'Transportes Sustentáveis',
  },
  'alimentacao': {
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop',
    alt: 'Alimentação Sustentável',
  },
  'default': {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=300&fit=crop',
    alt: 'EcoChat - Sustentabilidade',
  },
};

export const getImageForCategory = (category: string): CategoryImage => {
  return CATEGORY_IMAGES[category.toLowerCase()] || CATEGORY_IMAGES.default;
};
