import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Dumbbell, Gift, Grid2X2, Info, Leaf, Plus, RotateCcw, Search, ShoppingBag, Trash2, Zap } from 'lucide-react';
import { Button, Badge, EmptyState, Feedback, ModalActions, TextInput } from '../../components/ui.jsx';
import { toast } from '../../app/toast.js';
import { gymPrimeApi } from '../../services/gymPrimeApi.js';
import { buildLocalCart, filterProductsByCategory, formatCurrency, getProductCategory, PRODUCT_CATEGORIES } from '../shared/catalog.js';
import { BrandMark, ErrorDialog, OrderSuccessModal, PriceSummary, ProductDetailsModal, ProductImage, ProductPromoBadge, ProductStockBadge, VariantPickerModal } from '../shared/SharedUi.jsx';

const CATEGORY_ICONS = {
  all: <Grid2X2 size={25} />,
  drinks: <ShoppingBag size={26} />,
  protein: <Dumbbell size={27} />,
  snacks: <Leaf size={26} />,
  preworkout: <Zap size={27} />,
  combos: <Gift size={26} />,
};

function matchesProductSearch(product, searchTerm) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;
  const categoryKey = getProductCategory(product);
  const categoryLabel = PRODUCT_CATEGORIES.find((item) => item.key === categoryKey)?.label || categoryKey;
  return [product.name, product.description, categoryKey, categoryLabel].some((value) => String(value || '').toLowerCase().includes(query));
}

function TotemProductCard({ product, onAdd, onDetails }) {
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
    <article className="gp-card-light gp-card-hover grid min-h-[312px] min-w-0 overflow-hidden">
      <ProductImage product={product} className="h-32 xl:h-36" />
      <div className="gp-product-card-content flex min-h-0 min-w-0 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="gp-product-card-title line-clamp-2 min-w-0 text-lg font-gp-black leading-tight">{product.name}</h3>
          <ProductPromoBadge className="max-w-[7rem] shrink-0 truncate px-2 text-[0.68rem]">{product.variants.length > 0 ? 'Variante' : 'Popular'}</ProductPromoBadge>
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-gp-sm font-gp-medium leading-5 text-slate-700">
          {product.description || 'Produto disponível no cardápio.'}
        </p>
        <ProductStockBadge className="mt-3 min-h-6 w-fit px-2 text-[0.68rem]" />
        <div className="mt-auto pt-4">
          <strong className="gp-product-card-price text-2xl font-gp-black leading-none">{formatCurrency(price)}</strong>
          <div className="gp-product-card-actions mt-3 grid grid-cols-2 gap-2 pt-3">
            <Button variant="secondary" className="min-h-11 min-w-0 px-3" onClick={() => onDetails(product)}>
              <span className="truncate">Detalhes</span>
              <Info size={17} />
            </Button>
            <Button className="gp-primary-cta min-h-11 min-w-0 px-3" onClick={handleAdd}>
              <Plus size={18} />
              <span className="truncate">Adicionar</span>
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
          large
        />
      )}
    </article>
  );
}

