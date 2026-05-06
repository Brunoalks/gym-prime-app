import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Dumbbell, Grid2X2, Leaf, LogIn, Plus, Search, ShoppingBag, UserPlus, Zap } from 'lucide-react';
import { Badge, Button, Card, Feedback, ModalActions, TextInput } from '../../components/ui.jsx';
import { APP_ROUTES } from '../../app/routes.js';
import { toast } from '../../app/toast.js';
import { gymPrimeApi } from '../../services/gymPrimeApi.js';
import { buildProductMap, filterProductsByCategory, formatCurrency, PRODUCT_CATEGORIES } from '../shared/catalog.js';
import { BrandMark, ErrorDialog, OrderSuccessModal, PriceSummary, ProductDetailsModal, ProductImage, ProductPromoBadge, ProductStockBadge, VariantPickerModal } from '../shared/SharedUi.jsx';

const CATEGORY_ICONS = {
  all: <Grid2X2 size={18} />,
  drinks: <ShoppingBag size={19} />,
  protein: <Dumbbell size={20} />,
  snacks: <Leaf size={19} />,
  preworkout: <Zap size={19} />,
};

function AuthField({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-gp-xs font-gp-black uppercase text-slate-600">{label}</span>
      <TextInput {...props} />
      {hint && <span className="mt-1 block text-gp-xs font-gp-bold text-slate-600">{hint}</span>}
    </label>
  );
}

function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', cpf: '', password: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (isRegister) {
        await gymPrimeApi.register({
          full_name: form.full_name,
          email: form.email,
          cpf: form.cpf || null,
          password: form.password,
        });
      }
      const user = await gymPrimeApi.login({ email: form.email, password: form.password });
      onLogin(user);
      toast.success('Sessão iniciada');
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <main className="gp-app-bg min-h-screen px-5 py-8 text-gp-text-primary">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="max-w-xl">
          <BrandMark tone="dark" />
          <h1 className="mt-8 max-w-md text-4xl font-gp-black leading-tight sm:text-5xl">Peça rápido antes ou depois do treino</h1>
          <p className="mt-4 max-w-md text-gp-base font-gp-medium leading-7 text-gp-text-secondary">
            Entre para montar seu pedido pelo celular e enviar o resumo direto para a administração.
          </p>
        </section>

        <Card as="form" onSubmit={handleSubmit} className="space-y-4 p-5 text-gp-text-inverse">
          <div>
            <h2 className="text-2xl font-gp-black">{isRegister ? 'Criar conta' : 'Entrar'}</h2>
            <p className="mt-1 text-gp-sm font-gp-medium text-slate-600">
              {isRegister ? 'Informe seus dados para pedir pelo celular.' : 'Use seu email e senha cadastrados.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-gp bg-slate-100 p-1">
            <Button variant={isRegister ? 'ghost' : 'dark'} size="sm" className="w-full" onClick={() => setIsRegister(false)}>Entrar</Button>
            <Button variant={isRegister ? 'dark' : 'ghost'} size="sm" className="w-full" onClick={() => setIsRegister(true)}>Criar conta</Button>
          </div>
          {isRegister && (
            <>
              <AuthField label="Nome completo" placeholder="Nome completo" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
              <AuthField label="CPF" placeholder="CPF" value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} hint="Usado para identificar seu cadastro." />
            </>
          )}
          <AuthField label="Email" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <AuthField label="Senha" type="password" placeholder="Senha" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={isRegister ? 8 : 1} hint={isRegister ? 'Use pelo menos 8 caracteres.' : null} required />
          <Button type="submit" className="gp-primary-cta w-full">
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegister ? 'Cadastrar e entrar' : 'Entrar'}
          </Button>
        </Card>
      </div>
    </main>
  );
}

