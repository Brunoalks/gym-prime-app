import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Check, LayoutDashboard, LogIn, Package, Plus, ShoppingBag, Trash2, UserPlus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro inesperado' }));
    const detail = Array.isArray(error.detail)
      ? error.detail.map((item) => {
        if (item.loc?.includes('password') && item.type === 'string_too_short') {
          return 'Senha deve ter pelo menos 8 caracteres';
        }
        return item.msg;
      }).join(' ')
      : error.detail;
    throw new Error(detail || 'Erro inesperado');
  }

  if (response.status === 204) return null;
  return response.json();
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function AppLogo({ label = 'Gym Prime', to = '/' }) {
  return (
    <Link to={to} className="flex min-h-11 items-center gap-3 font-black text-slate-950">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-sm text-slate-950">
        GP
      </span>
      <span className="text-xl tracking-normal">{label}</span>
    </Link>
  );
}

function AppHeader({ logoTo = '/', logoLabel = 'Gym Prime', children }) {
  return (
    <header className="border-b border-slate-200 bg-white px-5 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <AppLogo to={logoTo} label={logoLabel} />
        {children}
      </div>
    </header>
  );
}

function PageShell({ children, className = 'bg-slate-50' }) {
  return (
    <main className={`min-h-screen text-slate-950 ${className}`}>
      {children}
    </main>
  );
}

function PageContent({ children, className = '' }) {
  return (
    <div className={`mx-auto max-w-6xl px-5 py-6 ${className}`}>
      {children}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    cpf: '',
    password: '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (isRegister) {
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            cpf: form.cpf || null,
            password: form.password,
          }),
        });
      }

      const user = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      onLogin(user);
      toast.success('Sessao iniciada');
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <PageShell className="bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500 font-black text-slate-950">
            GP
          </div>
          <h1 className="text-3xl font-black tracking-normal">Gym Prime</h1>
          <p className="mt-2 text-sm text-slate-300">Acesse para montar seu pedido da lanchonete.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-5 text-slate-950">
          {isRegister && (
            <>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
                placeholder="Nome completo"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                required
              />
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
                placeholder="CPF"
                value={form.cpf}
                onChange={(event) => setForm({ ...form, cpf: event.target.value })}
              />
            </>
          )}

          <input
            className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            minLength={isRegister ? 8 : 1}
            required
          />

          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950">
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegister ? 'Cadastrar e entrar' : 'Entrar'}
          </button>

          <button
            type="button"
            className="w-full text-sm font-bold text-slate-600"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Ja tenho conta' : 'Criar conta'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function ProductList({ products, onAdd }) {
  if (products.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
        Nenhum produto disponivel.
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </section>
  );
}

