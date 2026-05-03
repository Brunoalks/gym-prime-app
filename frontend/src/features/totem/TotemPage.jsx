import { useEffect, useMemo, useState } from 'react';
import { Check, Dumbbell, Gift, Grid2X2, Info, Leaf, Plus, RotateCcw, Search, ShoppingBag, Trash2, Zap } from 'lucide-react';
import { Button, Badge, Feedback, TextInput } from '../../components/ui.jsx';
import { toast } from '../../app/toast.js';
import { gymPrimeApi } from '../../services/gymPrimeApi.js';
import { buildLocalCart, filterProductsByCategory, formatCurrency, PRODUCT_CATEGORIES } from '../shared/catalog.js';
import { BrandMark, ErrorDialog, OrderSuccessModal, ProductDetailsModal, ProductImage, VariantPickerModal } from '../shared/SharedUi.jsx';

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
    <article className="grid min-h-[300px] overflow-hidden rounded-lg border border-white/10 bg-white text-[#101214] shadow-[0_14px_38px_rgba(0,0,0,0.22)]">
      <ProductImage product={product} className="h-36" />
      <div className="flex min-h-0 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-black leading-tight text-[#101214]">{product.name}</h3>
          <Badge className="bg-amber-100 text-amber-700">{product.variants.length > 0 ? 'Variante' : 'Popular'}</Badge>
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-600">
          {product.description || 'Produto disponivel no cardapio.'}
        </p>
        <Badge className="mt-3 w-fit bg-lime-100 text-lime-800">Em estoque</Badge>
        <div className="mt-auto pt-4">
          <strong className="text-2xl font-black text-[#101214]">{formatCurrency(price)}</strong>
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
    <aside className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-[#101214] p-5 text-white shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-[#B6FF3B]" size={32} />
            <h2 className="text-2xl font-black">Seu pedido</h2>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-300">Revise antes de finalizar.</p>
        </div>
        <Badge variant={hasItems ? 'success' : 'neutral'}>{cart.items.length} itens</Badge>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {!hasItems && (
          <div className="rounded-lg border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center">
            <ShoppingBag className="mx-auto text-slate-400" size={34} />
            <strong className="mt-3 block text-base">Carrinho vazio</strong>
            <span className="mt-1 block text-sm font-bold text-slate-400">Toque em Adicionar para comecar.</span>
          </div>
        )}
        {cart.items.map((item) => (
          <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="rounded-lg bg-white/8 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm leading-5">{item.name}</strong>
                <span className="mt-1 block text-xs font-bold text-slate-300">
                  {formatCurrency(item.unit_price)}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10" onClick={() => onRemove(item)}>
                <Trash2 size={18} />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="h-9 min-h-0 w-9 border-white/15 bg-white/10 p-0 text-white hover:bg-white/15" onClick={() => onDecrement(item)}>-</Button>
                <strong className="w-7 text-center">{item.quantity}</strong>
                <Button className="h-9 min-h-0 w-9 p-0" onClick={() => onIncrement(item)}>+</Button>
              </div>
              <strong className="text-base">{formatCurrency(item.total_price)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-white p-4 text-[#101214]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black uppercase text-slate-500">Total</span>
          <strong className="text-3xl font-black">{formatCurrency(cart.total_amount)}</strong>
        </div>
      </div>
      <Button className="mt-4 min-h-14 w-full text-base" disabled={!hasItems} onClick={onCheckout}>
        <Check size={20} />
        Finalizar pedido
      </Button>
      <Button className="mt-3 min-h-12 w-full border-white/15 bg-white/10 text-white hover:bg-white/15" variant="secondary" disabled={!hasItems} onClick={onClear}>
        <RotateCcw size={18} />
        Limpar
      </Button>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-300">
        Pagamento na finalizacao: cartao, Pix ou carteira digital.
      </div>
    </aside>
  );
}

function TotemNameModal({ cart, customerName, setCustomerName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101214]/70 p-6">
      <form onSubmit={onConfirm} className="w-full max-w-2xl rounded-lg bg-white p-7 shadow-2xl">
        <Badge variant="success">Totem</Badge>
        <h2 className="mt-3 text-3xl font-black text-[#101214]">Para quem e o pedido?</h2>
        <p className="mt-2 text-base font-medium text-slate-600">Informe apenas o nome para a administracao chamar no balcao.</p>
        <div className="mt-5 rounded-lg bg-[#101214] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-300">{cart.items.length} itens</span>
            <strong className="text-3xl font-black">{formatCurrency(cart.total_amount)}</strong>
          </div>
        </div>
        <TextInput
          className="mt-5 min-h-14 text-lg"
          placeholder="Nome do pedido"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          autoFocus
          required
          minLength={2}
        />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Button className="min-h-14 text-base" variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button className="min-h-14 text-base" type="submit">Enviar pedido</Button>
        </div>
      </form>
    </div>
  );
}

export function TotemPage() {
  const [products, setProducts] = useState([]);
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
    gymPrimeApi.listProducts()
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
        return current.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { product_id: productId, variant_id: variantId, quantity: 1 }];
    });
    toast.success('Item adicionado');
  }

  async function handleConfirmCheckout(event) {
    event.preventDefault();
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
    <main className="grid min-h-screen grid-cols-[220px_1fr_360px] gap-4 bg-[#050606] p-4 text-white">
      <nav className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-[#101214] p-4 text-white">
        <div className="border-b border-white/10 pb-5">
          <BrandMark label="Gym Prime" tone="dark" />
          <strong className="mt-3 block text-xl font-black italic">TOTEM</strong>
        </div>
        <div className="mt-5 space-y-2">
          {PRODUCT_CATEGORIES.map((item) => (
            <Button
              key={item.key}
              className={`min-h-16 w-full justify-start text-lg ${category === item.key ? '' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}
              variant={category === item.key ? 'primary' : 'secondary'}
              onClick={() => setCategory(item.key)}
            >
              {CATEGORY_ICONS[item.key]}
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-auto rounded-lg border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(182,255,59,0.24),transparent_35%),rgba(255,255,255,0.05)] p-5">
          <Zap className="text-[#B6FF3B]" size={40} />
          <strong className="mt-3 block text-xl font-black italic leading-tight">ENERGIA<br />FOCO<br />RESULTADO</strong>
          <span className="mt-5 block text-xs font-black uppercase text-[#B6FF3B]">Escolhas inteligentes para seu treino</span>
        </div>
      </nav>

      <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-normal">Cardapio</h1>
            <p className="mt-1 text-base font-medium text-slate-300">Toque para adicionar ao pedido.</p>
          </div>
          <div className="flex min-h-12 w-80 items-center gap-3 rounded-lg border border-white/10 bg-white/8 px-4 text-slate-300">
            <Search size={20} />
            <span className="font-bold">Escolha seus itens</span>
          </div>
          <Badge className="bg-[#B6FF3B] text-[#101214]">Atendimento publico</Badge>
        </header>

        {productsError ? (
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
