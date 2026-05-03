import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, ChevronRight, Dumbbell, Flame, Grid2X2, Leaf, LogIn, Plus, Search, ShoppingBag, UserPlus, Zap } from 'lucide-react';
import { Badge, Button, Card, Feedback, TextInput } from '../../components/ui.jsx';
import { APP_ROUTES } from '../../app/routes.js';
import { toast } from '../../app/toast.js';
import { gymPrimeApi } from '../../services/gymPrimeApi.js';
import { filterProductsByCategory, formatCurrency, PRODUCT_CATEGORIES } from '../shared/catalog.js';
import { BrandMark, ErrorDialog, OrderSuccessModal, ProductDetailsModal, ProductImage, VariantPickerModal } from '../shared/SharedUi.jsx';

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
      <span className="mb-1 block text-xs font-black uppercase text-slate-500">{label}</span>
      <TextInput {...props} />
      {hint && <span className="mt-1 block text-xs font-bold text-slate-500">{hint}</span>}
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
      toast.success('Sessao iniciada');
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#101214] px-5 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="max-w-xl">
          <BrandMark tone="dark" />
          <h1 className="mt-8 max-w-md text-5xl font-black leading-tight">Peca rapido antes ou depois do treino</h1>
          <p className="mt-4 max-w-md text-base font-medium leading-7 text-slate-300">
            Entre para montar seu pedido pelo celular e enviar o resumo direto para a administracao.
          </p>
        </section>

        <Card as="form" onSubmit={handleSubmit} className="space-y-4 p-5 text-[#101214]">
          <div>
            <h2 className="text-2xl font-black">{isRegister ? 'Criar conta' : 'Entrar'}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isRegister ? 'Informe seus dados para pedir pelo celular.' : 'Use seu email e senha cadastrados.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
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
          <Button type="submit" className="w-full">
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
    <article className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 overflow-hidden rounded-lg border border-white/15 bg-white p-2 shadow-[0_16px_34px_rgba(0,0,0,0.34)]">
      <ProductImage product={product} className="aspect-square rounded-lg" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-1 text-xl font-black text-[#101214]">{product.name}</h2>
          <Badge className="bg-amber-50 text-amber-700"><Flame size={13} /> Popular</Badge>
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-base leading-5 text-slate-600">{product.description || 'Produto disponivel para pedido.'}</p>
        <Badge className="mt-3 bg-lime-100 text-lime-800"><CheckCircle2 size={13} /> Em estoque</Badge>
        <div className="mt-4">
          <strong className="text-xl font-black text-[#101214]">{formatCurrency(price)}</strong>
          <div className="mt-3 grid grid-cols-[1fr_44px] gap-2">
            <Button size="sm" variant="secondary" className="min-h-11 min-w-0 px-2" onClick={() => onDetails(product)}>
              Detalhes
              <ChevronRight size={16} />
            </Button>
            <Button size="icon" className="h-11 w-11 bg-[#B6FF3B] text-[#101214]" onClick={handleAdd} aria-label={`Adicionar ${product.name}`}>
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
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#101214] p-4 text-white shadow-2xl">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <ShoppingBag size={26} />
            {cart.items.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#B6FF3B] px-2 py-0.5 text-xs font-black text-[#101214]">{cart.items.length}</span>}
          </div>
          <div>
            <span className="block text-xs font-black uppercase text-slate-400">{cart.items.length} itens</span>
            <strong className="text-2xl font-black text-[#B6FF3B]">{formatCurrency(cart.total_amount)}</strong>
          </div>
        </div>
        <Button className="min-h-14 px-6 text-base" disabled={!hasItems} onClick={onCheckout}>
          Ver carrinho
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
}

function CheckoutConfirmModal({ cart, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101214]/70 p-4 sm:items-center">
      <section className="w-full max-w-md rounded-t-lg bg-white p-5 shadow-xl sm:rounded-lg">
        <Badge variant="success">Confirmacao</Badge>
        <h2 className="mt-3 text-xl font-black text-[#101214]">Finalizar pedido?</h2>
        <p className="mt-1 text-sm text-slate-600">Confira o total antes de gerar o pedido para a administracao.</p>
        <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-700">{item.quantity}x {item.name}</span>
              <strong className="text-[#101214]">{formatCurrency(item.total_price)}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#101214] p-4 text-white">
          <span className="text-sm font-bold text-slate-300">Total</span>
          <strong className="text-2xl font-black">{formatCurrency(cart.total_amount)}</strong>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button onClick={onConfirm}><Check size={18} /> Confirmar</Button>
        </div>
      </section>
    </div>
  );
}

function CustomerMenuPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');

  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const visibleProducts = useMemo(() => filterProductsByCategory(activeProducts, category), [activeProducts, category]);

  useEffect(() => {
    gymPrimeApi.listProducts()
      .then(setProducts)
      .catch((error) => {
        setProductsError(error.message);
        toast.error(error.message);
      })
      .finally(() => setProductsLoading(false));
    gymPrimeApi.getCart().then(setCart).catch(() => {});
  }, []);

  async function handleAdd(productId, variantId) {
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
    try {
      const result = await gymPrimeApi.checkoutCart();
      setCart({ items: [], total_amount: 0 });
      setShowCheckoutConfirm(false);
      setSuccessResult(result);
      toast.success(`Pedido #${result.order_id} criado`);
    } catch (error) {
      setErrorDialog(error.message);
      toast.error(error.message);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050606] pb-32 text-white">
      <header className="px-4 py-6">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <BrandMark tone="dark" />
          <div className="flex items-center gap-3 text-right">
            <button type="button" onClick={onLogout} className="text-xs font-black text-slate-400 underline-offset-4 hover:text-white hover:underline">
              Sair
            </button>
            <div className="rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
              Oi, <span className="text-[#B6FF3B]">{user.full_name?.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-5">
        <div className="flex min-h-16 items-center gap-4 rounded-lg border border-white/10 bg-white/12 px-5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Search size={27} />
          <span className="text-lg font-medium">Buscar no cardapio</span>
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {PRODUCT_CATEGORIES.slice(0, 5).map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={category === item.key ? 'primary' : 'secondary'}
              className={`min-h-14 shrink-0 rounded-lg px-5 text-base ${category === item.key ? 'border border-[#B6FF3B]' : 'border-white/10 bg-white/10 text-white hover:bg-white/15'}`}
              onClick={() => setCategory(item.key)}
            >
              {CATEGORY_ICONS[item.key]}
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-5">
          <h1 className="text-4xl font-black">Cardapio</h1>
          <p className="mt-2 text-lg font-medium text-slate-300">Peca rapido antes ou depois do treino.</p>
        </div>

        <div className="mt-6 space-y-3">
          {productsError ? (
            <Feedback variant="danger">{productsError}</Feedback>
          ) : productsLoading ? (
            <Feedback>Carregando produtos...</Feedback>
          ) : visibleProducts.length === 0 ? (
            <Feedback>Nenhum produto disponivel nesta categoria.</Feedback>
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
      toast.success('Sessao encerrada');
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#101214] text-white">Carregando</div>;
  }

  return user ? <CustomerMenuPage user={user} onLogout={handleLogout} /> : <LoginPage onLogin={setUser} />;
}

export function CustomerRedirect() {
  return <Link to={APP_ROUTES.customer}>Voltar ao cardapio</Link>;
}