function ProductCard({ product, onAdd }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id || null);
  const selectedVariant = product.variants.find((variant) => variant.id === variantId);
  const price = selectedVariant?.price || product.price;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full rounded-md object-cover" />
          ) : (
            <ShoppingBag size={24} />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-950">{product.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description || 'Produto disponivel'}</p>
        </div>
      </div>

      {product.variants.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {product.variants.map((variant) => (
            <button
              key={variant.id}
              className={`rounded-md border px-3 py-2 text-xs font-bold ${
                variant.id === variantId
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-600'
              } min-h-11`}
              onClick={() => setVariantId(variant.id)}
            >
              {variant.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <strong className="text-lg font-black text-slate-950">{formatCurrency(price)}</strong>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white"
          onClick={() => onAdd(product.id, variantId)}
          aria-label={`Adicionar ${product.name}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </article>
  );
}

function CartPanel({ cart, onCheckout }) {
  return (
    <aside className="sticky bottom-0 mt-6 rounded-t-lg border border-slate-200 bg-white p-4 shadow-lg lg:rounded-lg">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">Carrinho</h2>
        <span className="text-sm font-bold text-slate-500">{cart.items.length} itens</span>
      </div>

      <div className="space-y-2">
        {cart.items.length === 0 && <p className="text-sm text-slate-500">Nenhum item adicionado.</p>}
        {cart.items.map((item) => (
          <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">{item.quantity}x {item.name}</span>
            <strong className="text-slate-950">{formatCurrency(item.total_price)}</strong>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-bold text-slate-500">Total</span>
        <strong className="text-xl font-black text-slate-950">{formatCurrency(cart.total_amount)}</strong>
      </div>

      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700"
        disabled={cart.items.length === 0}
        onClick={onCheckout}
      >
        <Check size={18} />
        Finalizar pedido
      </button>
    </aside>
  );
}

function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
  });
  const [productImage, setProductImage] = useState(null);

  useEffect(() => {
    api('/auth/session')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshAdminData().catch((error) => toast.error(error.message));
  }, [user]);

  async function refreshAdminData() {
    setAdminDataLoading(true);
    try {
      const [productData, orderData, inventoryData] = await Promise.all([
        api('/products'),
        api('/orders'),
        api('/inventory'),
      ]);
      setProducts(productData);
      setOrders(orderData);
      setInventory(inventoryData);
    } finally {
      setAdminDataLoading(false);
    }
  }

  function startEdit(product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      code: product.code,
      description: product.description || '',
      price: product.price,
    });
  }

  function resetProductForm() {
    setEditingProduct(null);
    setProductForm({ name: '', code: '', description: '', price: '' });
    setProductImage(null);
  }

  async function saveProduct(event) {
    event.preventDefault();
    const payload = {
      name: productForm.name,
      code: productForm.code,
      description: productForm.description || null,
      price: productForm.price,
    };

    try {
      let savedProduct;
      if (editingProduct) {
        savedProduct = await api(`/products/${editingProduct.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        savedProduct = await api('/products', { method: 'POST', body: JSON.stringify(payload) });
      }

      if (productImage) {
        const formData = new FormData();
        formData.append('file', productImage);
        await api(`/uploads/products/${savedProduct.id}/image`, { method: 'POST', body: formData });
      }
      resetProductForm();
      await refreshAdminData();
      toast.success('Produto salvo');
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function removeProduct(productId) {
    try {
      await api(`/products/${productId}`, { method: 'DELETE' });
      await refreshAdminData();
      toast.success('Produto removido');
    } catch (error) {
      toast.error(error.message);
    }
  }

  const revenue = orders.reduce((total, order) => total + Number(order.total_amount), 0);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-950">Carregando</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <PageShell className="bg-slate-100">
      <AppHeader logoTo="/admin" logoLabel="Admin Gym Prime">
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs font-bold text-slate-500 sm:block">
            <span className="block text-slate-950">{user.full_name}</span>
            Administracao
          </div>
          <Link to="/totem" className="flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-sm font-black text-slate-700">
            Totem
          </Link>
        </div>
      </AppHeader>

      <PageContent>
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ['dashboard', LayoutDashboard, 'Dashboard'],
            ['orders', ShoppingBag, 'Pedidos'],
            ['products', Package, 'Produtos'],
            ['inventory', Package, 'Estoque'],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black ${
                tab === key ? 'bg-slate-950 text-white' : 'bg-white text-slate-700'
              }`}
              onClick={() => setTab(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {adminDataLoading && <p className="mb-4 text-sm font-bold text-slate-500">Carregando dados...</p>}

        {tab === 'dashboard' && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Pedidos</p>
              <strong className="mt-2 block text-3xl font-black">{orders.length}</strong>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Faturamento registrado</p>
              <strong className="mt-2 block text-3xl font-black">{formatCurrency(revenue)}</strong>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Produtos ativos</p>
              <strong className="mt-2 block text-3xl font-black">{products.filter((product) => product.is_active).length}</strong>
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <section className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-black">Pedido #{order.id}</h2>
                    <p className="text-sm text-slate-500">{order.customer_name || `Usuario ${order.user_id}`}</p>
                  </div>
                  <strong>{formatCurrency(order.total_amount)}</strong>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  {order.items.map((item) => (
                    <p key={item.id}>{item.quantity}x produto #{item.product_id}</p>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === 'products' && (
          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <form onSubmit={saveProduct} className="h-fit rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-black">{editingProduct ? 'Editar produto' : 'Novo produto'}</h2>
              <div className="space-y-3">
                <input className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm" placeholder="Nome" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
                <input className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm" placeholder="Codigo" value={productForm.code} onChange={(event) => setProductForm({ ...productForm, code: event.target.value })} required />
                <input className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm" placeholder="Descricao" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
                <input className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm" placeholder="Preco" type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required />
                <input className="w-full rounded-md border border-slate-200 px-3 py-3 text-sm" type="file" accept="image/*" onChange={(event) => setProductImage(event.target.files?.[0] || null)} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" className="rounded-md border border-slate-200 px-4 py-3 text-sm font-black" onClick={resetProductForm}>Limpar</button>
                <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950">Salvar</button>
              </div>
            </form>

            <div className="grid gap-3 md:grid-cols-2">
              {products.map((product) => (
                <article key={product.id} className="rounded-lg bg-white p-4 shadow-sm">
                  {product.image_url && <img src={product.image_url} alt={product.name} className="mb-3 h-32 w-full rounded-md object-cover" />}
                  <h2 className="font-black">{product.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{product.description || 'Sem descricao'}</p>
                  <strong className="mt-3 block">{formatCurrency(product.price)}</strong>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-black" onClick={() => startEdit(product)}>Editar</button>
                    <button className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-black text-red-700" onClick={() => removeProduct(product.id)}>
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'inventory' && (
          <section className="rounded-lg bg-white shadow-sm">
            <div className="grid grid-cols-4 border-b border-slate-100 p-3 text-xs font-black uppercase text-slate-500">
              <span>Produto</span>
              <span>Variante</span>
              <span>Qtd</span>
              <span>Min</span>
            </div>
            {inventory.length === 0 && <p className="p-4 text-sm text-slate-500">Nenhum estoque cadastrado.</p>}
            {inventory.map((item) => (
              <div key={item.id} className="grid grid-cols-4 border-b border-slate-100 p-3 text-sm">
                <span>#{item.product_id}</span>
                <span>{item.variant_id ? `#${item.variant_id}` : '-'}</span>
                <strong>{item.quantity}</strong>
                <span>{item.min_quantity}</span>
              </div>
            ))}
          </section>
        )}
      </PageContent>
    </PageShell>
  );
}

