import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Dumbbell, Grid2X2, Leaf, LogIn, Plus, RotateCcw, Search, ShoppingBag, Trash2, UserPlus, X, Zap } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Feedback, ModalActions, TextInput } from '../../components/ui.jsx';
import { APP_ROUTES } from '../../app/routes.js';
import { toast } from '../../app/toast.js';
import { gymPrimeApi } from '../../services/gymPrimeApi.js';
import { buildLocalCart, buildProductMap, filterProductsByCategory, formatCurrency, getProductCategory, PRODUCT_CATEGORIES } from '../shared/catalog.js';
import { BrandMark, ErrorDialog, OrderSuccessModal, PriceSummary, ProductDetailsModal, ProductImage, ProductPromoBadge, ProductStockBadge, VariantPickerModal } from '../shared/SharedUi.jsx';

const CATEGORY_ICONS = {
  all: <Grid2X2 size={18} />,
  drinks: <ShoppingBag size={19} />,
  protein: <Dumbbell size={20} />,
  snacks: <Leaf size={19} />,
  preworkout: <Zap size={19} />,
};

const CUSTOMER_ORDER_STATUS_LABELS = {
  pending: 'Pendente',
  preparing: 'Preparando',
  ready: 'Pronto',
  completed: 'Concluído',
  canceled: 'Cancelado',
};

function matchesProductSearch(product, searchTerm) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;
  const categoryKey = getProductCategory(product);
  const categoryLabel = PRODUCT_CATEGORIES.find((item) => item.key === categoryKey)?.label || categoryKey;
  return [product.name, product.description, categoryKey, categoryLabel].some((value) => String(value || '').toLowerCase().includes(query));
}

function getCartItemKey(item) {
  return `${item.product_id}-${item.variant_id || 'base'}`;
}

function cartItemsToLines(items) {
  return items.map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity: item.quantity,
  }));
}

function getCartSyncDeltas(serverItems, draftItems) {
  const draftByKey = new Map(draftItems.map((item) => [getCartItemKey(item), item]));
  const serverByKey = new Map(serverItems.map((item) => [getCartItemKey(item), item]));

  for (const serverItem of serverItems) {
    const draftItem = draftByKey.get(getCartItemKey(serverItem));
    if (!draftItem || Number(serverItem.quantity) > Number(draftItem.quantity)) return null;
  }

  return draftItems.flatMap((draftItem) => {
    const serverItem = serverByKey.get(getCartItemKey(draftItem));
    const quantity = Number(draftItem.quantity) - Number(serverItem?.quantity || 0);
    if (quantity <= 0) return [];
    return [{ product_id: draftItem.product_id, variant_id: draftItem.variant_id || null, quantity }];
  });
}

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
    <article className="gp-card-light gp-card-hover grid grid-cols-[clamp(5.5rem,26vw,6.5rem)_minmax(0,1fr)] gap-2.5 overflow-hidden p-2">
      <ProductImage product={product} className="aspect-square rounded-gp" />
      <div className="gp-product-card-content flex min-w-0 flex-col rounded-gp px-2 py-1.5">
        <h2 className="gp-product-card-title line-clamp-2 min-w-0 text-base font-gp-black leading-tight sm:text-lg">{product.name}</h2>
        <div className="mt-1.5 flex min-h-6 flex-wrap items-center gap-1.5">
          {product.variants.length > 0 && <ProductPromoBadge className="min-h-6 max-w-full shrink-0 truncate px-2 text-[0.68rem]">Variante</ProductPromoBadge>}
          <ProductStockBadge className="min-h-6 w-fit px-2 text-[0.68rem]" showIcon />
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-gp-sm font-gp-medium leading-5 text-slate-700 sm:text-gp-base">{product.description || 'Produto disponível para pedido.'}</p>
        <div className="mt-auto pt-2.5">
          <strong className="gp-product-card-price block truncate text-lg font-gp-black leading-none sm:text-xl">{formatCurrency(price)}</strong>
          <div className="gp-product-card-actions mt-2.5 grid grid-cols-[1fr_44px] gap-2 pt-2.5">
            <Button size="sm" variant="secondary" className="min-h-11 min-w-0 px-2" onClick={() => onDetails(product)}>
              <span className="truncate">Detalhes</span>
              <ChevronRight size={16} />
            </Button>
            <Button size="icon" className="gp-primary-cta h-11 w-11" onClick={handleAdd} aria-label={`Adicionar ${product.name}`}>
              <Plus size={22} />
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