function TotemCart({ cart, onCheckout, onClear, onIncrement, onDecrement, onRemove, cartRef }) {
  const hasItems = cart.items.length > 0;

  return (
    <aside ref={cartRef} className="gp-surface-premium flex max-h-[calc(100vh-2rem)] min-w-0 flex-col overflow-hidden p-3 text-gp-text-primary min-[1200px]:min-h-0 min-[1200px]:max-h-none min-[1200px]:p-4 xl:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-gp-pill border border-gp-lime/25 bg-gp-lime/10 text-gp-lime shadow-gp-sm">
              <ShoppingBag size={26} />
            </span>
            <h2 className="truncate text-xl font-gp-black xl:text-2xl">Seu pedido</h2>
          </div>
          <p className="mt-1 text-gp-sm font-gp-bold text-gp-text-secondary">Revise antes de finalizar.</p>
        </div>
        <Badge className="shrink-0" variant={hasItems ? 'success' : 'neutral'}>{cart.items.length} itens</Badge>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {!hasItems && (
          <EmptyState className="border-gp-lime/20 bg-white/[0.045]" icon={<ShoppingBag size={34} />} title="Carrinho vazio">
            Toque em Adicionar para começar.
          </EmptyState>
        )}
        {cart.items.map((item) => (
          <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="min-w-0 rounded-gp border border-gp-border-inverse bg-white/[0.075] p-3 shadow-gp-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="line-clamp-2 break-words text-sm leading-5">{item.name}</strong>
                <span className="mt-1 block text-gp-xs font-gp-bold text-gp-text-secondary">
                  {formatCurrency(item.unit_price)}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-gp-text-primary hover:bg-white/10" onClick={() => onRemove(item)}>
                <Trash2 size={18} />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="inverse" className="h-9 min-h-0 w-9 p-0" onClick={() => onDecrement(item)}>-</Button>
                <strong className="w-7 text-center">{item.quantity}</strong>
                <Button className="h-9 min-h-0 w-9 p-0" onClick={() => onIncrement(item)}>+</Button>
              </div>
              <strong className="min-w-0 text-base">{formatCurrency(item.total_price)}</strong>
            </div>
          </div>
        ))}
      </div>

      <PriceSummary
        className="gp-totem-total mt-4"
        label="TOTAL"
        labelClassName="font-gp-black uppercase text-slate-700"
        value={cart.total_amount}
        valueClassName="text-3xl text-gp-text-inverse xl:text-4xl"
      />
      <Button className={`gp-primary-cta mt-4 min-h-12 w-full text-gp-base xl:min-h-14 ${hasItems ? 'shadow-gp-glow' : ''}`} disabled={!hasItems} onClick={onCheckout}>
        <Check size={20} />
        Finalizar pedido
      </Button>
      <Button className="mt-3 min-h-12 w-full" variant="inverse" disabled={!hasItems} onClick={onClear}>
        <RotateCcw size={18} />
        Limpar
      </Button>
      <div className="mt-4 rounded-gp border border-gp-border-inverse bg-white/[0.055] p-4 text-gp-sm font-gp-bold text-gp-text-secondary">
        Pagamento na finalização: cartão, Pix ou carteira digital.
      </div>
    </aside>
  );
}

function TotemNameModal({ cart, customerName, setCustomerName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gp-bg-panel/70 p-4 sm:p-6">
      <form onSubmit={onConfirm} className="gp-card-light max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain p-5 shadow-gp-modal sm:p-7">
        <Badge variant="success">Totem</Badge>
        <h2 className="mt-3 text-2xl font-gp-black text-gp-text-inverse sm:text-3xl">Para quem é o pedido?</h2>
        <p className="mt-2 text-gp-base font-gp-medium text-slate-700">Informe apenas o nome para a administração chamar no balcão.</p>
        <PriceSummary className="mt-5 p-5" label={`${cart.items.length} itens`} value={cart.total_amount} valueClassName="text-3xl" />
        <TextInput
          className="mt-5 min-h-14 text-gp-lg"
          placeholder="Nome do pedido"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          autoFocus
          required
          minLength={2}
        />
        <ModalActions className="mt-6 grid-cols-1 gap-4 sm:grid-cols-2">
          <Button className="min-h-14 text-gp-base" variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button className="gp-primary-cta min-h-14 text-gp-base" type="submit">Enviar pedido</Button>
        </ModalActions>
      </form>
    </div>
  );
}

