export const PRODUCT_CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'drinks', label: 'Bebidas' },
  { key: 'protein', label: 'Proteínas' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'preworkout', label: 'Pré-treino' },
  { key: 'combos', label: 'Combos' },
];

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.filter((category) => category.key !== 'all');

const PRODUCT_CATEGORY_ALIASES = {
  all: 'all',
  todos: 'all',
  drinks: 'drinks',
  drink: 'drinks',
  bebida: 'drinks',
  bebidas: 'drinks',
  beverage: 'drinks',
  beverages: 'drinks',
  agua: 'drinks',
  aguas: 'drinks',
  suco: 'drinks',
  sucos: 'drinks',
  refrigerante: 'drinks',
  refrigerantes: 'drinks',
  isotonico: 'drinks',
  isotonicos: 'drinks',
  protein: 'protein',
  proteins: 'protein',
  proteina: 'protein',
  proteinas: 'protein',
  whey: 'protein',
  snack: 'snacks',
  snacks: 'snacks',
  lanche: 'snacks',
  lanches: 'snacks',
  preworkout: 'preworkout',
  preworkouts: 'preworkout',
  'pre workout': 'preworkout',
  pretreino: 'preworkout',
  'pre treino': 'preworkout',
  cafeina: 'preworkout',
  combo: 'combos',
  combos: 'combos',
};

function normalizeCategoryValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeCategoryKey(value) {
  const normalized = normalizeCategoryValue(value);
  const compact = normalized.replace(/\s+/g, '');
  return PRODUCT_CATEGORY_ALIASES[normalized] || PRODUCT_CATEGORY_ALIASES[compact] || '';
}

export function getProductCategoryLabel(categoryKey) {
  const normalizedKey = normalizeCategoryKey(categoryKey) || categoryKey;
  return PRODUCT_CATEGORIES.find((category) => category.key === normalizedKey)?.label || categoryKey || 'Snacks';
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function getProductPrice(product, variantId = null) {
  const variant = product.variants?.find((item) => item.id === variantId);
  return Number(variant?.price || product.price || 0);
}

export function getProductCategory(product) {
  const categoryKey = normalizeCategoryKey(product?.category);
  if (categoryKey && categoryKey !== 'all') return categoryKey;

  const text = `${product?.name || ''} ${product?.description || ''}`.toLowerCase();
  if (text.includes('combo')) return 'combos';
  if (text.includes('pre') || text.includes('cafeina')) return 'preworkout';
  if (text.includes('shake') || text.includes('whey') || text.includes('prote')) return 'protein';
  if (text.includes('coca') || text.includes('gatorade') || text.includes('agua') || text.includes('suco') || text.includes('bebida') || text.includes('isotonico')) return 'drinks';
  return 'snacks';
}

export function filterProductsByCategory(products, category) {
  const categoryKey = normalizeCategoryKey(category) || category;
  if (categoryKey === 'all') return products;
  return products.filter((product) => getProductCategory(product) === categoryKey);
}

export function buildLocalCart(cartLines, products) {
  const items = cartLines.flatMap((line) => {
    const product = products.find((item) => item.id === line.product_id);
    if (!product) return [];

    const variant = product.variants?.find((item) => item.id === line.variant_id);
    const unitPrice = Number(variant?.price || product.price);
    const name = variant ? `${product.name} - ${variant.name}` : product.name;
    const totalPrice = unitPrice * line.quantity;

    return [{
      product_id: product.id,
      variant_id: variant?.id || null,
      name,
      quantity: line.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    }];
  });

  return {
    items,
    total_amount: items.reduce((total, item) => total + item.total_price, 0),
  };
}

export function buildProductMap(products) {
  return new Map(products.map((product) => [product.id, product]));
}
