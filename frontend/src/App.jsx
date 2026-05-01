import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Check, LayoutDashboard, LogIn, Package, Plus, ShoppingBag, Trash2, UserPlus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from './components/classNames.js';
import { Badge, Button, Card, Dialog, Feedback, TextInput } from './components/ui.jsx';
import { api } from './services/api.js';

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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
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
    <div className={`mx-auto max-w-6xl px-4 py-5 pb-28 sm:px-5 sm:py-6 lg:pb-6 ${className}`}>
      {children}
    </div>
  );
}

function AuthField({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-normal text-slate-500">{label}</span>
      <TextInput {...props} />
      {hint && <span className="mt-1 block text-xs font-bold text-slate-500">{hint}</span>}
    </label>
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
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="max-w-xl">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500 font-black text-slate-950">
            GP
          </div>
          <h1 className="max-w-sm text-4xl font-black leading-tight tracking-normal sm:text-5xl">
            Gym Prime
          </h1>
          <p className="mt-4 max-w-md text-base font-medium leading-7 text-slate-300">
            Entre para montar seu pedido pelo celular. O totem segue disponivel sem cadastro para atendimento local.
          </p>
          <div className="mt-6 grid max-w-md gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <strong className="block text-white">Pedido rapido</strong>
              <span className="mt-1 block">Carrinho salvo na sessao do cliente.</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <strong className="block text-white">WhatsApp pronto</strong>
              <span className="mt-1 block">Resumo do pedido gerado ao finalizar.</span>
            </div>
          </div>
        </section>

        <Card as="form" onSubmit={handleSubmit} className="space-y-4 p-5 text-slate-950">
          <div>
            <h2 className="text-2xl font-black">{isRegister ? 'Criar conta' : 'Entrar'}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isRegister ? 'Informe seus dados para pedir pelo celular.' : 'Use seu email e senha cadastrados.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <Button
              variant={isRegister ? 'ghost' : 'dark'}
              size="sm"
              className="w-full"
              onClick={() => setIsRegister(false)}
            >
              Entrar
            </Button>
            <Button
              variant={isRegister ? 'dark' : 'ghost'}
              size="sm"
              className="w-full"
              onClick={() => setIsRegister(true)}
            >
              Criar conta
            </Button>
          </div>

          {isRegister && (
            <>
              <AuthField
                label="Nome completo"
                placeholder="Nome completo"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                required
              />
              <AuthField
                label="CPF"
                placeholder="CPF"
                value={form.cpf}
                onChange={(event) => setForm({ ...form, cpf: event.target.value })}
                hint="Usado para identificar seu cadastro."
              />
            </>
          )}

          <AuthField
            label="Email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <AuthField
            label="Senha"
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            minLength={isRegister ? 8 : 1}
            hint={isRegister ? 'Use pelo menos 8 caracteres.' : null}
            required
          />

          <Button type="submit" className="w-full">
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegister ? 'Cadastrar e entrar' : 'Entrar'}
          </Button>
        </Card>
      </div>
    </PageShell>
  );
}

