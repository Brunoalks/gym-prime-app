const STORAGE_KEY = 'gymprime_products';

export const getProducts = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialData = [
      { id: 1, nome: 'Frango Grelhado Fit', descricao: 'Peito de frango com legumes no vapor.', preco: 28.90, categoria: 'Pratos', kcal: 380, prot: '42g', tempo: '15min', imagemBase64: null },
      { id: 2, nome: 'Açaí Power Bowl', descricao: 'Açaí batido com whey, granola e banana.', preco: 22.50, categoria: 'Bowls', kcal: 420, prot: '28g', tempo: '8min', imagemBase64: null },
      { id: 3, nome: 'Shake Proteico', descricao: 'Whey protein com leite vegetal e cacau.', preco: 16.00, categoria: 'Bebidas', kcal: 310, prot: '35g', tempo: '5min', imagemBase64: null },
      { id: 4, nome: 'Omelete Fitness', descricao: 'Omelete de 4 ovos com espinafre e cottage.', preco: 19.90, categoria: 'Pratos', kcal: 290, prot: '32g', tempo: '10min', imagemBase64: null }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

export const addProduct = (product) => {
  const currentProducts = getProducts();
  const newProduct = { ...product, id: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...currentProducts, newProduct]));
  return newProduct;
};

export const deleteProduct = (id) => {
  const currentProducts = getProducts();
  const filteredProducts = currentProducts.filter(product => product.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredProducts));
};

export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};