function CustomerNameModal({ customerName, setCustomerName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center">
      <form onSubmit={onConfirm} className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-slate-950">Nome para o pedido</h2>
        <p className="mt-1 text-sm text-slate-500">O totem nao mantem sessao. Informe o nome do cliente para a cozinha.</p>
        <input
          className="mt-4 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
          placeholder="Nome do cliente"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          autoFocus
          required
          minLength={2}
        />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700" onClick={onCancel}>
            Cancelar
          </button>
          <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950">
            Enviar pedido
          </button>
        </div>
      </form>
    </div>
  );
}

function buildLocalCart(cartLines, products) {
  const items = cartLines.flatMap((line) => {
    const product = products.find((item) => item.id === line.product_id);
    if (!product) return [];

    const variant = product.variants.find((item) => item.id === line.variant_id);
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

function TotemPage() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cartLines, setCartLines] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const cart = useMemo(() => buildLocalCart(cartLines, products), [cartLines, products]);

  useEffect(() => {
    api('/products')
      .then(setProducts)
      .catch((error) => toast.error(error.message))
      .finally(() => setProductsLoading(false));
  }, []);

  function handleAdd(productId, variantId) {
    setCartLines((current) => {
      const existing = current.find((line) => line.product_id === productId && line.variant_id === variantId);
      if (existing) {
        return current.map((line) => (
          line === existing ? { ...line, quantity: line.quantity + 1 } : line
        ));
      }
      return [...current, { product_id: productId, variant_id: variantId, quantity: 1 }];
    });
    toast.success('Item adicionado');
  }

  async function handleConfirmCheckout(event) {
    event.preventDefault();
    try {
      const result = await api('/totem/checkout', {
        method: 'POST',
        body: JSON.stringify({ customer_name: customerName, items: cartLines }),
      });
      setCartLines([]);
      setCustomerName('');
      setShowNameModal(false);
      toast.success(`Pedido #${result.order_id} criado`);
      window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <PageShell>
      <AppHeader logoTo="/totem" logoLabel="Gym Prime Totem">
        <Link to="/" className="flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-sm font-black text-slate-700">
          Cliente
        </Link>
      </AppHeader>

      <PageContent className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-5">
            <h1 className="text-2xl font-black tracking-normal">Cardapio publico</h1>
            <p className="mt-1 text-sm text-slate-500">Escolha os itens no totem e informe o nome apenas ao finalizar.</p>
          </div>
          {productsLoading ? (
            <p className="rounded-lg bg-white p-4 text-sm font-bold text-slate-500">Carregando produtos...</p>
          ) : (
            <ProductList products={activeProducts} onAdd={handleAdd} />
          )}
        </div>
        <CartPanel cart={cart} onCheckout={() => setShowNameModal(true)} />
      </PageContent>

      {showNameModal && (
        <CustomerNameModal
          customerName={customerName}
          setCustomerName={setCustomerName}
          onCancel={() => setShowNameModal(false)}
          onConfirm={handleConfirmCheckout}
        />
      )}
    </PageShell>
  );
}

function MenuPage({ user }) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);

  async function loadProducts() {
    const data = await api('/products');
    setProducts(data);
    setProductsLoading(false);
  }

  async function loadCart() {
    const data = await api('/cart');
    setCart(data);
  }

  useEffect(() => {
    loadProducts().catch((error) => {
      toast.error(error.message);
      setProductsLoading(false);
    });
    loadCart().catch(() => {});
  }, []);

  async function handleAdd(productId, variantId) {
    try {
      const data = await api('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, variant_id: variantId, quantity: 1 }),
      });
      setCart(data);
      toast.success('Item adicionado');
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCheckout() {
    try {
      const result = await api('/cart/checkout', { method: 'POST' });
      setCart({ items: [], total_amount: 0 });
      toast.success(`Pedido #${result.order_id} criado`);
      window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <PageShell>
      <AppHeader>
        <div className="text-right text-xs font-bold text-slate-500">
          <span className="block text-slate-950">{user.full_name}</span>
          Cliente autenticado
        </div>
      </AppHeader>

      <PageContent className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-5">
            <h1 className="text-2xl font-black tracking-normal">Cardapio</h1>
            <p className="mt-1 text-sm text-slate-500">Escolha os itens e finalize para enviar o pedido via WhatsApp.</p>
          </div>
          {productsLoading ? (
            <p className="rounded-lg bg-white p-4 text-sm font-bold text-slate-500">Carregando produtos...</p>
          ) : (
            <ProductList products={activeProducts} onAdd={handleAdd} />
          )}
        </div>
        <CartPanel cart={cart} onCheckout={handleCheckout} />
      </PageContent>
    </PageShell>
  );
}

function AppShell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/session')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Carregando</div>;
  }

  return user ? <MenuPage user={user} /> : <LoginPage onLogin={setUser} />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ className: 'font-bold' }} />
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/totem" element={<TotemPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