function CustomerProductCard({ product, onAdd, onDetails }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id || null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const selectedVariant = product.variants.find((variant) => variant.id === variantId);
  const price = selectedVariant?.price || product.price;

  function handleAdd() {
    if (product.variants.length > 0) {
      setShowVariantModal(true);
      return;
    }
    onAdd(product.id, null);
  }

  return (
    <article className="gp-card-light gp-card-hover grid grid-cols-[clamp(6.25rem,30vw,7.25rem)_minmax(0,1fr)] gap-3 overflow-hidden p-2.5">
      <ProductImage product={product} className="aspect-square rounded-gp" />
      <div className="gp-product-card-content flex min-w-0 flex-col rounded-gp px-2 py-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="gp-product-card-title line-clamp-2 min-w-0 text-lg font-gp-black leading-tight sm:text-xl">{product.name}</h2>
          <ProductPromoBadge className="min-h-6 shrink-0 px-2 text-[0.68rem]" showIcon />
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-gp-sm font-gp-medium leading-5 text-slate-700 sm:text-gp-base">{product.description || 'Produto disponível para pedido.'}</p>
        <ProductStockBadge className="mt-3 min-h-6 w-fit px-2 text-[0.68rem]" showIcon />
        <div className="mt-auto pt-3">
          <strong className="gp-product-card-price text-xl font-gp-black leading-none">{formatCurrency(price)}</strong>
          <div className="gp-product-card-actions mt-3 grid grid-cols-[1fr_44px] gap-2 pt-3">
            <Button size="sm" variant="secondary" className="min-h-11 min-w-0 px-2" onClick={() => onDetails(product)}>
              <span className="truncate">Detalhes</span>
              <ChevronRight size={16} />
            </Button>
            <Button size="icon" className="gp-primary-cta h-11 w-11" onClick={handleAdd} aria-label={`Adicionar ${product.name}`}>
              <Plus size={23} />
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
    </article>
  );
}

function CustomerCartBar({ cart, onCheckout }) {
  const hasItems = cart.items.length > 0;
  return (
    <div className="gp-bottom-bar fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 text-gp-text-primary">
      <div className="mx-auto flex max-w-xl min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-gp-pill border border-gp-border-inverse bg-white/10 shadow-gp-sm">
            <ShoppingBag size={26} />
            {cart.items.length > 0 && <span className="absolute -right-1 -top-1 rounded-gp-pill bg-gp-lime px-2 py-0.5 text-gp-xs font-gp-black text-gp-text-inverse">{cart.items.length}</span>}
          </div>
          <div className="min-w-0">
            <span className="block text-gp-xs font-gp-black uppercase text-gp-text-muted">{cart.items.length} itens</span>
            <strong className="block truncate text-xl font-gp-black text-gp-lime sm:text-2xl">{formatCurrency(cart.total_amount)}</strong>
          </div>
        </div>
        <Button className={`gp-primary-cta min-h-12 shrink-0 px-4 text-gp-sm sm:min-h-14 sm:px-6 sm:text-gp-base ${hasItems ? 'shadow-gp-glow' : ''}`} disabled={!hasItems} onClick={onCheckout}>
          Ver carrinho
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
}

function CheckoutConfirmModal({ cart, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-gp-bg-panel/70 p-4 sm:items-center">
      <section className="gp-card-light max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-gp p-5 shadow-gp-modal sm:rounded-gp">
        <Badge variant="success">Confirmação</Badge>
        <h2 className="mt-3 text-xl font-gp-black text-gp-text-inverse">Finalizar pedido?</h2>
        <p className="mt-1 text-gp-sm text-slate-700">Confira o total antes de gerar o pedido para a administração.</p>
        <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="flex items-start justify-between gap-3 rounded-gp bg-slate-50 px-3 py-2 text-gp-sm">
              <span className="min-w-0 break-words text-slate-700">{item.quantity}x {item.name}</span>
              <strong className="shrink-0 text-gp-text-inverse">{formatCurrency(item.total_price)}</strong>
            </div>
          ))}
        </div>
        <PriceSummary className="mt-4" value={cart.total_amount} />
        <ModalActions>
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button className="gp-primary-cta" onClick={onConfirm}><Check size={18} /> Confirmar</Button>
        </ModalActions>
      </section>
    </div>
  );
}

