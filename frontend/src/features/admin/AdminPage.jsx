import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Clock, Copy, DollarSign, Eye, LayoutDashboard, Package, Plus, Settings, Shield, ShoppingBag, Trash2, TrendingUp, Users } from 'lucide-react';
import { Badge, Button, Card, Feedback, TextInput } from '../../components/ui.jsx';
import { APP_ROUTES } from '../../app/routes.js';
import { toast } from '../../app/toast.js';
import { ApiError } from '../../services/api.js';
import { gymPrimeApi } from '../../services/gymPrimeApi.js';
import { buildProductMap, formatCurrency } from '../shared/catalog.js';
import { BrandMark, ConfirmDialog, ErrorDialog } from '../shared/SharedUi.jsx';

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
  { key: 'orders', label: 'Pedidos', icon: <ShoppingBag size={17} /> },
  { key: 'products', label: 'Produtos', icon: <Package size={17} /> },
  { key: 'inventory', label: 'Estoque', icon: <Package size={17} /> },
  { key: 'customers', label: 'Clientes', icon: <Users size={17} /> },
  { key: 'audit', label: 'Auditoria', icon: <AlertTriangle size={17} /> },
  { key: 'settings', label: 'Configuracoes', icon: <Settings size={17} /> },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Pronto' },
  { value: 'completed', label: 'Concluido' },
  { value: 'canceled', label: 'Cancelado' },
];

const ORDER_STATUS_LABELS = Object.fromEntries(ORDER_STATUS_OPTIONS.map((statusOption) => [statusOption.value, statusOption.label]));

function getOrderOrigin(order) {
  return order.user_id ? 'Cliente' : 'Totem';
}

function buildOrderSummary(order, productMap) {
  const items = order.items.map((item) => {
    const productName = productMap.get(item.product_id)?.name || `Produto #${item.product_id}`;
    return `${item.quantity}x ${productName} (${formatCurrency(item.total_price)})`;
  }).join('\n');
  return [
    `Pedido #${order.id}`,
    `Cliente: ${order.customer_name || `Usuario ${order.user_id}`}`,
    `Origem: ${getOrderOrigin(order)}`,
    `Status: ${ORDER_STATUS_LABELS[order.status] || order.status}`,
    `Total: ${formatCurrency(order.total_amount)}`,
    '',
    items,
  ].join('\n');
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const user = await gymPrimeApi.login({ email: form.email, password: form.password });
      if (!user.is_admin) {
        toast.error('Permissao de admin necessaria');
        return;
      }
      onLogin(user);
      toast.success('Admin autenticado');
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050606] p-5 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-white/10 bg-[#101214] p-6 text-white shadow-2xl">
        <BrandMark label="Gym Prime" tone="dark" />
        <div>
          <h1 className="text-2xl font-black">Entrar no admin</h1>
          <p className="mt-1 text-sm font-medium text-slate-400">Acesso restrito a administradores.</p>
        </div>
        <TextInput type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <TextInput type="password" placeholder="Senha" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        <Button type="submit" className="w-full">Entrar</Button>
      </form>
    </main>
  );
}

function AccessDenied({ status, onTryLogin }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050606] p-5">
      <section className="max-w-md rounded-lg border border-white/10 bg-[#101214] p-6 text-center text-white shadow-2xl">
        <Badge variant="danger">{status === 403 ? '403' : '401'}</Badge>
        <h1 className="mt-3 text-2xl font-black">Acesso negado</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {status === 403 ? 'Sua conta nao tem permissao administrativa.' : 'Entre com uma conta administrativa para continuar.'}
        </p>
        <Button className="mt-5 w-full" onClick={onTryLogin}>
          Entrar com conta admin
        </Button>
      </section>
    </main>
  );
}

