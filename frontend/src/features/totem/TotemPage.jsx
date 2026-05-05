import { useEffect, useMemo, useState } from 'react';
import { Check, Dumbbell, Gift, Grid2X2, Info, Leaf, Plus, RotateCcw, Search, ShoppingBag, Trash2, Zap } from 'lucide-react';
import { Button, Badge, EmptyState, Feedback, ModalActions, TextInput } from '../../components/ui.jsx';
import { toast } from '../../app/toast.js';
import { gymPrimeApi } from '../../services/gymPrimeApi.js';
import { buildLocalCart, filterProductsByCategory, formatCurrency, PRODUCT_CATEGORIES } from '../shared/catalog.js';
import { BrandMark, ErrorDialog, OrderSuccessModal, PriceSummary, ProductDetailsModal, ProductImage, ProductPromoBadge, ProductStockBadge, VariantPickerModal } from '../shared/SharedUi.jsx';

const CATEGORY_ICONS = {
  all: <Grid2X2 size={25} />,
  drinks: <ShoppingBag size={26} />,
  protein: <Dumbbell size={27} />,
  snacks: <Leaf size={26} />,
  preworkout: <Zap size={27} />,
  combos: <Gift size={26} />,
};

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
    <article className="gp-card-light grid min-h-[300px] overflow-hidden">
      <ProductImage product={product} className="h-36" />
      <div className="flex min-h-0 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-gp-black leading-tight text-gp-text-inverse">{product.name}</h3>
          <ProductPromoBadge>{product.variants.length > 0 ? 'Variante' : 'Popular'}</ProductPromoBadge>
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-gp-sm font-gp-medium leading-5 text-slate-600">
          {product.description || 'Produto disponivel no cardapio.'}
        </p>
        <ProductStockBadge className="mt-3 w-fit" />
        <div className="mt-auto pt-4">
          <strong className="text-2xl font-gp-black text-gp-text-inverse">{formatCurrency(price)}</strong>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" className="min-h-11 px-3" onClick={() => onDetails(product)}>
              Detalhes
              <Info size={17} />
            </Button>
            <Button className="min-h-11 px-3" onClick={handleAdd}>
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
          large
        />
      )}
    </article>
  );
}

function TotemCart({ cart, onCheckout, onClear, onIncrement, onDecrement, onRemove }) {
  const hasItems = cart.items.length > 0;

  return (
    <aside className="gp-panel flex min-h-0 flex-col p-5 text-gp-text-primary">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-gp-lime" size={32} />
            <h2 className="text-2xl font-gp-black">Seu pedido</h2>
          </div>
          <p className="mt-1 text-gp-sm font-gp-bold text-gp-text-secondary">Revise antes de finalizar.</p>
        </div>
        <Badge variant={hasItems ? 'success' : 'neutral'}>{cart.items.length} itens</Badge>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {!hasItems && (
          <EmptyState icon={<ShoppingBag size={34} />} title="Carrinho vazio">
            Toque em Adicionar para comecar.
          </EmptyState>
        )}
        {cart.items.map((item) => (
          <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="rounded-gp bg-white/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm leading-5">{item.name}</strong>
                <span className="mt-1 block text-gp-xs font-gp-bold text-gp-text-secondary">
                  {formatCurrency(item.unit_price)}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gp-text-primary hover:bg-white/10" onClick={() => onRemove(item)}>
                <Trash2 size={18} />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="inverse" className="h-9 min-h-0 w-9 p-0" onClick={() => onDecrement(item)}>-</Button>
                <strong className="w-7 text-center">{item.quantity}</strong>
                <Button className="h-9 min-h-0 w-9 p-0" onClick={() => onIncrement(item)}>+</Button>
              </div>
              <strong className="text-base">{formatCurrency(item.total_price)}</strong>
            </div>
          </div>
        ))}
      </div>

      <PriceSummary
        className="mt-4 bg-white text-gp-text-inverse"
        labelClassName="font-gp-black uppercase text-slate-500"
        value={cart.total_amount}
        valueClassName="text-3xl"
      />
      <Button className="mt-4 min-h-14 w-full text-gp-base" disabled={!hasItems} onClick={onCheckout}>
        <Check size={20} />
        Finalizar pedido
      </Button>
      <Button className="mt-3 min-h-12 w-full" variant="inverse" disabled={!hasItems} onClick={onClear}>
        <RotateCcw size={18} />
        Limpar
      </Button>
      <div className="mt-4 rounded-gp border border-gp-border-inverse bg-white/5 p-4 text-gp-sm font-gp-bold text-gp-text-secondary">
        Pagamento na finalizacao: cartao, Pix ou carteira digital.
      </div>
    </aside>
  );
}

