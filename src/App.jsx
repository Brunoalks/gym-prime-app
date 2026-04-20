import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, Plus, Trash2, Package, Image as ImageIcon, Search, CheckCircle, XCircle } from 'lucide-react';
import { getProducts, addProduct, deleteProduct, convertToBase64 } from './services/productService';
import { toast, Toaster } from 'react-hot-toast';

// --- VISÃO ADMIN ---
const AdminView = () => {
  const [products, setProducts] = useState([]);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Shakes');
  const [file, setFile] = useState(null);

 useEffect(() => {
    const carregarProdutos = () => {
      const dados = getProducts();
      setProducts(dados);
    };
    carregarProdutos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imagemBase64 = null;
    if (file) {
      imagemBase64 = await convertToBase64(file);
    }
    
    addProduct({ nome, preco: parseFloat(preco), categoria, imagemBase64 });
    setProducts(getProducts());
    setNome('');
    setPreco('');
    setFile(null);
    document.getElementById('file-upload').value = '';
    showToast('Produto cadastrado com sucesso!');
  };

  const handleDelete = (id) => {
    deleteProduct(id);
    setProducts(getProducts());
    showToast('Produto removido com sucesso.', 'error');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gymDark text-white p-6">
        <div className="text-2xl font-bold mb-10 flex items-center gap-2">
          <div className="bg-gradient-to-br from-gymPurple to-gymGreen p-1 rounded">
            <span className="text-white font-black">P</span>
          </div>
          GYMPRIME
        </div>
        <nav className="space-y-4">
          <Link to="/admin" className="flex items-center gap-3 text-gymGreen font-medium">
            <Package size={20} /> Produtos
          </Link>
          <Link to="/" className="flex items-center gap-3 text-gray-400 hover:text-white mt-8">
            <ShoppingBag size={20} /> Ver Totem
          </Link>
        </nav>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestão de Produtos</h1>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Novo Produto</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
              <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gymGreen focus:border-gymGreen hover:border-gray-300 outline-none transition-all duration-200" placeholder="Ex: Whey Isolado" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" required value={preco} onChange={e => setPreco(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gymGreen focus:border-gymGreen hover:border-gray-300 outline-none transition-all duration-200" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gymGreen focus:border-gymGreen hover:border-gray-300 outline-none transition-all duration-200">
                <option>Shakes</option>
                <option>Bebidas</option>
                <option>Lanches</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto (Opcional)</label>
              <input id="file-upload" type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="w-full p-2 border border-gray-200 rounded-lg file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gymGreen/10 file:text-gymGreen hover:file:bg-gymGreen/20 file:transition-all file:duration-200 file:cursor-pointer cursor-pointer hover:border-gray-300 transition-all duration-200" />
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="bg-gymGreen text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2">
                <Plus size={20} /> Salvar Produto
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="p-4 font-medium">Imagem</th>
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Categoria</th>
                <th className="p-4 font-medium">Preço</th>
                <th className="p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4">
                    {p.imagemBase64 ? (
                      <img src={p.imagemBase64} alt={p.nome} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{p.nome}</td>
                  <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm">{p.categoria}</span></td>
                  <td className="p-4">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg hover:scale-110 active:scale-95 transition-all duration-200">
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {toast.visible && (
          <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white transform transition-all duration-300 animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-gymGreen shadow-gymGreen/20' : 'bg-red-500 shadow-red-500/20'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        )}
      </main>
    </div>
  );
};

// --- VISÃO CLIENTE (TOTEM / MOBILE) ---
const MobileView = () => {
  const [products, setProducts] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const carregarProdutos = () => {
      const dados = getProducts();
      setProducts(dados);
    };
    carregarProdutos();
  }, []);

  const categorias = ['Todos', ...new Set(products.map(p => p.categoria))];
  
  const produtosFiltrados = products.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = filtro === 'Todos' || p.categoria === filtro;
    return matchBusca && matchFiltro;
  });
  
  const adicionarAoCarrinho = (produto) => setCarrinho([...carrinho, produto]);
  const total = carrinho.reduce((acc, curr) => acc + Number(curr.preco), 0);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl">
      <header className="p-6 bg-white sticky top-0 z-10 border-b border-gray-100 pt-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-gymPurple to-gymGreen p-1.5 rounded-lg shadow-sm">
              <span className="text-white font-black text-xl leading-none">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight">GYMPRIME</span>
          </div>
          <Link to="/admin" className="text-xs font-semibold text-gray-400 hover:text-gymPurple transition-colors duration-200">ADMIN</Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">E aí, Monstro! 💪</h1>
        <p className="text-gray-500 text-sm mb-5">O que vamos mandar pra dentro hoje?</p>
        
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
             type="text" 
             placeholder="Buscar produto pelo nome..." 
             value={busca}
             onChange={(e) => setBusca(e.target.value)}
             className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple focus:border-gymPurple hover:border-gray-300 outline-none transition-all duration-200 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {categorias.map(cat => (
            <button 
              key={cat} 
              onClick={() => setFiltro(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${filtro === cat ? 'bg-gymPurple text-white shadow-md shadow-gymPurple/20 scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 grid grid-cols-2 gap-4 pb-32">
        {produtosFiltrados.length === 0 && (
          <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Putz, não encontramos!</h3>
            <p className="text-gray-500 text-sm">Tente buscar por outro nome ou limpe as categorias.</p>
          </div>
        )}
        {produtosFiltrados.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-3 border border-gray-100 flex flex-col cursor-pointer hover:border-gymGreen hover:shadow-md hover:shadow-gymGreen/10 active:scale-95 transition-all duration-200 group" onClick={() => adicionarAoCarrinho(p)}>
            {p.imagemBase64 ? (
              <img src={p.imagemBase64} alt={p.nome} className="w-full h-32 object-cover rounded-xl mb-3 shadow-sm group-hover:opacity-90 transition-opacity" />
            ) : (
              <div className="w-full h-32 bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-300 shadow-inner group-hover:bg-gray-100 transition-colors">
                <ImageIcon size={40} />
              </div>
            )}
            <h3 className="font-semibold text-sm leading-tight text-gray-800 mb-1 group-hover:text-gymGreen transition-colors">{p.nome}</h3>
            <span className="text-gymGreen font-bold mt-auto">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 p-4 pb-6 px-6 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => carrinho.length > 0 && setShowModal(true)}
          className={`w-full text-white font-bold py-4 rounded-2xl flex justify-between items-center px-6 active:scale-95 transition-all duration-300 ${carrinho.length > 0 ? 'bg-gymGreen shadow-lg shadow-gymGreen/30 hover:bg-emerald-600 hover:shadow-xl hover:shadow-gymGreen/40' : 'bg-gray-300 opacity-80 cursor-not-allowed'}`}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span>{carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</span>
          </div>
          <span className="text-lg">R$ {total.toFixed(2).replace('.', ',')}</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200" onClick={() => { setShowModal(false); setCarrinho([]); }}>
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-gymGreen mx-auto mb-6 shadow-inner">
              <CheckCircle size={40} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tudo Certo!</h2>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">Pedido confirmado e enviado para a cozinha. Agora é só aguardar chamar!</p>
            <button 
              onClick={() => { setShowModal(false); setCarrinho([]); setBusca(''); setFiltro('Todos'); }}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-black/20"
            >
              Fazer Novo Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* O Toaster é o componente invisível que cospe as notificações na tela */}
      <Toaster position="bottom-right" /> 
      <Routes>
        <Route path="/" element={<MobileView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;