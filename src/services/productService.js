const STORAGE_KEY = 'gymprime_products';

// Busca os produtos
export const getProducts = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialData = [
      { id: 1, nome: 'Shake Whey Chocolate', preco: 18.90, categoria: 'Shakes', imagemBase64: null },
      { id: 2, nome: 'Pré-Treino IGNITE', preco: 14.90, categoria: 'Bebidas', imagemBase64: null }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

// Adiciona produto
export const addProduct = (product) => {
  const currentProducts = getProducts();
  const newProduct = { ...product, id: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...currentProducts, newProduct]));
  return newProduct;
};

// Deleta produto
export const deleteProduct = (id) => {
  const currentProducts = getProducts();
  const filteredProducts = currentProducts.filter(product => product.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredProducts));
};

// Converte Imagem em Base64
export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};