function TotemNameModal({ cart, customerName, setCustomerName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gp-bg-panel/70 p-6">
      <form onSubmit={onConfirm} className="gp-card-light w-full max-w-2xl p-7 shadow-gp-modal">
        <Badge variant="success">Totem</Badge>
        <h2 className="mt-3 text-3xl font-gp-black text-gp-text-inverse">Para quem e o pedido?</h2>
        <p className="mt-2 text-gp-base font-gp-medium text-slate-600">Informe apenas o nome para a administracao chamar no balcao.</p>
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
        <ModalActions className="mt-6 gap-4">
          <Button className="min-h-14 text-gp-base" variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button className="min-h-14 text-gp-base" type="submit">Enviar pedido</Button>
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
  const [cartLines, setCartLines] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');

  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const visibleProducts = useMemo(() => filterProductsByCategory(activeProducts, category), [activeProducts, category]);
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
      toast.error('Cardapio fechado no momento');
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
      toast.error('Cardapio fechado no momento');
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
    <main className="grid min-h-screen grid-cols-[220px_1fr_360px] gap-4 bg-gp-bg-main p-4 text-gp-text-primary">
      <nav className="gp-panel flex min-h-0 flex-col p-4 text-gp-text-primary">
        <div className="border-b border-gp-border-inverse pb-5">
          <BrandMark label="Gym Prime" tone="dark" />
          <strong className="mt-3 block text-xl font-black italic">TOTEM</strong>
        </div>
        <div className="mt-5 space-y-2">
          {PRODUCT_CATEGORIES.map((item) => (
            <Button
              key={item.key}
              className="min-h-16 w-full justify-start text-lg"
              variant={category === item.key ? 'primary' : 'inverse'}
              onClick={() => setCategory(item.key)}
            >
              {CATEGORY_ICONS[item.key]}
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-auto rounded-gp border border-gp-border-inverse bg-[radial-gradient(circle_at_20%_20%,rgb(var(--gp-lime-rgb)/0.24),transparent_35%),rgba(255,255,255,0.05)] p-5">
          <Zap className="text-gp-lime" size={40} />
          <strong className="mt-3 block text-xl font-gp-black italic leading-tight">ENERGIA<br />FOCO<br />RESULTADO</strong>
          <span className="mt-5 block text-gp-xs font-gp-black uppercase text-gp-lime">{publicSettings.totem_message}</span>
        </div>
      </nav>

      <section className="min-w-0 rounded-gp border border-gp-border-inverse bg-white/[0.03] p-4">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-gp-black tracking-normal">Cardapio</h1>
            <p className="mt-1 text-gp-base font-gp-medium text-gp-text-secondary">Toque para adicionar ao pedido.</p>
          </div>
          <div className="flex min-h-12 w-80 items-center gap-3 rounded-gp border border-gp-border-inverse bg-white/10 px-4 text-gp-text-secondary">
            <Search size={20} />
            <span className="font-gp-bold">Escolha seus itens</span>
          </div>
          <Badge className="bg-gp-lime text-gp-text-inverse">Atendimento publico</Badge>
        </header>

        {!publicSettings.menu_is_open ? (
          <Feedback variant="danger">Cardapio fechado no momento. Aguarde a reabertura.</Feedback>
        ) : productsError ? (
          <Feedback variant="danger">{productsError}</Feedback>
        ) : productsLoading ? (
          <Feedback>Carregando produtos...</Feedback>
        ) : visibleProducts.length === 0 ? (
          <Feedback>Nenhum produto disponivel nesta categoria.</Feedback>
        ) : (
          <div className="grid grid-cols-3 gap-3">
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