function ProductList({ products, onAdd, onDetails }) {
  if (products.length === 0) {
    return (
      <Feedback className="py-8 text-center">
        <strong className="block text-base text-slate-950">Nenhum produto disponivel</strong>
        <span className="mt-1 block text-sm text-slate-500">
          Assim que o admin ativar itens no cardapio, eles aparecem aqui.
        </span>
      </Feedback>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-normal text-slate-500">Produtos disponiveis</h2>
          <p className="mt-1 text-sm text-slate-600">Selecione uma opcao e adicione ao carrinho.</p>
        </div>
        <Badge variant="success">{products.length} {products.length === 1 ? 'item' : 'itens'}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAdd} onDetails={onDetails} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, onAdd, onDetails }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id || null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const selectedVariant = product.variants.find((variant) => variant.id === variantId);
  const price = selectedVariant?.price || product.price;
  const variantCount = product.variants.length;

  function handleAddClick() {
    if (variantCount > 0) {
      setShowVariantModal(true);
      return;
    }
    onAdd(product.id, null);
  }

  return (
    <Card as="article" className="overflow-hidden">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-400">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <ShoppingBag size={34} />
        )}
        {variantCount > 0 && (
          <Badge className="absolute right-3 top-3 bg-white/95 text-slate-700">
            {variantCount} {variantCount === 1 ? 'variante' : 'variantes'}
          </Badge>
        )}
      </div>

      <div className="flex min-h-[220px] flex-col p-4 sm:min-h-[236px]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black leading-snug text-slate-950">{product.name}</h2>
            {product.code && <Badge className="shrink-0">{product.code}</Badge>}
          </div>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
            {product.description || 'Produto disponivel para pedido.'}
          </p>
        </div>

        <div className="mt-4 flex-1">
          {product.variants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <Button
                  key={variant.id}
                  size="sm"
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    variant.id === variantId
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600',
                  )}
                  onClick={() => setVariantId(variant.id)}
                >
                  {variant.name}
                </Button>
              ))}
            </div>
          ) : (
            <Badge>Padrao</Badge>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="block text-xs font-black uppercase tracking-normal text-slate-500">Preco</span>
            <strong className="text-xl font-black text-slate-950">{formatCurrency(price)}</strong>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => onDetails(product)}>
              Detalhes
            </Button>
            <Button
              variant="dark"
              onClick={handleAddClick}
              aria-label={`Adicionar ${product.name}`}
            >
              <Plus size={18} />
              Adicionar
            </Button>
          </div>
        </div>
      </div>
      {showVariantModal && (
        <VariantPickerModal
          product={product}
          selectedVariantId={variantId}
          setSelectedVariantId={setVariantId}
          onCancel={() => setShowVariantModal(false)}
          onConfirm={() => {
            onAdd(product.id, variantId);
            setShowVariantModal(false);
          }}
        />
      )}
    </Card>
  );
}

function ProductDetailsModal({ product, onClose }) {
  return (
    <Dialog className="max-w-lg overflow-hidden p-0">
        <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-slate-400">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ShoppingBag size={42} />
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">{product.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{product.description || 'Produto disponivel para pedido.'}</p>
            </div>
            {product.code && <Badge>{product.code}</Badge>}
          </div>
          {product.variants.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <Badge key={variant.id} variant="success">{variant.name}</Badge>
              ))}
            </div>
          )}
          <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-950 p-4 text-white">
            <span className="text-sm font-bold text-slate-300">A partir de</span>
            <strong className="text-2xl font-black">{formatCurrency(product.price)}</strong>
          </div>
          <Button className="mt-5 w-full" onClick={onClose}>Fechar</Button>
        </div>
    </Dialog>
  );
}

