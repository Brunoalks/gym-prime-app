export const PRODUCT_CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'drinks', label: 'Bebidas' },
  { key: 'protein', label: 'Proteínas' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'preworkout', label: 'Pré-treino' },
  { key: 'combos', label: 'Combos' },
];

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.filter((category) => category.key !== 'all');

export function getProductCategoryLabel(categoryKey) {
  return PRODUCT_CATEGORIES.find((category) => category.key === categoryKey)?.label || categoryKey || 'Snacks';
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function getProductPrice(product, variantId = null) {
  const variant = product.variants?.find((item) => item.id === variantId);
  return Number(variant?.price || product.price || 0);
}

export function getProductCategory(product) {
  if (PRODUCT_CATEGORY_OPTIONS.some((category) => category.key === product.category)) return product.category;

  const text = `${product.name} ${product.description || ''}`.toLowerCase();
  if (text.includes('combo')) return 'combos';
  if (text.includes('pre') || text.includes('cafeina')) return 'preworkout';
  if (text.includes('shake') || text.includes('whey') || text.includes('prote')) return 'protein';
  if (text.includes('coca') || text.includes('agua') || text.includes('suco') || text.includes('bebida')) return 'drinks';
  return 'snacks';
}

export function filterProductsByCategory(products, category) {
  if (category === 'all') return products;
  return products.filter((product) => getProductCategory(product) === category);
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