function CustomerCartBar({ cart, onOpen }) {
  const itemCount = cart.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const hasItems = itemCount > 0;
  return (
    <div className="gp-bottom-bar fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 text-gp-text-primary">
      <div className="mx-auto flex max-w-xl min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-gp-pill border border-gp-border-inverse bg-white/10 shadow-gp-sm">
            <ShoppingBag size={26} />
            {itemCount > 0 && <span className="absolute -right-1 -top-1 rounded-gp-pill bg-gp-lime px-2 py-0.5 text-gp-xs font-gp-black text-gp-text-inverse">{itemCount}</span>}
          </div>
          <div className="min-w-0">
            <span className="block text-gp-xs font-gp-black uppercase text-gp-text-muted">{itemCount} itens</span>
            <strong className="block truncate text-xl font-gp-black text-gp-lime sm:text-2xl">{formatCurrency(cart.total_amount)}</strong>
          </div>
        </div>
        <Button className={`gp-primary-cta min-h-12 shrink-0 px-4 text-gp-sm sm:min-h-14 sm:px-6 sm:text-gp-base ${hasItems ? 'shadow-gp-glow' : ''}`} disabled={!hasItems} onClick={onOpen}>
          Ver carrinho
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
}

function CustomerCartModal({ cart, onCancel, onConfirm, onIncrement, onDecrement, onRemove, onClear }) {
  const hasItems = cart.items.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-gp-bg-panel/70 p-4 sm:items-center">
      <section className="gp-card-light max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-gp p-5 shadow-gp-modal sm:rounded-gp">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="success">Carrinho</Badge>
            <h2 className="mt-3 text-xl font-gp-black text-gp-text-inverse">Revise seu pedido</h2>
            <p className="mt-1 text-gp-sm text-slate-700">Ajuste quantidades antes de finalizar.</p>
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={onCancel} aria-label="Fechar carrinho">
            <X size={18} />
          </Button>
        </div>

        <div className="mt-4 max-h-[42dvh] space-y-2 overflow-y-auto pr-1">
          {!hasItems && (
            <EmptyState className="border-slate-200 bg-slate-50 py-6" icon={<ShoppingBag size={32} />} iconClassName="text-slate-500" title="Carrinho vazio">
              Adicione produtos para revisar seu pedido.
            </EmptyState>
          )}
          {cart.items.map((item) => (
            <div key={getCartItemKey(item)} className="rounded-gp border border-slate-200 bg-slate-50 p-3 text-gp-sm shadow-gp-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="line-clamp-2 break-words text-gp-text-inverse">{item.name}</strong>
                  <span className="mt-1 block font-gp-bold text-slate-600">{formatCurrency(item.unit_price)} un.</span>
                </div>
                <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-gp-danger hover:bg-red-50 hover:text-gp-danger" onClick={() => onRemove(item)} aria-label={`Remover ${item.name}`}>
                  <Trash2 size={17} />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-300 bg-white p-0 font-sans font-bold leading-none text-slate-950 shadow-gp-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-lime/35"
                    style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px', lineHeight: '1', color: '#06110b' }}
                    onClick={() => onDecrement(item)}
                    aria-label={`Diminuir ${item.name}`}
                  >
                    -
                  </button>
                  <strong className="w-8 text-center text-gp-base text-gp-text-inverse">{item.quantity}</strong>
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-gp-lime/60 bg-gp-lime p-0 font-sans font-bold leading-none text-slate-950 shadow-gp-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-lime/35"
                    style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px', lineHeight: '1', color: '#06110b' }}
                    onClick={() => onIncrement(item)}
                    aria-label={`Aumentar ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <strong className="text-base text-gp-text-inverse">{formatCurrency(item.total_price)}</strong>
              </div>
            </div>
          ))}
        </div>

        <PriceSummary className="mt-4" value={cart.total_amount} />
        {hasItems && (
          <Button className="mt-3 w-full" variant="danger" onClick={onClear}>
            <RotateCcw size={18} />
            Limpar carrinho
          </Button>
        )}
        <ModalActions>
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button className="gp-primary-cta" disabled={!hasItems} onClick={onConfirm}><Check size={18} /> Finalizar</Button>
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
      {orders.length === 0 ? <Feedback>Nenhum pedido encontrado neste acesso.</Feedback> : orders.map((order) => (
        <article key={order.id} className="gp-card-light p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="neutral">#{order.id}</Badge>
              <h2 className="mt-2 text-xl font-gp-black">{formatCurrency(order.total_amount)}</h2>
              <p className="mt-1 text-gp-sm font-gp-bold text-slate-600">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
            </div>
            <Badge className="shrink-0" variant={order.status === 'canceled' ? 'danger' : 'success'}>{CUSTOMER_ORDER_STATUS_LABELS[order.status] || order.status}</Badge>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [cartLines, setCartLines] = useState([]);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [view, setView] = useState('menu');
  const [myOrders, setMyOrders] = useState([]);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');

  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const categoryProducts = useMemo(() => filterProductsByCategory(activeProducts, category), [activeProducts, category]);
  const visibleProducts = useMemo(() => categoryProducts.filter((product) => matchesProductSearch(product, searchTerm)), [categoryProducts, searchTerm]);
  const productMap = useMemo(() => buildProductMap(products), [products]);
  const cart = useMemo(() => buildLocalCart(cartLines, products), [cartLines, products]);

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
    gymPrimeApi.getCart().then((data) => setCartLines(cartItemsToLines(data.items))).catch(() => {});
    refreshMyOrders();
  }, []);

  async function refreshMyOrders() {
    try {
      setMyOrders(await gymPrimeApi.listMyOrders());
    } catch {
      setMyOrders([]);
    }
  }

  function handleAdd(productId, variantId) {
    if (!publicSettings.menu_is_open) {
      toast.error('Cardápio fechado no momento');
      return;
    }
    setCartLines((current) => {
      const normalizedVariantId = variantId || null;
      const existing = current.find((line) => line.product_id === productId && line.variant_id === normalizedVariantId);
      if (existing) {
        return current.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { product_id: productId, variant_id: normalizedVariantId, quantity: 1 }];
    });
    toast.success('Item adicionado');
  }

  async function syncCartBeforeCheckout() {
    const serverCart = await gymPrimeApi.getCart();
    const deltas = getCartSyncDeltas(serverCart.items, cart.items);

    if (deltas === null) {
      setCartLines(cartItemsToLines(serverCart.items));
      throw new Error('Encontramos um carrinho anterior no servidor. Revise os itens antes de finalizar.');
    }

    let syncedCart = serverCart;
    for (const delta of deltas) {
      syncedCart = await gymPrimeApi.addCartItem(delta);
    }
    return syncedCart;
  }

  async function handleCheckout() {
    if (!publicSettings.menu_is_open) {
      setShowCheckoutConfirm(false);
      toast.error('Cardápio fechado no momento');
      return;
    }
    if (cart.items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    try {
      await syncCartBeforeCheckout();
      const result = await gymPrimeApi.checkoutCart();
      setCartLines([]);
      setShowCheckoutConfirm(false);
      setSuccessResult(result);
      refreshMyOrders();
      toast.success(`Pedido #${result.order_id} criado`);
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  function incrementCartItem(item) {
    setCartLines((current) => current.map((line) => (
      line.product_id === item.product_id && line.variant_id === (item.variant_id || null)
        ? { ...line, quantity: line.quantity + 1 }
        : line
    )));
  }

  function decrementCartItem(item) {
    setCartLines((current) => current.flatMap((line) => {
      if (line.product_id !== item.product_id || line.variant_id !== (item.variant_id || null)) return [line];
      if (line.quantity <= 1) return [];
      return [{ ...line, quantity: line.quantity - 1 }];
    }));
  }

  function removeCartItem(item) {
    setCartLines((current) => current.filter((line) => line.product_id !== item.product_id || line.variant_id !== (item.variant_id || null)));
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
        <label className="mt-4 flex min-h-14 min-w-0 items-center gap-3 rounded-gp border border-gp-border-inverse bg-white/[0.08] px-4 text-gp-text-secondary shadow-gp-sm backdrop-blur">
          <Search className="shrink-0 text-gp-lime" size={22} />
          <input
            className="min-w-0 flex-1 bg-transparent text-gp-base font-gp-bold text-gp-text-primary outline-none placeholder:text-gp-text-secondary"
            placeholder="Buscar produtos"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
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
            <EmptyState icon={<ShoppingBag size={34} />} title="Nenhum produto encontrado">
              Tente outra busca ou escolha outra categoria.
            </EmptyState>
          ) : (
            visibleProducts.map((product) => (
              <CustomerProductCard key={product.id} product={product} onAdd={handleAdd} onDetails={setDetailsProduct} />
            ))
          )}
        </div>
      </section>

      <CustomerCartBar cart={cart} onOpen={() => setShowCheckoutConfirm(true)} />
      {showCheckoutConfirm && (
        <CustomerCartModal
          cart={cart}
          onCancel={() => setShowCheckoutConfirm(false)}
          onConfirm={handleCheckout}
          onIncrement={incrementCartItem}
          onDecrement={decrementCartItem}
          onRemove={removeCartItem}
          onClear={() => setCartLines([])}
        />
      )}
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