function Dashboard({ orders, inventory, productMap, analytics, setTab }) {
  const revenue = orders.reduce((total, order) => total + Number(order.total_amount), 0);
  const lowInventory = inventory.filter((item) => item.quantity <= item.min_quantity);
  const recentOrders = analytics?.recent_orders || orders.slice(0, 5);
  const topProducts = useMemo(() => {
    if (analytics?.top_products) return analytics.top_products;
    const totals = new Map();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = totals.get(item.product_id) || { quantity: 0, revenue: 0 };
        totals.set(item.product_id, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + Number(item.total_price),
        });
      });
    });
    return [...totals.entries()]
      .map(([productId, data]) => ({ productId, ...data, product: productMap.get(productId) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);
  }, [analytics, orders, productMap]);
  const kpis = analytics?.kpis;
  const analyticsLowInventory = analytics?.low_inventory;
  const lowInventoryItems = analyticsLowInventory || lowInventory.slice(0, 4).map((item) => {
    const product = productMap.get(item.product_id);
    return {
      inventory_id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: product?.name || `Produto #${item.product_id}`,
      variant_name: null,
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      severity: item.quantity === 0 ? 'critical' : 'low',
    };
  });

  return (
    <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <KpiCard title="Vendas hoje" value={formatCurrency(kpis?.sales_today ?? revenue)} badge="18,8%" icon={<DollarSign size={24} />} />
        <KpiCard title="Pedidos" value={kpis?.orders_today ?? orders.length} badge="11,8%" icon={<ShoppingBag size={24} />} />
        <KpiCard title="Ticket medio" value={formatCurrency(kpis?.average_ticket ?? (orders.length ? revenue / orders.length : 0))} badge="6,3%" icon={<TrendingUp size={24} />} />
        <KpiCard title="Estoque em alerta" value={lowInventoryItems.length} badge={lowInventoryItems.length ? 'Atencao' : 'Ok'} danger={lowInventoryItems.length > 0} icon={<AlertTriangle size={24} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h2 className="text-lg font-black">Pedidos recentes</h2>
            <Button size="sm" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setTab('orders')}>Ver todos</Button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-4"><Feedback>Nenhum pedido registrado ainda.</Feedback></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs font-black uppercase text-slate-400">
                  <tr><th className="px-4 py-3">Pedido</th><th>Origem/Cliente</th><th>Itens</th><th>Status</th><th className="text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-4 font-black">#{order.id}</td>
                      <td className="text-slate-200">
                        {order.customer_label || order.customer_name || `Usuario ${order.user_id}`}
                        <Badge className="ml-2 bg-blue-500/15 text-blue-300">{order.origin || (order.user_id ? 'Cliente' : 'Totem')}</Badge>
                      </td>
                      <td className="text-slate-300">{order.items_count ?? order.items?.length ?? 0} itens</td>
                      <td><Badge variant="success">{order.status}</Badge></td>
                      <td className="pr-4 text-right font-black">{formatCurrency(order.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Estoque baixo</h2>
              <Badge variant={lowInventoryItems.length > 0 ? 'danger' : 'success'}>{lowInventoryItems.length || 'Ok'}</Badge>
            </div>
            {lowInventoryItems.length === 0 ? <Feedback variant="success">Nenhum item abaixo do minimo.</Feedback> : (
              <div className="space-y-2">
                {lowInventoryItems.slice(0, 4).map((item) => {
                  return (
                    <div key={item.inventory_id} className="rounded-lg bg-red-50 p-3 text-sm">
                      <strong className="text-red-700">{item.product_name}{item.variant_name ? ` - ${item.variant_name}` : ''}</strong>
                      <span className="mt-1 block font-bold text-red-600">{item.quantity} em estoque, minimo {item.min_quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="mb-4 text-lg font-black">Produtos mais vendidos</h2>
            {topProducts.length === 0 ? <Feedback>Nenhum ranking disponivel.</Feedback> : (
              <div className="space-y-3">
                {topProducts.map((item, index) => (
                  <div key={item.productId || item.product_id}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="font-black text-slate-400">{index + 1}</span>
                        {(item.product?.image_url || item.image_url) && <img src={item.product?.image_url || item.image_url} alt="" className="h-9 w-9 rounded-md object-cover" />}
                        <strong className="truncate">{item.product_name || item.product?.name || `Produto #${item.productId || item.product_id}`}</strong>
                      </div>
                      <span className="font-bold text-slate-400">{item.quantity} un. | {formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-[#B6FF3B]" style={{ width: `${Math.min(100, item.quantity * 12)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <SalesChart hourlySales={analytics?.hourly_sales || []} />
    </section>
  );
}

function SalesChart({ hourlySales }) {
  const points = hourlySales.length > 0
    ? hourlySales
    : Array.from({ length: 24 }, (_, hour) => ({ hour, total_amount: 0, orders_count: 0 }));
  const maxValue = Math.max(...points.map((point) => Number(point.total_amount)), 1);
  const chartPoints = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * 100;
    const y = 100 - (Number(point.total_amount) / maxValue) * 82 - 8;
    return `${x},${y}`;
  }).join(' ');

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Evolucao das vendas hoje</h2>
          <p className="mt-1 text-sm text-slate-400">Serie por hora calculada pelo backend.</p>
        </div>
        <Badge variant="neutral">Por hora</Badge>
      </div>
      <div className="h-48 rounded-lg bg-black/20 p-3">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label="Grafico de vendas por hora">
          <defs>
            <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#B6FF3B" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#B6FF3B" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polyline points={`0,100 ${chartPoints} 100,100`} fill="url(#salesArea)" stroke="none" />
          <polyline points={chartPoints} fill="none" stroke="#B6FF3B" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </section>
  );
}

function KpiCard({ title, value, badge, danger = false, icon }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${danger ? 'border-amber-500/40 text-amber-400' : 'border-[#B6FF3B]/40 text-[#B6FF3B]'}`}>
          {icon}
        </div>
        <Badge variant={danger ? 'danger' : 'success'}>{badge}</Badge>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-300">{title}</p>
      <strong className="mt-2 block text-3xl font-black text-white">{value}</strong>
    </section>
  );
}

function OrdersPanel({ orders, productMap, onUpdateStatus }) {
  const [filters, setFilters] = useState({ date: '', origin: 'all', status: 'all' });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const orderDate = order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : '';
    const matchesDate = !filters.date || orderDate === filters.date;
    const matchesOrigin = filters.origin === 'all' || getOrderOrigin(order) === filters.origin;
    const matchesStatus = filters.status === 'all' || order.status === filters.status;
    return matchesDate && matchesOrigin && matchesStatus;
  }), [filters, orders]);
  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) || null, [orders, selectedOrderId]);

  async function copySummary(order) {
    const summary = buildOrderSummary(order, productMap);
    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Resumo copiado');
    } catch {
      toast.error('Nao foi possivel copiar o resumo');
    }
  }

  return (
    <>
      <DataCard title="Pedidos" subtitle="Pedidos salvos pelo cliente mobile e pelo totem." count={`${filteredOrders.length}/${orders.length} pedidos`}>
        <div className="mb-4 grid gap-3 md:grid-cols-[180px_180px_220px_1fr]">
          <TextInput type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
          <select className="min-h-11 rounded-md border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none" value={filters.origin} onChange={(event) => setFilters({ ...filters, origin: event.target.value })}>
            <option value="all">Todas as origens</option>
            <option value="Cliente">Cliente</option>
            <option value="Totem">Totem</option>
          </select>
          <select className="min-h-11 rounded-md border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">Todos os status</option>
            {ORDER_STATUS_OPTIONS.map((statusOption) => <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>)}
          </select>
          <Button variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10 md:justify-self-end" onClick={() => setFilters({ date: '', origin: 'all', status: 'all' })}>
            Limpar filtros
          </Button>
        </div>

        {filteredOrders.length === 0 ? <Feedback>Nenhum pedido encontrado para os filtros.</Feedback> : (
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs font-black uppercase text-slate-400">
              <tr><th className="px-4 py-3">Pedido</th><th>Cliente</th><th>Origem</th><th>Itens</th><th>Status</th><th>Criado em</th><th className="text-right">Total</th><th className="text-right">Acoes</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="px-4 py-4 font-black">#{order.id}</td>
                  <td className="text-slate-200">{order.customer_name || `Usuario ${order.user_id}`}</td>
                  <td><Badge className="bg-blue-500/15 text-blue-300">{getOrderOrigin(order)}</Badge></td>
                  <td className="py-4">
                    <div className="flex max-w-sm flex-wrap gap-1">
                      {order.items.map((item) => (
                        <span key={item.id} className="inline-flex rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-slate-200">
                          {item.quantity}x {productMap.get(item.product_id)?.name || `produto #${item.product_id}`}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <select className="min-h-10 rounded-md border border-white/10 bg-black/20 px-2 text-xs font-black text-white outline-none" value={order.status} onChange={(event) => onUpdateStatus(order.id, event.target.value)}>
                      {ORDER_STATUS_OPTIONS.map((statusOption) => <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>)}
                    </select>
                  </td>
                  <td className="text-slate-400">{new Date(order.created_at).toLocaleString('pt-BR')}</td>
                  <td className="pr-4 text-right font-black">{formatCurrency(order.total_amount)}</td>
                  <td className="pr-4 text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setSelectedOrderId(order.id)}><Eye size={14} /> Detalhe</Button>
                      <Button size="sm" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => copySummary(order)}><Copy size={14} /> Copiar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataCard>

      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          productMap={productMap}
          onClose={() => setSelectedOrderId(null)}
          onCopy={() => copySummary(selectedOrder)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </>
  );
}

function OrderDetailDialog({ order, productMap, onClose, onCopy, onUpdateStatus }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 p-4">
      <section className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-white/10 bg-[#101214] p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="bg-blue-500/15 text-blue-300">{getOrderOrigin(order)}</Badge>
            <h2 className="mt-3 text-2xl font-black">Pedido #{order.id}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-400"><Clock size={15} /> {new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
          <Button variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoBlock label="Cliente" value={order.customer_name || `Usuario ${order.user_id}`} />
          <InfoBlock label="Total" value={formatCurrency(order.total_amount)} />
          <InfoBlock label="Pagamento" value={order.payment_method || 'Nao informado'} />
          <label className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <span className="text-xs font-black uppercase text-slate-500">Status</span>
            <select className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm font-black text-white outline-none" value={order.status} onChange={(event) => onUpdateStatus(order.id, event.target.value)}>
              {ORDER_STATUS_OPTIONS.map((statusOption) => <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-lg border border-white/10">
          <div className="border-b border-white/10 p-3 text-sm font-black text-slate-300">Itens</div>
          <div className="divide-y divide-white/10">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-3 text-sm">
                <div>
                  <strong>{productMap.get(item.product_id)?.name || `Produto #${item.product_id}`}</strong>
                  <p className="mt-1 text-slate-400">{item.quantity} unidade(s) x {formatCurrency(item.unit_price)}</p>
                </div>
                <strong>{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onCopy}><Copy size={16} /> Copiar resumo</Button>
          <Button onClick={onClose}>Concluir</Button>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      <strong className="mt-2 block text-sm text-white">{value}</strong>
    </div>
  );
}

function ProductsPanel({ products, onSaveProduct, onCreateVariant, onDeleteProduct }) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImage, setProductImage] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', code: '', description: '', price: '' });
  const [variantForms, setVariantForms] = useState({});

  function startEdit(product) {
    setEditingProduct(product);
    setProductForm({ name: product.name, code: product.code, description: product.description || '', price: product.price });
  }

  function resetForm() {
    setEditingProduct(null);
    setProductImage(null);
    setProductForm({ name: '', code: '', description: '', price: '' });
  }

  async function submitProduct(event) {
    event.preventDefault();
    await onSaveProduct(editingProduct, productForm, productImage);
    resetForm();
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Card as="form" onSubmit={submitProduct} className="h-fit p-4">
        <h2 className="mb-4 text-lg font-black">{editingProduct ? 'Editar produto' : 'Novo produto'}</h2>
        <div className="space-y-3">
          <TextInput placeholder="Nome" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required />
          <TextInput placeholder="Codigo" value={productForm.code} onChange={(event) => setProductForm({ ...productForm, code: event.target.value })} required />
          <TextInput placeholder="Descricao" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
          <TextInput placeholder="Preco" type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required />
          <TextInput type="file" accept="image/*" onChange={(event) => setProductImage(event.target.files?.[0] || null)} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={resetForm}>Limpar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id} as="article" className="p-4">
            {product.image_url && <img src={product.image_url} alt={product.name} className="mb-3 h-32 w-full rounded-md object-cover" />}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black">{product.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{product.description || 'Sem descricao'}</p>
              </div>
              <Badge variant={product.is_active ? 'success' : 'neutral'}>{product.is_active ? 'Ativo' : 'Inativo'}</Badge>
            </div>
            <strong className="mt-3 block">{formatCurrency(product.price)}</strong>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.map((variant) => <Badge key={variant.id}>{variant.name}</Badge>)}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => startEdit(product)}>Editar</Button>
              <Button variant="danger" size="sm" onClick={() => onDeleteProduct(product)}><Trash2 size={14} /> Excluir</Button>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-black text-slate-700">Nova variante</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {['name', 'code', 'description', 'price'].map((field) => (
                  <TextInput
                    key={field}
                    placeholder={{ name: 'Variante', code: 'Codigo', description: 'Descricao', price: 'Preco' }[field]}
                    type={field === 'price' ? 'number' : 'text'}
                    min={field === 'price' ? '0' : undefined}
                    step={field === 'price' ? '0.01' : undefined}
                    value={variantForms[product.id]?.[field] || ''}
                    onChange={(event) => setVariantForms({
                      ...variantForms,
                      [product.id]: { ...(variantForms[product.id] || {}), [field]: event.target.value },
                    })}
                  />
                ))}
              </div>
              <Button className="mt-3 w-full" size="sm" onClick={async () => {
                await onCreateVariant(product.id, variantForms[product.id] || {});
                setVariantForms({ ...variantForms, [product.id]: { name: '', code: '', description: '', price: '' } });
              }}>
                <Plus size={16} /> Criar variante
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function InventoryPanel({ inventory, inventoryForms, setInventoryForms, onSaveInventory, productMap }) {
  const lowInventory = inventory.filter((item) => item.quantity <= item.min_quantity);
  return (
    <DataCard title="Estoque" subtitle="Controle simples por produto e variante." count={lowInventory.length > 0 ? `${lowInventory.length} alerta` : 'Sem alertas'} danger={lowInventory.length > 0}>
      {inventory.length === 0 ? <Feedback>Nenhum estoque cadastrado.</Feedback> : (
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
            <tr><th className="px-4 py-3">Produto</th><th>Variante</th><th>Quantidade</th><th>Minimo</th><th>Status</th><th className="text-right">Acao</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map((item) => {
              const isLow = item.quantity <= item.min_quantity;
              const product = productMap.get(item.product_id);
              return (
                <tr key={item.id}>
                  <td className="px-4 py-4 font-black">{product?.name || `Produto #${item.product_id}`}</td>
                  <td>{item.variant_id ? `#${item.variant_id}` : 'Produto base'}</td>
                  <td className="py-4"><TextInput className="max-w-28" type="number" min="0" value={inventoryForms[item.id]?.quantity || ''} onChange={(event) => setInventoryForms({ ...inventoryForms, [item.id]: { ...(inventoryForms[item.id] || {}), quantity: event.target.value } })} /></td>
                  <td><TextInput className="max-w-28" type="number" min="0" value={inventoryForms[item.id]?.min_quantity || ''} onChange={(event) => setInventoryForms({ ...inventoryForms, [item.id]: { ...(inventoryForms[item.id] || {}), min_quantity: event.target.value } })} /></td>
                  <td><Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'Baixo' : 'Ok'}</Badge></td>
                  <td className="pr-4 text-right"><Button size="sm" onClick={() => onSaveInventory(item.id)}>Salvar</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </DataCard>
  );
}

function AuditPanel({ auditLogs }) {
  return (
    <DataCard title="Auditoria" subtitle="Acoes administrativas e eventos criticos registrados." count={`${auditLogs.length} logs`}>
      {auditLogs.length === 0 ? <Feedback>Nenhum log registrado.</Feedback> : (
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
            <tr><th className="px-4 py-3">Acao</th><th>Entidade</th><th>Usuario</th><th>Data</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-4 font-black">{log.action}</td>
                <td>{log.entity || 'Sistema'} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                <td>{log.user_id ? `#${log.user_id}` : 'Sistema'}</td>
                <td>{new Date(log.created_at).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DataCard>
  );
}

function PlaceholderPanel({ title, message }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
      <Badge variant="neutral">Preparado</Badge>
      <h2 className="mt-3 text-2xl font-black">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{message}</p>
    </section>
  );
}

function DataCard({ title, subtitle, count, danger = false, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <Badge variant={danger ? 'danger' : 'neutral'}>{count}</Badge>
      </div>
      <div className="overflow-x-auto p-4">{children}</div>
    </section>
  );
}

export function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDeniedStatus, setAccessDeniedStatus] = useState(null);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [inventoryForms, setInventoryForms] = useState({});
  const [productToDelete, setProductToDelete] = useState(null);
  const [errorDialog, setErrorDialog] = useState('');
  const productMap = useMemo(() => buildProductMap(products), [products]);

  async function handleLogout() {
    try {
      await gymPrimeApi.logout();
      setUser(null);
      setAccessDeniedStatus(null);
      toast.success('Sessao encerrada');
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    gymPrimeApi.getSession()
      .then((data) => {
        if (!data.user) {
          setUser(null);
          return;
        }
        if (!data.user.is_admin) {
          setAccessDeniedStatus(403);
          return;
        }
        setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshAdminData().catch(handleAdminError);
  }, [user]);

  function handleAdminError(error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      setAccessDeniedStatus(error.status);
      if (error.status === 403) {
        setErrorDialog('Permissao de admin necessaria. Este acesso foi bloqueado.');
      }
      return;
    }
    setErrorDialog(error.message);
    toast.error(error.message);
  }

  async function refreshAdminData() {
    setAdminDataLoading(true);
    try {
      const [productData, orderData, inventoryData, auditData] = await Promise.all([
        gymPrimeApi.listProducts(),
        gymPrimeApi.listOrders(),
        gymPrimeApi.listInventory(),
        gymPrimeApi.listAuditLogs(),
      ]);
      try {
        setAnalytics(await gymPrimeApi.getAdminAnalyticsSummary());
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          throw error;
        }
        setAnalytics(null);
        toast.error(`Analytics indisponivel: ${error.message}`);
      }
      setProducts(productData);
      setOrders(orderData);
      setInventory(inventoryData);
      setAuditLogs(auditData);
      setInventoryForms(Object.fromEntries(inventoryData.map((item) => [item.id, { quantity: String(item.quantity), min_quantity: String(item.min_quantity) }])));
    } finally {
      setAdminDataLoading(false);
    }
  }

  async function saveProduct(editingProduct, productForm, productImage) {
    const payload = { name: productForm.name, code: productForm.code, description: productForm.description || null, price: productForm.price };
    try {
      const savedProduct = editingProduct
        ? await gymPrimeApi.updateProduct(editingProduct.id, payload)
        : await gymPrimeApi.createProduct(payload);
      if (productImage) await gymPrimeApi.uploadProductImage(savedProduct.id, productImage);
      await refreshAdminData();
      toast.success('Produto salvo');
    } catch (error) {
      handleAdminError(error);
    }
  }

  async function createVariant(productId, form) {
    try {
      await gymPrimeApi.createVariant(productId, { name: form.name, code: form.code, description: form.description || null, price: form.price || null });
      await refreshAdminData();
      toast.success('Variante criada');
    } catch (error) {
      handleAdminError(error);
    }
  }

  async function saveInventory(itemId) {
    const form = inventoryForms[itemId] || {};
    try {
      await gymPrimeApi.updateInventory(itemId, { quantity: Number(form.quantity), min_quantity: Number(form.min_quantity) });
      await refreshAdminData();
      toast.success('Estoque atualizado');
    } catch (error) {
      handleAdminError(error);
    }
  }

  async function updateOrderStatus(orderId, nextStatus) {
    try {
      await gymPrimeApi.updateOrderStatus(orderId, nextStatus);
      await refreshAdminData();
      toast.success('Status do pedido atualizado');
    } catch (error) {
      handleAdminError(error);
    }
  }

  async function deleteProduct(product) {
    try {
      await gymPrimeApi.deleteProduct(product.id);
      await refreshAdminData();
      setProductToDelete(null);
      toast.success('Produto removido');
    } catch (error) {
      handleAdminError(error);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#050606] text-white">Carregando</div>;
  if (accessDeniedStatus) {
    return (
      <AccessDenied
        status={accessDeniedStatus}
        onTryLogin={() => {
          setAccessDeniedStatus(null);
          setUser(null);
        }}
      />
    );
  }
  if (!user) {
    return <AdminLogin onLogin={(adminUser) => {
      setAccessDeniedStatus(null);
      setUser(adminUser);
    }} />;
  }

  return (
    <main className="grid min-h-screen grid-cols-[250px_1fr] bg-[#050606] text-white">
      <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#101214] p-5 text-white">
        <BrandMark label="Gym Prime" tone="dark" />
        <span className="mt-1 block pl-14 text-sm font-bold uppercase tracking-normal text-slate-400">Admin</span>
        <nav className="mt-8 space-y-2">
          {ADMIN_TABS.map(({ key, label, icon }) => (
            <Button
              key={key}
              variant={tab === key ? 'primary' : 'secondary'}
              className={`w-full justify-start ${tab === key ? '' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}
              onClick={() => setTab(key)}
            >
              {icon}
              {label}
            </Button>
          ))}
        </nav>
        <Link to={APP_ROUTES.totem} className="mt-auto flex min-h-11 items-center justify-center rounded-md border border-white/10 text-sm font-black text-white hover:bg-white/10">
          Abrir Totem
        </Link>
      </aside>

      <section className="min-w-0 p-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-slate-400">Operacao local da lanchonete Gym Prime.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success">Servidor local online</Badge>
            <div className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black">
              <CalendarDays size={16} />
              Hoje
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black">
              <Shield size={16} />
              Administrador
            </div>
            <button type="button" className="text-xs font-black text-slate-400 underline-offset-4 hover:text-white hover:underline" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        {adminDataLoading && <Feedback className="mb-4 py-3">Carregando dados...</Feedback>}
        {tab === 'dashboard' && <Dashboard orders={orders} inventory={inventory} productMap={productMap} analytics={analytics} setTab={setTab} />}
        {tab === 'orders' && <OrdersPanel orders={orders} productMap={productMap} onUpdateStatus={updateOrderStatus} />}
        {tab === 'products' && <ProductsPanel products={products} onSaveProduct={saveProduct} onCreateVariant={createVariant} onDeleteProduct={setProductToDelete} />}
        {tab === 'inventory' && <InventoryPanel inventory={inventory} inventoryForms={inventoryForms} setInventoryForms={setInventoryForms} onSaveInventory={saveInventory} productMap={productMap} />}
        {tab === 'audit' && <AuditPanel auditLogs={auditLogs} />}
        {tab === 'customers' && <PlaceholderPanel title="Clientes" message="A area de clientes esta preparada para quando houver endpoint dedicado. Hoje os dados disponiveis aparecem nos pedidos." />}
        {tab === 'settings' && <PlaceholderPanel title="Configuracoes" message="Configuracoes de WhatsApp, Totem e pagamentos futuros dependem de endpoints especificos. Nenhuma chamada nova foi criada." />}
      </section>

      {productToDelete && (
        <ConfirmDialog
          danger
          title="Excluir produto?"
          message={`${productToDelete.name} sera removido do cardapio ativo, mantendo pedidos historicos.`}
          confirmLabel="Excluir"
          onCancel={() => setProductToDelete(null)}
          onConfirm={() => deleteProduct(productToDelete)}
        />
      )}
      {errorDialog && <ErrorDialog message={errorDialog} onClose={() => setErrorDialog('')} />}
    </main>
  );
}