function CustomerOrdersPanel({ orders, productMap, onRefresh }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-gp-black sm:text-4xl">Meus pedidos</h1>
          <p className="mt-2 text-lg font-gp-medium text-gp-text-secondary">Histórico do seu acesso atual.</p>
        </div>
        <Button className="shrink-0" variant="inverse" onClick={onRefresh}>Atualizar</Button>
      </div>
      {orders.length === 0 ? <Feedback>Nenhum pedido encontrado.</Feedback> : orders.map((order) => (
        <article key={order.id} className="gp-card-light p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="neutral">#{order.id}</Badge>
              <h2 className="mt-2 text-xl font-gp-black">{formatCurrency(order.total_amount)}</h2>
              <p className="mt-1 text-gp-sm font-gp-bold text-slate-600">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
            </div>
            <Badge className="shrink-0" variant={order.status === 'canceled' ? 'danger' : 'success'}>{order.status}</Badge>
          </div>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-gp-sm bg-slate-50 px-3 py-2 text-gp-sm">
                <span className="min-w-0 break-words">{item.quantity}x {productMap.get(item.product_id)?.name || `Produto #${item.product_id}`}</span>
                <strong className="shrink-0">{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function CustomerMenuPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [publicSettings, setPublicSettings] = useState({ establishment_name: 'Gym Prime', menu_is_open: true, totem_message: '' });
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [view, setView] = useState('menu');
  const [myOrders, setMyOrders] = useState([]);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');

  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const visibleProducts = useMemo(() => filterProductsByCategory(activeProducts, category), [activeProducts, category]);
  const productMap = useMemo(() => buildProductMap(products), [products]);

  useEffect(() => {
    Promise.all([gymPrimeApi.listProducts(), gymPrimeApi.getPublicSettings().catch(() => null)])
      .then(([productData, settingsData]) => {
        setProducts(productData);
        if (settingsData) setPublicSettings(settingsData);
      })
      .catch((error) => {
        setProductsError(error.message);
        toast.error(error.message);
      })
      .finally(() => setProductsLoading(false));
    gymPrimeApi.getCart().then(setCart).catch(() => {});
    refreshMyOrders();
  }, []);

  async function refreshMyOrders() {
    try {
      setMyOrders(await gymPrimeApi.listMyOrders());
    } catch {
      setMyOrders([]);
    }
  }

  async function handleAdd(productId, variantId) {
    if (!publicSettings.menu_is_open) {
      toast.error('Cardápio fechado no momento');
      return;
    }
    try {
      const data = await gymPrimeApi.addCartItem({ product_id: productId, variant_id: variantId, quantity: 1 });
      setCart(data);
      toast.success('Item adicionado');
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  async function handleCheckout() {
    if (!publicSettings.menu_is_open) {
      setShowCheckoutConfirm(false);
      toast.error('Cardápio fechado no momento');
      return;
    }
    try {
      const result = await gymPrimeApi.checkoutCart();
      setCart({ items: [], total_amount: 0 });
      setShowCheckoutConfirm(false);
      setSuccessResult(result);
      refreshMyOrders();
      toast.success(`Pedido #${result.order_id} criado`);
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  return (
    <main className="gp-app-bg min-h-screen overflow-x-hidden pb-[calc(10.5rem+env(safe-area-inset-bottom))] text-gp-text-primary">
      <header className="px-4 pb-3 pt-5">
        <div className="mx-auto flex max-w-xl min-w-0 items-center justify-between gap-4">
          <BrandMark tone="dark" />
          <div className="flex min-w-0 items-center gap-3 text-right">
            <button type="button" onClick={onLogout} className="text-gp-xs font-gp-black text-gp-text-muted underline-offset-4 hover:text-gp-text-primary hover:underline">
              Sair
            </button>
            <div className="max-w-[45vw] truncate rounded-gp-pill border border-gp-border-inverse bg-white/10 px-3 py-2 text-gp-sm font-gp-bold shadow-gp-sm">
              Oi, <span className="text-gp-lime">{user.full_name?.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-4">
        <div className="gp-promo-card p-4 text-gp-text-primary">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <span className={`gp-operational-status inline-flex min-h-7 items-center gap-2 px-3 text-gp-xs font-gp-black uppercase ${publicSettings.menu_is_open ? '' : 'border-gp-danger/30 bg-gp-danger-soft text-gp-danger'}`}>
                <span className={`h-2 w-2 rounded-gp-pill shadow-gp-glow ${publicSettings.menu_is_open ? 'bg-gp-lime' : 'bg-gp-danger'}`} />
                {publicSettings.menu_is_open ? 'Aberto' : 'Fechado'} • Retirada
              </span>
              <h1 className="mt-3 text-xl font-gp-black leading-tight">Peça rápido e retire no balcão</h1>
            </div>
            <ShoppingBag className="shrink-0 text-gp-lime" size={32} />
          </div>
        </div>
        <div className="mt-4 flex min-h-14 min-w-0 items-center gap-3 rounded-gp border border-gp-border-inverse bg-white/[0.08] px-4 text-gp-text-secondary shadow-gp-sm backdrop-blur">
          <Search className="shrink-0 text-gp-lime" size={22} />
          <span className="truncate text-gp-base font-gp-bold">Buscar no cardápio</span>
        </div>
        <div className="gp-scrollbar-none -mx-4 mt-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2">
          {PRODUCT_CATEGORIES.slice(0, 5).map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={category === item.key ? 'primary' : 'inverse'}
              className={`min-h-12 max-w-[72vw] shrink-0 rounded-gp-pill px-4 text-gp-sm sm:px-5 sm:text-gp-base ${category === item.key ? '' : 'gp-category-pill'}`}
              onClick={() => setCategory(item.key)}
            >
              {CATEGORY_ICONS[item.key]}
              <span className="truncate">{item.label}</span>
            </Button>
          ))}
        </div>
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-2 rounded-gp border border-gp-border-inverse bg-white/[0.075] p-1 shadow-gp-sm">
            <Button variant={view === 'menu' ? 'primary' : 'inverse'} className={view === 'menu' ? '' : 'bg-transparent'} onClick={() => setView('menu')}>Cardápio</Button>
            <Button variant={view === 'orders' ? 'primary' : 'inverse'} className={view === 'orders' ? '' : 'bg-transparent'} onClick={() => setView('orders')}>Meus pedidos</Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {view === 'orders' ? (
            <CustomerOrdersPanel orders={myOrders} productMap={productMap} onRefresh={refreshMyOrders} />
          ) : !publicSettings.menu_is_open ? (
            <Feedback variant="danger">Cardápio fechado no momento. Volte em instantes.</Feedback>
          ) : productsError ? (
            <Feedback variant="danger">{productsError}</Feedback>
          ) : productsLoading ? (
            <Feedback>Carregando produtos...</Feedback>
          ) : visibleProducts.length === 0 ? (
            <Feedback>Nenhum produto disponível nesta categoria.</Feedback>
          ) : (
            visibleProducts.map((product) => (
              <CustomerProductCard key={product.id} product={product} onAdd={handleAdd} onDetails={setDetailsProduct} />
            ))
          )}
        </div>
      </section>

      <CustomerCartBar cart={cart} onCheckout={() => setShowCheckoutConfirm(true)} />
      {showCheckoutConfirm && <CheckoutConfirmModal cart={cart} onCancel={() => setShowCheckoutConfirm(false)} onConfirm={handleCheckout} />}
      {detailsProduct && <ProductDetailsModal product={detailsProduct} onClose={() => setDetailsProduct(null)} />}
      {successResult && <OrderSuccessModal result={successResult} onClose={() => setSuccessResult(null)} />}
      {errorDialog && <ErrorDialog message={errorDialog} onClose={() => setErrorDialog('')} />}
    </main>
  );
}

export function CustomerApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gymPrimeApi.getSession()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    try {
      await gymPrimeApi.logout();
      setUser(null);
      toast.success('Sessão encerrada');
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return <div className="gp-app-bg flex min-h-screen items-center justify-center text-gp-text-primary">Carregando</div>;
  }

  return user ? <CustomerMenuPage user={user} onLogout={handleLogout} /> : <LoginPage onLogin={setUser} />;
}

export function CustomerRedirect() {
  return <Link to={APP_ROUTES.customer}>Voltar ao cardápio</Link>;
}
