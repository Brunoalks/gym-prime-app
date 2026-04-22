import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, Plus, Trash2, Package, Image as ImageIcon, Search, ChevronLeft, Clock, Flame, Dumbbell, LayoutDashboard, UtensilsCrossed, X, Info, Pencil } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getProducts, addProduct, deleteProduct, convertToBase64 } from './services/productService';

// --- VISÃO ADMIN ---
const AdminView = () => {
  const [activeTab, setActiveTab] = useState('produtos');
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false); // Controle do formulário
  
  // Form States
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Pratos');
  const [descricao, setDescricao] = useState('');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [tempo, setTempo] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imagemBase64 = null;
    if (file) imagemBase64 = await convertToBase64(file);
    
    addProduct({ 
      nome, 
      preco: parseFloat(preco), 
      categoria, 
      descricao, 
      kcal: kcal || 0, 
      prot: prot ? `${prot}g` : '0g', 
      tempo: tempo ? `${tempo}min` : '10min',
      imagemBase64 
    });
    
    setProducts(getProducts());
    setNome(''); setPreco(''); setDescricao(''); setKcal(''); setProt(''); setTempo(''); setFile(null);
    if(document.getElementById('file-upload')) document.getElementById('file-upload').value = '';
    setShowForm(false);
    toast.success('Produto cadastrado com sucesso!');
  };

  const handleDelete = (id) => {
    deleteProduct(id);
    setProducts(getProducts());
    toast.success('Produto removido.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-gymDark p-1.5 rounded text-white font-black">P</div>
            <span className="text-xl font-extrabold tracking-tight text-gray-800 uppercase">Gymprime</span>
            <span className="text-sm text-gray-400 ml-2 border-l pl-2">Painel Administrativo</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 pb-4 -mb-4 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-gymGreen text-gymGreen font-bold' : 'border-transparent text-gray-400 hover:text-gray-600 font-medium'}`}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('produtos')} className={`flex items-center gap-2 pb-4 -mb-4 border-b-2 transition-all ${activeTab === 'produtos' ? 'border-gymGreen text-gymGreen font-bold' : 'border-transparent text-gray-400 hover:text-gray-600 font-medium'}`}>
              <Package size={18} /> Produtos
            </button>
          </nav>
        </div>
        <div className="flex gap-4">
          <button className="text-orange-500 bg-orange-50 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-100 transition"><UtensilsCrossed size={18}/> Cozinha</button>
          <Link to="/" className="bg-gymPurple text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition"><ShoppingBag size={18}/> Ver Cardápio</Link>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
              Resumo do Dia
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded border border-yellow-200 flex items-center gap-1">
                <Info size={14} /> Demonstração (Fictício)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-80">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4"><span className="font-bold">$</span></div>
                <p className="text-sm text-gray-400 font-medium">Faturamento</p>
                <h3 className="text-2xl font-extrabold text-gray-800">R$ 1.240,50</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-80">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4"><ShoppingBag size={20} /></div>
                <p className="text-sm text-gray-400 font-medium">Pedidos</p>
                <h3 className="text-2xl font-extrabold text-gray-800">34</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-80">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-4"><span className="font-bold">~</span></div>
                <p className="text-sm text-gray-400 font-medium">Ticket Médio</p>
                <h3 className="text-2xl font-extrabold text-gray-800">R$ 36,48</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-80">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4"><Flame size={20} /></div>
                <p className="text-sm text-gray-400 font-medium">Mais Vendido</p>
                <h3 className="text-xl font-extrabold text-gray-800">Frango Fit</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                Pedidos Recentes
                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-200">Demonstração</span>
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl opacity-80 border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">ord-001 <span className="text-gray-400 font-medium text-sm ml-2">João Silva</span></p>
                    <p className="text-sm text-gray-500 mt-1">2x Frango Grelhado, 1x Suco Verde</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Preparando</span>
                    <span className="font-extrabold text-gray-800">R$ 69,80</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'produtos' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
                Gestão de Produtos <span className="text-gray-400 font-medium text-lg">({products.length})</span>
              </h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-gymPurple text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition shadow-md shadow-gymPurple/20 flex items-center gap-2">
                {showForm ? <X size={18} /> : <Plus size={18} />}
                {showForm ? 'Fechar Formulário' : 'Novo Produto'}
              </button>
            </div>

            {/* Formulário Retrátil */}
            {showForm && (
              <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 mb-8 border border-gray-100 animate-in slide-in-from-top-4 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-gray-800">Cadastrar Novo Produto</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-200">Sistema Funcional</span>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome do Produto *</label>
                    <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple focus:border-gymPurple outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preço (R$) *</label>
                    <input type="number" step="0.01" required value={preco} onChange={e => setPreco(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple outline-none transition" />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição Breve</label>
                    <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple outline-none transition" placeholder="Ex: Peito de frango com legumes no vapor..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
                    <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple outline-none transition font-medium text-gray-700">
                      <option>Pratos</option><option>Bowls</option><option>Bebidas</option><option>Snacks</option><option>Saladas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kcal</label>
                    <input type="number" value={kcal} onChange={e => setKcal(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple outline-none transition" placeholder="Ex: 380" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Proteína (g)</label>
                    <input type="number" value={prot} onChange={e => setProt(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple outline-none transition" placeholder="Ex: 42" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tempo (min)</label>
                    <input type="number" value={tempo} onChange={e => setTempo(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gymPurple outline-none transition" placeholder="Ex: 15" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
  Imagem Real (Opcional)
  <span className="text-[10px] text-gray-400 font-medium normal-case tracking-normal">
    (Recomendado: Quadrada 1:1, mín. 600x600px)
  </span>
</label>
                    <input id="file-upload" type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gymPurple/10 file:text-gymPurple hover:file:bg-gymPurple/20 transition cursor-pointer" />
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancelar</button>
                    <button type="submit" className="bg-gymGreen text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-md shadow-gymGreen/20 flex items-center gap-2">
                      <Plus size={20} /> Salvar Produto
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Grid de Produtos (Estilo Claude) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow group">
                  <div className="flex gap-4 items-start mb-5">
                    {p.imagemBase64 ? (
                      <img src={p.imagemBase64} className="w-14 h-14 rounded-2xl object-cover shadow-sm shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 shrink-0 border border-gray-100">
                        <ImageIcon size={24}/>
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-gray-800 leading-tight mb-1 line-clamp-2">{p.nome}</h4>
                      <span className="text-xs font-medium text-gray-400">{p.categoria}</span>
                      <div className="font-black text-lg text-gray-900 mt-1">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-[11px] mb-5 font-bold">
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-lg"><Clock size={12}/> {p.tempo}</span>
                    <span className="text-gymPurple bg-purple-50 px-2.5 py-1 rounded-lg">{p.prot} prot</span>
                    <span className="ml-auto text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Ativo</span>
                  </div>
                  
                  <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                    <button className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2 border border-transparent hover:border-gray-200">
                      <Pencil size={14}/> Editar
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition group-hover:border-red-200 border border-transparent">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const categorias = ['Todos', ...new Set(products.map(p => p.categoria))];
  
  const produtosFiltrados = products.filter(p => {
    const matchFiltro = filtro === 'Todos' || p.categoria === filtro;
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return matchFiltro && matchBusca;
  });
  
  const adicionarAoCarrinho = (produto) => {
    setCarrinho([...carrinho, produto]);
    setProdutoSelecionado(null);
    toast.success(`${produto.nome} adicionado!`);
  };
  
  const total = carrinho.reduce((acc, curr) => acc + Number(curr.preco), 0);

  return (
    <div className="max-w-md mx-auto bg-[#FAFAFA] min-h-screen relative pb-24 shadow-2xl overflow-x-hidden font-sans">
      
      {/* Header Premium Claude Style */}
      <header className="bg-white px-6 pt-6 pb-4 sticky top-0 z-10 shadow-sm rounded-b-3xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-gymDark p-1.5 rounded-lg">
              <span className="text-white font-black text-xl leading-none">P</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-800">GYMPRIME</span>
          </div>
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
            <ShoppingBag size={24} />
            {carrinho.length > 0 && <span className="absolute top-0 right-0 bg-gymPurple text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{carrinho.length}</span>}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gymPurple/20 transition-all text-gray-700" />
        </div>

        {/* Categories Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          {categorias.map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)} className={`px-5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filtro === cat ? 'bg-gymPurple text-white shadow-md shadow-gymPurple/30 scale-105' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Banner Promocional */}
      <div className="px-6 py-5">
        <div className="bg-gradient-to-r from-gymPurple to-[#6366f1] rounded-3xl p-6 text-white shadow-lg shadow-gymPurple/20 relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 inline-block border border-white/10">Novidade</span>
            <h2 className="text-2xl font-black mb-1 leading-tight">Gym Prime Food</h2>
            <p className="text-indigo-100 text-xs font-medium">Proteína, sabor e energia no prato.</p>
          </div>
          <Dumbbell className="absolute -right-6 -bottom-6 text-white opacity-10 w-40 h-40 transform rotate-12" />
        </div>
      </div>

      {/* Product List Grid (Claude Style) */}
      <main className="px-6 grid grid-cols-2 gap-4">
        {produtosFiltrados.map(p => (
          <div key={p.id} onClick={() => setProdutoSelecionado(p)} className="bg-white rounded-3xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col cursor-pointer hover:-translate-y-1 transition-transform group relative">
            
            {/* Badge High Pro Overlapping Image */}
            {p.prot !== '0g' && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gymPurple text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm border-2 border-white whitespace-nowrap">
                High Pro
              </div>
            )}

            <div className="mb-3 mt-2 relative rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center h-28 border border-gray-50">
              {p.imagemBase64 ? (
                <img src={p.imagemBase64} alt={p.nome} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-gray-300" />
              )}
            </div>
            
            <h3 className="font-extrabold text-[13px] leading-tight text-gray-800 mb-1">{p.nome}</h3>
            <p className="text-[10px] text-gray-400 line-clamp-2 mb-3 leading-relaxed font-medium">{p.descricao || 'Opção saudável e nutritiva.'}</p>
            
            <div className="flex items-center gap-x-2 gap-y-1 text-[10px] mb-3 mt-auto font-bold flex-wrap">
              <span className="text-gray-400 flex items-center gap-0.5"><Flame size={10}/> {p.kcal}</span>
              <span className="text-gymGreen">{p.prot}</span>
              <span className="text-gray-400 flex items-center gap-0.5 w-full"><Clock size={10}/> {p.tempo}</span>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
              <span className="font-black text-[15px] text-gray-900">R$ {Number(p.preco).toFixed(2).replace('.', ',')}</span>
              <button className="bg-gymPurple text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md shadow-gymPurple/20 group-hover:bg-purple-700 transition-colors">
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Bar Cart */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 p-4 pb-6 px-6 animate-in slide-in-from-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 rounded-t-3xl">
          <button onClick={() => { setCarrinho([]); toast.success('Pedido enviado para a cozinha!', { icon: '🧑‍🍳' }); }} className="w-full bg-gymGreen text-white font-black py-4 rounded-2xl shadow-lg shadow-gymGreen/30 flex justify-between items-center px-6 active:scale-95 transition">
            <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">{carrinho.length} itens</span>
            <span className="text-lg">Finalizar • R$ {total.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {/* MODAL DE DETALHES DO PRODUTO */}
      {produtoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setProdutoSelecionado(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-8 duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative">
              {produtoSelecionado.imagemBase64 ? (
                <img src={produtoSelecionado.imagemBase64} className="w-full h-72 object-cover" />
              ) : (
                <div className="w-full h-72 bg-gray-50 flex items-center justify-center"><ImageIcon size={64} className="text-gray-200"/></div>
              )}
              <button onClick={() => setProdutoSelecionado(null)} className="absolute top-6 right-6 bg-white/90 backdrop-blur shadow-sm p-2.5 rounded-full text-gray-800 hover:bg-white transition"><X size={20} strokeWidth={2.5}/></button>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl font-black text-gray-900 leading-tight pr-4">{produtoSelecionado.nome}</h2>
                <span className="text-xl font-black text-gymGreen whitespace-nowrap">R$ {Number(produtoSelecionado.preco).toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">{produtoSelecionado.descricao || 'Produto saudável e nutritivo, perfeito para o seu pré ou pós treino. Preparado com ingredientes selecionados.'}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100">
                  <Flame size={20} className="text-orange-500 mb-2" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Calorias</span>
                  <span className="font-extrabold text-gray-800">{produtoSelecionado.kcal} kcal</span>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-purple-100">
                  <Dumbbell size={20} className="text-gymPurple mb-2" />
                  <span className="text-[11px] font-bold text-gymPurple uppercase tracking-wider mb-1">Proteína</span>
                  <span className="font-extrabold text-gymPurple">{produtoSelecionado.prot}</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100">
                  <Clock size={20} className="text-blue-500 mb-2" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Preparo</span>
                  <span className="font-extrabold text-gray-800">{produtoSelecionado.tempo || '10min'}</span>
                </div>
              </div>

              <button onClick={() => adicionarAoCarrinho(produtoSelecionado)} className="w-full bg-gymPurple hover:bg-purple-700 text-white font-black py-4.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-gymPurple/30 text-lg h-14">
                Adicionar ao Pedido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{className: 'font-bold'}} />
      <Routes>
        <Route path="/" element={<MobileView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;