function VariantPickerModal({ product, selectedVariantId, setSelectedVariantId, onCancel, onConfirm }) {
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const price = selectedVariant?.price || product.price;

  return (
    <Dialog>
        <Badge variant="success">Variante</Badge>
        <h2 className="mt-3 text-xl font-black text-slate-950">{product.name}</h2>
        <p className="mt-1 text-sm text-slate-500">Escolha uma opcao antes de adicionar ao carrinho.</p>
        <div className="mt-4 grid gap-2">
          {product.variants.map((variant) => (
            <Button
              key={variant.id}
              variant={variant.id === selectedVariantId ? 'dark' : 'secondary'}
              onClick={() => setSelectedVariantId(variant.id)}
              className="justify-between"
            >
              <span>{variant.name}</span>
              <strong>{formatCurrency(variant.price || product.price)}</strong>
            </Button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-950 p-4 text-white">
          <span className="text-sm font-bold text-slate-300">Total</span>
          <strong className="text-2xl font-black">{formatCurrency(price)}</strong>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button onClick={onConfirm}>
            <Plus size={18} />
            Adicionar
          </Button>
        </div>
    </Dialog>
  );
}

function CartPanel({ cart, onCheckout }) {
  const hasItems = cart.items.length > 0;

  return (
    <Card as="aside" className="sticky bottom-0 z-20 mt-6 rounded-t-lg p-4 shadow-lg lg:top-6 lg:z-auto lg:mt-0 lg:max-h-[calc(100vh-3rem)] lg:rounded-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Carrinho</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">Revise antes de finalizar.</p>
        </div>
        <Badge variant={hasItems ? 'success' : 'neutral'}>{cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}</Badge>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1 lg:max-h-[46vh]">
        {!hasItems && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <ShoppingBag className="mx-auto text-slate-400" size={28} />
            <strong className="mt-3 block text-sm text-slate-700">Carrinho vazio</strong>
            <span className="mt-1 block text-xs font-bold text-slate-500">Adicione produtos do cardapio para continuar.</span>
          </div>
        )}
        {cart.items.map((item) => (
          <div
            key={`${item.product_id}-${item.variant_id || 'base'}`}
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="line-clamp-2 text-sm font-black text-slate-800">{item.name}</span>
                <span className="mt-1 block text-xs font-bold text-slate-500">
                  {item.quantity} x {formatCurrency(item.unit_price)}
                </span>
              </div>
              <strong className="shrink-0 text-sm text-slate-950">{formatCurrency(item.total_price)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-slate-950 p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-300">Total</span>
          <strong className="text-2xl font-black">{formatCurrency(cart.total_amount)}</strong>
        </div>
      </div>

      <Button
        type="button"
        className="mt-4 w-full"
        disabled={!hasItems}
        onClick={onCheckout}
      >
        <Check size={18} />
        Finalizar pedido
      </Button>
    </Card>
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
  });
  const [variantForms, setVariantForms] = useState({});
  const [inventoryForms, setInventoryForms] = useState({});
  const [productImage, setProductImage] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');

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
      const [productData, orderData, inventoryData, auditData] = await Promise.all([
        api('/products'),
        api('/orders'),
        api('/inventory'),
        api('/audit-logs'),
      ]);
      setProducts(productData);
      setOrders(orderData);
      setInventory(inventoryData);
      setAuditLogs(auditData);
      setInventoryForms(Object.fromEntries(
        inventoryData.map((item) => [
          item.id,
          { quantity: String(item.quantity), min_quantity: String(item.min_quantity) },
        ]),
      ));
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
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  async function removeProduct(productId) {
    try {
      await api(`/products/${productId}`, { method: 'DELETE' });
      await refreshAdminData();
      toast.success('Produto removido');
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  async function saveVariant(productId) {
    const form = variantForms[productId] || {};
    try {
      await api(`/products/${productId}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          description: form.description || null,
          price: form.price || null,
        }),
      });
      setVariantForms({ ...variantForms, [productId]: { name: '', code: '', description: '', price: '' } });
      await refreshAdminData();
      toast.success('Variante criada');
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  async function saveInventory(itemId) {
    const form = inventoryForms[itemId] || {};
    try {
      await api(`/inventory/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: Number(form.quantity),
          min_quantity: Number(form.min_quantity),
        }),
      });
      await refreshAdminData();
      toast.success('Estoque atualizado');
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  const revenue = orders.reduce((total, order) => total + Number(order.total_amount), 0);
  const activeProductCount = products.filter((product) => product.is_active).length;
  const lowInventory = inventory.filter((item) => item.quantity <= item.min_quantity);
  const recentOrders = orders.slice(0, 4);

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
          <Link to="/totem" className="flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50">
            Totem
          </Link>
        </div>
      </AppHeader>

      <PageContent>
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
            { key: 'orders', icon: <ShoppingBag size={16} />, label: 'Pedidos' },
            { key: 'products', icon: <Package size={16} />, label: 'Produtos' },
            { key: 'inventory', icon: <Package size={16} />, label: 'Estoque' },
            { key: 'audit', icon: <LayoutDashboard size={16} />, label: 'Auditoria' },
          ].map(({ key, icon, label }) => (
            <Button
              key={key}
              variant={tab === key ? 'dark' : 'secondary'}
              size="sm"
              onClick={() => setTab(key)}
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>

        {adminDataLoading && <Feedback className="mb-4 py-3">Carregando dados...</Feedback>}

        {tab === 'dashboard' && (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">Pedidos</p>
                  <Badge>{orders.length === 1 ? 'Hoje' : 'Total'}</Badge>
                </div>
                <strong className="mt-3 block text-3xl font-black">{orders.length}</strong>
                <span className="mt-1 block text-xs font-bold text-slate-500">Pedidos registrados no sistema.</span>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">Faturamento</p>
                  <Badge variant="success">Registrado</Badge>
                </div>
                <strong className="mt-3 block text-3xl font-black">{formatCurrency(revenue)}</strong>
                <span className="mt-1 block text-xs font-bold text-slate-500">Soma dos pedidos salvos.</span>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">Produtos ativos</p>
                  <Badge>{products.length} total</Badge>
                </div>
                <strong className="mt-3 block text-3xl font-black">{activeProductCount}</strong>
                <span className="mt-1 block text-xs font-bold text-slate-500">Itens visiveis no cardapio.</span>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black">Pedidos recentes</h2>
                  <Button variant="secondary" size="sm" onClick={() => setTab('orders')}>Ver todos</Button>
                </div>
                {recentOrders.length === 0 ? (
                  <Feedback className="py-4">Nenhum pedido registrado ainda.</Feedback>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3">
                        <div>
                          <strong className="block text-sm text-slate-950">Pedido #{order.id}</strong>
                          <span className="text-xs font-bold text-slate-500">{order.customer_name || `Usuario ${order.user_id}`}</span>
                        </div>
                        <strong className="text-sm text-slate-950">{formatCurrency(order.total_amount)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black">Estoque</h2>
                  <Badge variant={lowInventory.length > 0 ? 'danger' : 'success'}>
                    {lowInventory.length > 0 ? `${lowInventory.length} alerta` : 'Ok'}
                  </Badge>
                </div>
                {lowInventory.length === 0 ? (
                  <Feedback variant="success" className="py-4">Nenhum item abaixo do minimo.</Feedback>
                ) : (
                  <div className="space-y-2">
                    {lowInventory.slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-lg bg-red-50 px-3 py-3 text-sm">
                        <strong className="text-red-700">Produto #{item.product_id}</strong>
                        <span className="mt-1 block text-xs font-bold text-red-600">
                          {item.quantity} em estoque, minimo {item.min_quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <Card as="section" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="text-lg font-black">Pedidos</h2>
                <p className="mt-1 text-sm text-slate-500">Pedidos salvos pelo cliente mobile e pelo totem.</p>
              </div>
              <Badge>{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</Badge>
            </div>
            {orders.length === 0 ? (
              <div className="p-4">
                <Feedback>Nenhum pedido registrado.</Feedback>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-normal text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Itens</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="align-top">
                        <td className="px-4 py-4 font-black text-slate-950">#{order.id}</td>
                        <td className="px-4 py-4 text-slate-600">{order.customer_name || `Usuario ${order.user_id}`}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {order.items.map((item) => (
                            <span key={item.id} className="mr-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">
                              {item.quantity}x produto #{item.product_id}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-4 text-right font-black text-slate-950">{formatCurrency(order.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === 'products' && (
          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <Card as="form" onSubmit={saveProduct} className="h-fit p-4">
              <h2 className="mb-4 text-lg font-black">{editingProduct ? 'Editar produto' : 'Novo produto'}</h2>
              <div className="space-y-3">
                <TextInput placeholder="Nome" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
                <TextInput placeholder="Codigo" value={productForm.code} onChange={(event) => setProductForm({ ...productForm, code: event.target.value })} required />
                <TextInput placeholder="Descricao" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
                <TextInput placeholder="Preco" type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required />
                <TextInput type="file" accept="image/*" onChange={(event) => setProductImage(event.target.files?.[0] || null)} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={resetProductForm}>Limpar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              {products.map((product) => (
                <Card key={product.id} as="article" className="p-4">
                  {product.image_url && <img src={product.image_url} alt={product.name} className="mb-3 h-32 w-full rounded-md object-cover" />}
                  <h2 className="font-black">{product.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{product.description || 'Sem descricao'}</p>
                  <strong className="mt-3 block">{formatCurrency(product.price)}</strong>
                  {product.variants.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <Badge key={variant.id} variant={variant.is_active ? 'success' : 'neutral'}>
                          {variant.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(product)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => setProductToDelete(product)}>
                      <Trash2 size={14} />
                      Excluir
                    </Button>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-black text-slate-700">Nova variante</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <TextInput
                        placeholder="Variante"
                        value={variantForms[product.id]?.name || ''}
                        onChange={(event) => setVariantForms({
                          ...variantForms,
                          [product.id]: { ...(variantForms[product.id] || {}), name: event.target.value },
                        })}
                      />
                      <TextInput
                        placeholder="Codigo variante"
                        value={variantForms[product.id]?.code || ''}
                        onChange={(event) => setVariantForms({
                          ...variantForms,
                          [product.id]: { ...(variantForms[product.id] || {}), code: event.target.value },
                        })}
                      />
                      <TextInput
                        placeholder="Descricao variante"
                        value={variantForms[product.id]?.description || ''}
                        onChange={(event) => setVariantForms({
                          ...variantForms,
                          [product.id]: { ...(variantForms[product.id] || {}), description: event.target.value },
                        })}
                      />
                      <TextInput
                        placeholder="Preco variante"
                        type="number"
                        min="0"
                        step="0.01"
                        value={variantForms[product.id]?.price || ''}
                        onChange={(event) => setVariantForms({
                          ...variantForms,
                          [product.id]: { ...(variantForms[product.id] || {}), price: event.target.value },
                        })}
                      />
                    </div>
                    <Button className="mt-3 w-full" size="sm" onClick={() => saveVariant(product.id)}>
                      <Plus size={16} />
                      Criar variante
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {tab === 'inventory' && (
          <Card as="section" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="text-lg font-black">Estoque</h2>
                <p className="mt-1 text-sm text-slate-500">Controle simples por produto e variante.</p>
              </div>
              <Badge variant={lowInventory.length > 0 ? 'danger' : 'success'}>
                {lowInventory.length > 0 ? `${lowInventory.length} alerta` : 'Sem alertas'}
              </Badge>
            </div>
            {inventory.length === 0 ? (
              <div className="p-4">
                <Feedback>Nenhum estoque cadastrado.</Feedback>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-normal text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Variante</th>
                      <th className="px-4 py-3">Quantidade</th>
                      <th className="px-4 py-3">Minimo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => {
                      const isLow = item.quantity <= item.min_quantity;
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-4 font-black text-slate-950">#{item.product_id}</td>
                          <td className="px-4 py-4 text-slate-600">{item.variant_id ? `#${item.variant_id}` : 'Produto base'}</td>
                          <td className="px-4 py-4">
                            <TextInput
                              className="max-w-28"
                              type="number"
                              min="0"
                              value={inventoryForms[item.id]?.quantity || ''}
                              onChange={(event) => setInventoryForms({
                                ...inventoryForms,
                                [item.id]: { ...(inventoryForms[item.id] || {}), quantity: event.target.value },
                              })}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <TextInput
                              className="max-w-28"
                              type="number"
                              min="0"
                              value={inventoryForms[item.id]?.min_quantity || ''}
                              onChange={(event) => setInventoryForms({
                                ...inventoryForms,
                                [item.id]: { ...(inventoryForms[item.id] || {}), min_quantity: event.target.value },
                              })}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'Baixo' : 'Ok'}</Badge>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button size="sm" onClick={() => saveInventory(item.id)}>Salvar</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === 'audit' && (
          <Card as="section" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="text-lg font-black">Auditoria</h2>
                <p className="mt-1 text-sm text-slate-500">Acoes administrativas e eventos criticos registrados.</p>
              </div>
              <Badge>{auditLogs.length} logs</Badge>
            </div>
            {auditLogs.length === 0 ? (
              <div className="p-4">
                <Feedback>Nenhum log registrado.</Feedback>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-normal text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Acao</th>
                      <th className="px-4 py-3">Entidade</th>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-4 font-black text-slate-950">{log.action}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {log.entity || 'Sistema'} {log.entity_id ? `#${log.entity_id}` : ''}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{log.user_id ? `#${log.user_id}` : 'Sistema'}</td>
                        <td className="px-4 py-4 text-slate-600">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {productToDelete && (
          <DeleteConfirmModal
            product={productToDelete}
            onCancel={() => setProductToDelete(null)}
            onConfirm={async () => {
              await removeProduct(productToDelete.id);
              setProductToDelete(null);
            }}
          />
        )}

        {errorDialog && <ErrorDialog message={errorDialog} onClose={() => setErrorDialog('')} />}
      </PageContent>
    </PageShell>
  );
}

function CheckoutConfirmModal({ cart, onCancel, onConfirm }) {
  return (
    <Dialog>
        <Badge variant="success">Confirmacao</Badge>
        <h2 className="mt-3 text-xl font-black text-slate-950">Finalizar pedido?</h2>
        <p className="mt-1 text-sm text-slate-500">Confira o total antes de gerar o pedido para a administracao.</p>

        <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-700">{item.quantity}x {item.name}</span>
              <strong className="text-slate-950">{formatCurrency(item.total_price)}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-950 p-4 text-white">
          <span className="text-sm font-bold text-slate-300">Total</span>
          <strong className="text-2xl font-black">{formatCurrency(cart.total_amount)}</strong>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Voltar
          </Button>
          <Button type="button" onClick={onConfirm}>
            <Check size={18} />
            Confirmar
          </Button>
        </div>
    </Dialog>
  );
}

function OrderSuccessModal({ result, onClose }) {
  return (
    <Dialog className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
          <Check size={24} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-950">Pedido #{result.order_id} criado</h2>
        <p className="mt-2 text-sm text-slate-500">O resumo esta pronto para envio pelo WhatsApp.</p>
        <div className="mt-4 rounded-lg bg-slate-950 p-4 text-white">
          <span className="text-sm font-bold text-slate-300">Total</span>
          <strong className="mt-1 block text-2xl font-black">{formatCurrency(result.total_amount)}</strong>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
          <Button onClick={() => window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer')}>
            WhatsApp
          </Button>
        </div>
    </Dialog>
  );
}

function ErrorDialog({ message, onClose }) {
  return (
    <Dialog>
        <Badge variant="danger">Erro</Badge>
        <h2 className="mt-3 text-xl font-black text-slate-950">Nao foi possivel concluir</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <Button className="mt-5 w-full" onClick={onClose}>Entendi</Button>
    </Dialog>
  );
}

function DeleteConfirmModal({ product, onCancel, onConfirm }) {
  return (
    <Dialog>
        <Badge variant="danger">Excluir</Badge>
        <h2 className="mt-3 text-xl font-black text-slate-950">Excluir produto?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {product.name} sera removido do cardapio ativo, mantendo pedidos historicos.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button variant="danger" onClick={onConfirm}>Excluir</Button>
        </div>
    </Dialog>
  );
}

function CustomerNameModal({ cart, customerName, setCustomerName, onCancel, onConfirm }) {
  return (
    <Dialog as="form" onSubmit={onConfirm}>
        <Badge variant="success">Totem</Badge>
        <h2 className="mt-3 text-xl font-black text-slate-950">Finalizar pedido</h2>
        <p className="mt-1 text-sm text-slate-500">Informe o nome do cliente e confirme o total antes de enviar.</p>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-950 p-4 text-white">
          <span className="text-sm font-bold text-slate-300">{cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}</span>
          <strong className="text-2xl font-black">{formatCurrency(cart.total_amount)}</strong>
        </div>
        <TextInput
          className="mt-4 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
          placeholder="Nome do cliente"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          autoFocus
          required
          minLength={2}
        />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Voltar
          </Button>
          <Button type="submit">
            <Check size={18} />
            Enviar pedido
          </Button>
        </div>
    </Dialog>
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
  const [productsError, setProductsError] = useState('');
  const [cartLines, setCartLines] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');
  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const cart = useMemo(() => buildLocalCart(cartLines, products), [cartLines, products]);

  useEffect(() => {
    api('/products')
      .then(setProducts)
      .catch((error) => {
        setProductsError(error.message);
        toast.error(error.message);
      })
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
      setSuccessResult(result);
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  return (
    <PageShell>
      <AppHeader logoTo="/totem" logoLabel="Gym Prime Totem">
        <Badge variant="success">Publico</Badge>
      </AppHeader>

      <PageContent className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-5">
            <h1 className="text-2xl font-black tracking-normal">Cardapio publico</h1>
            <p className="mt-1 text-sm text-slate-500">Escolha os itens no totem e informe o nome apenas ao finalizar.</p>
          </div>
          {productsError ? (
            <Feedback variant="danger">{productsError}</Feedback>
          ) : productsLoading ? (
            <Feedback>Carregando produtos...</Feedback>
          ) : (
            <ProductList products={activeProducts} onAdd={handleAdd} onDetails={setDetailsProduct} />
          )}
        </div>
        <CartPanel cart={cart} onCheckout={() => setShowNameModal(true)} />
      </PageContent>

      {showNameModal && (
        <CustomerNameModal
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          onCancel={() => setShowNameModal(false)}
          onConfirm={handleConfirmCheckout}
        />
      )}
      {detailsProduct && <ProductDetailsModal product={detailsProduct} onClose={() => setDetailsProduct(null)} />}
      {successResult && <OrderSuccessModal result={successResult} onClose={() => setSuccessResult(null)} />}
      {errorDialog && <ErrorDialog message={errorDialog} onClose={() => setErrorDialog('')} />}
    </PageShell>
  );
}

function MenuPage({ user }) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');
  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);

  useEffect(() => {
    api('/products')
      .then(setProducts)
      .catch((error) => {
        setProductsError(error.message);
        toast.error(error.message);
      })
      .finally(() => setProductsLoading(false));
    api('/cart').then(setCart).catch(() => {});
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
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  async function handleCheckout() {
    try {
      const result = await api('/cart/checkout', { method: 'POST' });
      setCart({ items: [], total_amount: 0 });
      setShowCheckoutConfirm(false);
      toast.success(`Pedido #${result.order_id} criado`);
      setSuccessResult(result);
    } catch (error) {
      setErrorDialog(error.message);
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
          {productsError ? (
            <Feedback variant="danger">{productsError}</Feedback>
          ) : productsLoading ? (
            <Feedback>Carregando produtos...</Feedback>
          ) : (
            <ProductList products={activeProducts} onAdd={handleAdd} onDetails={setDetailsProduct} />
          )}
        </div>
        <CartPanel cart={cart} onCheckout={() => setShowCheckoutConfirm(true)} />
      </PageContent>

      {showCheckoutConfirm && (
        <CheckoutConfirmModal
          cart={cart}
          onCancel={() => setShowCheckoutConfirm(false)}
          onConfirm={handleCheckout}
        />
      )}
      {detailsProduct && <ProductDetailsModal product={detailsProduct} onClose={() => setDetailsProduct(null)} />}
      {successResult && <OrderSuccessModal result={successResult} onClose={() => setSuccessResult(null)} />}
      {errorDialog && <ErrorDialog message={errorDialog} onClose={() => setErrorDialog('')} />}
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