export function TotemPage() {
  const [products, setProducts] = useState([]);
  const [publicSettings, setPublicSettings] = useState({ establishment_name: 'Gym Prime', menu_is_open: true, totem_message: 'Escolhas inteligentes para seu treino' });
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartLines, setCartLines] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');
  const cartPanelRef = useRef(null);

  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const categoryProducts = useMemo(() => filterProductsByCategory(activeProducts, category), [activeProducts, category]);
  const visibleProducts = useMemo(() => categoryProducts.filter((product) => matchesProductSearch(product, searchTerm)), [categoryProducts, searchTerm]);
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
  }, []);

  useEffect(() => {
    if (!successResult) return undefined;
    const timeoutId = window.setTimeout(() => setSuccessResult(null), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [successResult]);

  function handleAdd(productId, variantId) {
    if (!publicSettings.menu_is_open) {
      toast.error('Cardápio fechado no momento');
      return;
    }
    setCartLines((current) => {
      const existing = current.find((line) => line.product_id === productId && line.variant_id === variantId);
      if (existing) {
        return current.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { product_id: productId, variant_id: variantId, quantity: 1 }];
    });
    toast.success('Item adicionado');
  }

  async function handleConfirmCheckout(event) {
    event.preventDefault();
    if (!publicSettings.menu_is_open) {
      setShowNameModal(false);
      toast.error('Cardápio fechado no momento');
      return;
    }
    try {
      const result = await gymPrimeApi.checkoutTotem({ customer_name: customerName, items: cartLines });
      setCartLines([]);
      setCustomerName('');
      setShowNameModal(false);
      setSuccessResult(result);
      toast.success(`Pedido #${result.order_id} criado`);
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  function incrementCartItem(item) {
    setCartLines((current) => current.map((line) => (
      line.product_id === item.product_id && line.variant_id === item.variant_id
        ? { ...line, quantity: line.quantity + 1 }
        : line
    )));
  }

  function decrementCartItem(item) {
    setCartLines((current) => current.flatMap((line) => {
      if (line.product_id !== item.product_id || line.variant_id !== item.variant_id) return [line];
      if (line.quantity <= 1) return [];
      return [{ ...line, quantity: line.quantity - 1 }];
    }));
  }

  function removeCartItem(item) {
    setCartLines((current) => current.filter((line) => line.product_id !== item.product_id || line.variant_id !== item.variant_id));
  }

  return (
    <main className="gp-app-bg grid min-h-screen grid-cols-1 gap-3 overflow-x-hidden p-3 text-gp-text-primary min-[1200px]:h-screen min-[1200px]:min-h-0 min-[1200px]:grid-cols-[minmax(180px,200px)_minmax(0,1fr)_minmax(300px,320px)] min-[1200px]:gap-4 min-[1200px]:overflow-hidden min-[1200px]:p-4 2xl:grid-cols-[220px_minmax(0,1fr)_360px]">
      <nav className="gp-surface-premium flex min-w-0 flex-col gap-4 overflow-hidden p-3 text-gp-text-primary min-[1200px]:min-h-0 min-[1200px]:gap-0 min-[1200px]:p-4">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gp-border-inverse pb-3 min-[1200px]:block min-[1200px]:pb-5">
          <BrandMark label="Gym Prime" tone="dark" />
          <strong className="shrink-0 text-base font-black italic text-gp-lime min-[1200px]:mt-3 min-[1200px]:block min-[1200px]:text-xl">TOTEM</strong>
        </div>
        <div className="gp-scrollbar-soft -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 min-[1200px]:mx-0 min-[1200px]:mt-5 min-[1200px]:min-h-0 min-[1200px]:flex-1 min-[1200px]:flex-col min-[1200px]:space-y-2 min-[1200px]:overflow-x-hidden min-[1200px]:overflow-y-auto min-[1200px]:px-0 min-[1200px]:pb-0 min-[1200px]:pr-1">
          {PRODUCT_CATEGORIES.map((item) => (
            <Button
              key={item.key}
              className={`min-h-12 shrink-0 justify-start px-4 text-sm min-[1200px]:min-h-14 min-[1200px]:w-full min-[1200px]:text-base xl:min-h-16 xl:text-lg ${category === item.key ? '' : 'bg-white/[0.065]'}`}
              variant={category === item.key ? 'primary' : 'inverse'}
              onClick={() => setCategory(item.key)}
            >
              {CATEGORY_ICONS[item.key]}
              <span className="truncate">{item.label}</span>
            </Button>
          ))}
        </div>
        <div className="gp-promo-card flex shrink-0 items-center gap-3 p-3 min-[1200px]:mt-4 min-[1200px]:block min-[1200px]:p-4 xl:p-5">
          <Zap className="text-gp-lime" size={40} />
          <div className="min-w-0">
            <strong className="block text-base font-gp-black italic leading-tight min-[1200px]:mt-3 min-[1200px]:text-xl">ENERGIA<br />FOCO<br />RESULTADO</strong>
            <span className="mt-1 line-clamp-2 text-gp-xs font-gp-black uppercase text-gp-lime min-[1200px]:mt-5">{publicSettings.totem_message}</span>
          </div>
        </div>
      </nav>

      {cart.items.length > 0 && (
        <section className="gp-surface-premium flex min-w-0 items-center justify-between gap-3 p-3 min-[1200px]:hidden">
          <div className="min-w-0">
            <span className="block text-gp-xs font-gp-black uppercase text-gp-text-muted">{cart.items.length} itens</span>
            <strong className="block truncate text-2xl font-gp-black text-gp-lime">{formatCurrency(cart.total_amount)}</strong>
          </div>
          <Button className="gp-primary-cta min-h-12 shrink-0 px-4" onClick={() => cartPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            Ver pedido
          </Button>
        </section>
      )}

      <section className="gp-surface-premium flex min-w-0 flex-col overflow-visible p-3 min-[1200px]:min-h-0 min-[1200px]:overflow-hidden min-[1200px]:p-4">
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-gp-black tracking-normal xl:text-4xl">Cardápio</h1>
            <p className="mt-1 text-gp-base font-gp-medium text-gp-text-secondary">Toque para adicionar ao pedido.</p>
          </div>
          <label className="flex min-h-12 min-w-0 max-w-xs flex-1 items-center gap-3 rounded-gp border border-gp-border-inverse bg-white/[0.08] px-4 text-gp-text-secondary shadow-gp-sm backdrop-blur xl:w-80 xl:flex-none">
            <Search className="shrink-0 text-gp-lime" size={20} />
            <input
              className="min-w-0 flex-1 bg-transparent font-gp-bold text-gp-text-primary outline-none placeholder:text-gp-text-secondary"
              placeholder="Buscar produtos"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <Badge className="shrink-0" variant="operational">Atendimento público</Badge>
        </header>

        {!publicSettings.menu_is_open ? (
          <Feedback variant="danger">Cardápio fechado no momento. Aguarde a reabertura.</Feedback>
        ) : productsError ? (
          <Feedback variant="danger">{productsError}</Feedback>
        ) : productsLoading ? (
          <Feedback>Carregando produtos...</Feedback>
        ) : visibleProducts.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={34} />} title="Nenhum produto encontrado">
            Ajuste a busca ou escolha outra categoria.
          </EmptyState>
        ) : (
          <div className="gp-scrollbar-soft grid grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] gap-3 min-[1200px]:min-h-0 min-[1200px]:grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))] min-[1200px]:overflow-y-auto min-[1200px]:pr-1">
            {visibleProducts.map((product) => (
              <TotemProductCard key={product.id} product={product} onAdd={handleAdd} onDetails={setDetailsProduct} />
            ))}
          </div>
        )}
      </section>

      <TotemCart
        cart={cart}
        onCheckout={() => setShowNameModal(true)}
        onClear={() => setCartLines([])}
        onIncrement={incrementCartItem}
        onDecrement={decrementCartItem}
        onRemove={removeCartItem}
        cartRef={cartPanelRef}
      />

      {showNameModal && (
        <TotemNameModal
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          onCancel={() => setShowNameModal(false)}
          onConfirm={handleConfirmCheckout}
        />
      )}
      {detailsProduct && <ProductDetailsModal product={detailsProduct} onClose={() => setDetailsProduct(null)} />}
      {successResult && <OrderSuccessModal result={successResult} onClose={() => setSuccessResult(null)} totem />}
      {errorDialog && <ErrorDialog message={errorDialog} onClose={() => setErrorDialog('')} />}
    </main>
  );
}
