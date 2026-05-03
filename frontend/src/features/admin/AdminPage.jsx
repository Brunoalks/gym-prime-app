import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BarChart3, CalendarDays, ChevronDown, ClipboardList, Clock, Copy, DollarSign, Eye, FileImage, LayoutDashboard, Package, Plus, Settings, Shield, ShoppingBag, Trash2, TrendingUp, Users } from 'lucide-react';
import { Badge, Button, Feedback, TextInput } from '../../components/ui.jsx';
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

const SALES_PERIOD_OPTIONS = [
  { value: 'hour', label: 'Por hora' },
  { value: 'day', label: 'Por dia' },
  { value: 'week', label: 'Por semana' },
  { value: 'month', label: 'Por mes' },
];

const ADMIN_FIELD_CLASS = 'min-h-11 rounded-md border border-white/10 bg-[#0B0D0E] px-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-[#B6FF3B] focus:ring-2 focus:ring-[#B6FF3B]/20';

const STATUS_STYLES = {
  pending: 'border-[#B6FF3B]/50 bg-[#B6FF3B]/10 text-[#B6FF3B]',
  preparing: 'border-sky-400/50 bg-sky-400/10 text-sky-300',
  ready: 'border-slate-400/50 bg-white/8 text-slate-200',
  completed: 'border-[#B6FF3B]/50 bg-[#B6FF3B]/10 text-[#B6FF3B]',
  canceled: 'border-slate-500/60 bg-white/5 text-slate-400',
};

function getOrderOrigin(order) {
  return order.user_id ? 'Cliente' : 'Totem';
}

function formatTime(value) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatAxisValue(value) {
  if (value >= 1000) return `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  return Math.round(value).toLocaleString('pt-BR');
}

function AdminSelect({ className = '', children, ...props }) {
  return (
    <select className={`${ADMIN_FIELD_CLASS} ${className}`} {...props}>
      {children}
    </select>
  );
}

function AdminTextInput({ className = '', ...props }) {
  return <TextInput className={`${ADMIN_FIELD_CLASS} ${className}`} {...props} />;
}

function AdminCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-white/10 bg-[#0B0D0E] px-3 text-sm font-bold text-slate-300">
      <span className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? 'border-[#B6FF3B] bg-[#B6FF3B] text-[#101214]' : 'border-white/20 bg-white/5'}`}>
        {checked && <span className="h-2 w-2 rounded-sm bg-[#101214]" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}

function AdminFileInput({ onChange }) {
  return (
    <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-white/20 bg-[#0B0D0E] px-3 text-sm font-black text-slate-300 transition hover:border-[#B6FF3B]/60 hover:text-white">
      <FileImage size={17} />
      Selecionar imagem
      <input type="file" accept="image/*" onChange={onChange} className="sr-only" />
    </label>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex min-h-7 items-center gap-2 rounded-full border px-3 text-xs font-black ${STATUS_STYLES[status] || STATUS_STYLES.ready}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}

function Sparkline({ danger = false }) {
  const stroke = danger ? '#F59E0B' : '#B6FF3B';
  const bars = [18, 30, 22, 42, 28, 52];
  if (danger) {
    return (
      <div className="flex h-10 items-end gap-1">
        {bars.map((height, index) => <span key={index} className="w-1.5 rounded-sm bg-amber-500/80" style={{ height }} />)}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 92 42" className="h-11 w-24" aria-hidden="true">
      <polyline points="0,34 12,35 22,30 34,31 46,22 57,14 68,24 80,15 92,10" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

function Dashboard({ orders, inventory, productMap, analytics, salesSeries, salesPeriod, onSalesPeriodChange, setTab }) {
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
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <KpiCard title="Vendas hoje" value={formatCurrency(kpis?.sales_today ?? revenue)} badge="18,8%" helper="vs ontem" icon={<DollarSign size={24} />} />
        <KpiCard title="Pedidos" value={kpis?.orders_today ?? orders.length} badge="11,8%" helper="vs ontem" icon={<ShoppingBag size={24} />} />
        <KpiCard title="Ticket medio" value={formatCurrency(kpis?.average_ticket ?? (orders.length ? revenue / orders.length : 0))} badge="6,3%" helper="vs ontem" icon={<TrendingUp size={24} />} />
        <KpiCard title="Estoque em alerta" value={lowInventoryItems.length} badge={lowInventoryItems.length ? 'Requer atencao' : 'Ok'} danger={lowInventoryItems.length > 0} icon={<AlertTriangle size={24} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_430px]">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#121415]/85 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="flex items-center gap-3 text-lg font-black"><ClipboardList size={20} className="text-slate-300" /> Pedidos recentes</h2>
            <Button size="sm" variant="secondary" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setTab('orders')}>Ver todos</Button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-4"><Feedback>Nenhum pedido registrado ainda.</Feedback></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-white/[0.025] text-xs font-black uppercase text-slate-400">
                  <tr><th className="px-5 py-3"># Pedido</th><th>Hora</th><th>Origem / Cliente</th><th>Itens</th><th className="pr-6 text-right">Total</th><th className="pl-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.025]">
                      <td className="px-5 py-3.5 font-black">#{order.id}</td>
                      <td className="text-slate-300">{formatTime(order.created_at)}</td>
                      <td className="text-slate-200">
                        {order.customer_label || order.customer_name || `Usuario ${order.user_id}`}
                        <Badge className="ml-2 min-h-6 border border-sky-400/40 bg-sky-400/10 px-2 text-sky-300">{order.origin || (order.user_id ? 'Cliente' : 'Totem')}</Badge>
                      </td>
                      <td className="text-slate-300">{order.items_count ?? order.items?.length ?? 0} itens</td>
                      <td className="pr-6 text-right font-black">{formatCurrency(order.total_amount)}</td>
                      <td className="pl-3 pr-5"><StatusPill status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-sm text-slate-400">
            <span>Mostrando {Math.min(recentOrders.length, 8)} de {orders.length} pedidos</span>
            <button type="button" className="font-black text-white hover:text-[#B6FF3B]" onClick={() => setTab('orders')}>Ver todos os pedidos</button>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-[#121415]/85 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="flex items-center gap-3 text-lg font-black"><AlertTriangle size={20} className="text-amber-400" /> Estoque baixo</h2>
              <button type="button" className="text-sm font-black text-sky-400 hover:text-sky-300" onClick={() => setTab('inventory')}>Ver estoque</button>
            </div>
            {lowInventoryItems.length === 0 ? <Feedback variant="success">Nenhum item abaixo do minimo.</Feedback> : (
              <div className="divide-y divide-white/10">
                {lowInventoryItems.slice(0, 4).map((item) => (
                  <div key={item.inventory_id} className="grid grid-cols-[54px_1fr_52px_52px_90px] items-center gap-3 py-3 text-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-black/30 text-[#B6FF3B]"><Package size={22} /></div>
                    <strong>{item.product_name}{item.variant_name ? ` - ${item.variant_name}` : ''}</strong>
                    <span className="font-black">{item.quantity}</span>
                    <span className="text-slate-400">{item.min_quantity}</span>
                    <Badge variant={item.severity === 'critical' ? 'danger' : 'neutral'} className={item.severity === 'critical' ? 'border border-red-500/40 bg-red-500/10 text-red-300' : 'border border-amber-500/40 bg-amber-500/10 text-amber-300'}>{item.severity === 'critical' ? 'Critico' : 'Baixo'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-[#121415]/85 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="flex items-center gap-3 text-lg font-black"><BarChart3 size={20} className="text-slate-300" /> Produtos mais vendidos</h2>
              <button type="button" className="text-sm font-black text-sky-400 hover:text-sky-300">Ver relatorio</button>
            </div>
            {topProducts.length === 0 ? <Feedback>Nenhum ranking disponivel.</Feedback> : (
              <div className="space-y-3">
                {topProducts.map((item, index) => (
                  <div key={item.productId || item.product_id}>
                    <div className="grid grid-cols-[24px_1fr_78px_98px] items-center gap-3 text-sm">
                      <span className="font-black text-slate-400">{index + 1}</span>
                      <div className="flex min-w-0 items-center gap-3">
                        {(item.product?.image_url || item.image_url) && <img src={item.product?.image_url || item.image_url} alt="" className="h-9 w-9 rounded-md object-cover" />}
                        <strong className="truncate">{item.product_name || item.product?.name || `Produto #${item.productId || item.product_id}`}</strong>
                      </div>
                      <span className="font-black text-slate-300">{item.quantity} un.</span>
                      <span className="text-right font-black">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="ml-8 mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-[#B6FF3B]" style={{ width: `${Math.min(100, item.quantity * 12)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <SalesChart
        salesSeries={salesSeries}
        period={salesPeriod}
        onPeriodChange={onSalesPeriodChange}
        fallbackHourlySales={analytics?.hourly_sales || []}
      />
    </section>
  );
}

function SalesChart({ salesSeries, period, onPeriodChange, fallbackHourlySales }) {
  const fallbackPoints = fallbackHourlySales.map((point) => ({
    key: String(point.hour).padStart(2, '0'),
    label: `${String(point.hour).padStart(2, '0')}h`,
    total_amount: point.total_amount,
    orders_count: point.orders_count,
  }));
  const points = salesSeries?.points?.length > 0
    ? salesSeries.points
    : fallbackPoints.length > 0
      ? fallbackPoints
      : Array.from({ length: 24 }, (_, hour) => ({ key: String(hour).padStart(2, '0'), label: `${String(hour).padStart(2, '0')}h`, total_amount: 0, orders_count: 0 }));
  const maxValue = Math.max(...points.map((point) => Number(point.total_amount)), 1);
  const yAxisValues = [1, 0.75, 0.5, 0.25, 0].map((ratio) => maxValue * ratio);
  const chartPoints = points.map((point, index) => {
    const x = 7 + (index / Math.max(points.length - 1, 1)) * 88;
    const y = 94 - (Number(point.total_amount) / maxValue) * 78;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `7,94 ${chartPoints} 95,94`;
  const labelInterval = points.length > 14 ? 2 : 1;
  const activePeriodLabel = SALES_PERIOD_OPTIONS.find((option) => option.value === period)?.label || 'Por hora';

  return (
    <section className="rounded-lg border border-white/10 bg-[#121415]/85 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-3 text-lg font-black"><BarChart3 size={20} className="text-slate-300" /> Evolucao das vendas</h2>
          <p className="mt-1 text-sm text-slate-400">Serie real de pedidos agregada {activePeriodLabel.toLowerCase()}.</p>
        </div>
        <AdminSelect value={period} onChange={(event) => onPeriodChange(event.target.value)} className="w-36">
          {SALES_PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </AdminSelect>
      </div>
      <div className="relative h-64 rounded-lg bg-black/25 px-4 pb-8 pl-14 pt-5">
        <div className="absolute bottom-8 left-4 top-5 flex flex-col-reverse justify-between text-xs font-bold leading-none text-slate-400">
          {yAxisValues.slice().reverse().map((value) => <span key={value}>{formatAxisValue(value)}</span>)}
        </div>
        <div className="absolute bottom-2 left-14 right-4 grid text-center text-[11px] font-bold leading-none text-slate-400" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
          {points.map((point, index) => (
            <span key={point.key} className={index % labelInterval === 0 || index === points.length - 1 ? 'truncate' : 'opacity-0'}>{point.label}</span>
          ))}
        </div>
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label="Grafico de vendas por hora">
          <defs>
            <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#B6FF3B" stopOpacity="0.46" />
              <stop offset="100%" stopColor="#B6FF3B" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {yAxisValues.map((value) => {
            const y = 94 - (value / maxValue) * 78;
            return <line key={value} x1="7" x2="95" y1={y} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />;
          })}
          <polyline points={areaPoints} fill="url(#salesArea)" stroke="none" />
          <polyline points={chartPoints} fill="none" stroke="#B6FF3B" strokeWidth="2.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point, index) => {
            if (index % 2 !== 0) return null;
            const x = 7 + (index / Math.max(points.length - 1, 1)) * 88;
            const y = 94 - (Number(point.total_amount) / maxValue) * 78;
            return <circle key={point.key} cx={x} cy={y} r="1.1" fill="#B6FF3B" vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      </div>
    </section>
  );
}

function KpiCard({ title, value, badge, helper, danger = false, icon }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-white/10 bg-[#121415]/90 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg border bg-black/20 ${danger ? 'border-amber-500/70 text-amber-400' : 'border-[#B6FF3B]/55 text-[#B6FF3B]'}`}>
          {icon}
        </div>
        <Sparkline danger={danger} />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-300">{title}</p>
      <strong className="mt-2 block text-3xl font-black text-white">{value}</strong>
      <div className={`mt-4 flex items-center gap-2 text-sm font-black ${danger ? 'text-amber-400' : 'text-[#B6FF3B]'}`}>
        {danger ? <AlertTriangle size={16} /> : <TrendingUp size={16} />}
        <span>{badge}</span>
        {helper && <span className="font-medium text-white">{helper}</span>}
      </div>
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
          <AdminTextInput type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
          <AdminSelect value={filters.origin} onChange={(event) => setFilters({ ...filters, origin: event.target.value })}>
            <option value="all">Todas as origens</option>
            <option value="Cliente">Cliente</option>
            <option value="Totem">Totem</option>
          </AdminSelect>
          <AdminSelect value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">Todos os status</option>
            {ORDER_STATUS_OPTIONS.map((statusOption) => <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>)}
          </AdminSelect>
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
                    <AdminSelect className="min-h-9 px-2 text-xs" value={order.status} onChange={(event) => onUpdateStatus(order.id, event.target.value)}>
                      {ORDER_STATUS_OPTIONS.map((statusOption) => <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>)}
                    </AdminSelect>
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
            <AdminSelect className="mt-2 w-full" value={order.status} onChange={(event) => onUpdateStatus(order.id, event.target.value)}>
              {ORDER_STATUS_OPTIONS.map((statusOption) => <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>)}
            </AdminSelect>
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

function ProductsPanel({ products, onSaveProduct, onCreateVariant, onUpdateVariant, onDeleteVariant, onDeleteProduct }) {
  const [productModal, setProductModal] = useState(null);
  const [variantForms, setVariantForms] = useState({});

  function startVariantEdit(productId, variant) {
    setVariantForms({
      ...variantForms,
      [variant.id]: {
        productId,
        name: variant.name,
        code: variant.code,
        description: variant.description || '',
        price: variant.price || '',
        is_active: variant.is_active,
      },
    });
  }

  function updateVariantForm(variantId, patch) {
    setVariantForms({ ...variantForms, [variantId]: { ...(variantForms[variantId] || {}), ...patch } });
  }

  async function submitVariant(productId, variant) {
    const form = variantForms[variant.id];
    await onUpdateVariant(productId, variant.id, {
      name: form.name,
      code: form.code,
      description: form.description || null,
      price: form.price || null,
      is_active: form.is_active,
    });
    const nextForms = { ...variantForms };
    delete nextForms[variant.id];
    setVariantForms(nextForms);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#121415]/85 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
        <div>
          <h2 className="text-lg font-black">Produtos</h2>
          <p className="mt-1 text-sm text-slate-400">Cardapio, variantes, imagem e disponibilidade.</p>
        </div>
        <Button onClick={() => setProductModal({ product: null })}><Plus size={16} /> Novo produto</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-lg border border-white/10 bg-[#121415]/85 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <div className="grid min-h-44 grid-cols-[150px_1fr]">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full min-h-44 w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-44 items-center justify-center bg-white/[0.03] text-xs font-black uppercase text-slate-500">Sem imagem</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black">{product.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{product.description || 'Sem descricao'}</p>
                  </div>
                  <Badge variant={product.is_active ? 'success' : 'neutral'}>{product.is_active ? 'Ativo' : 'Inativo'}</Badge>
                </div>
                <strong className="mt-3 block text-xl">{formatCurrency(product.price)}</strong>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setProductModal({ product })}>Editar</Button>
                  <Button variant="secondary" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onSaveProduct(product, { ...product, is_active: !product.is_active }, null)}>
                    {product.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDeleteProduct(product)}><Trash2 size={14} /> Remover</Button>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-300">Variantes</h3>
                <p className="mt-1 text-xs text-slate-500">{product.variants.length} opcoes cadastradas</p>
              </div>
            </div>

              {product.variants.length > 0 && (
                <div className="mt-3 space-y-2">
                  {product.variants.map((variant) => {
                    const variantForm = variantForms[variant.id];
                    if (variantForm) {
                      return (
                        <div key={variant.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <AdminTextInput placeholder="Variante" value={variantForm.name} onChange={(event) => updateVariantForm(variant.id, { name: event.target.value })} />
                            <AdminTextInput placeholder="Codigo" value={variantForm.code} onChange={(event) => updateVariantForm(variant.id, { code: event.target.value })} />
                            <AdminTextInput placeholder="Descricao" value={variantForm.description} onChange={(event) => updateVariantForm(variant.id, { description: event.target.value })} />
                            <AdminTextInput placeholder="Preco" type="number" min="0" step="0.01" value={variantForm.price} onChange={(event) => updateVariantForm(variant.id, { price: event.target.value })} />
                          </div>
                          <div className="mt-3"><AdminCheckbox checked={variantForm.is_active} onChange={(event) => updateVariantForm(variant.id, { is_active: event.target.checked })} label="Variante ativa" /></div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button size="sm" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => {
                              const nextForms = { ...variantForms };
                              delete nextForms[variant.id];
                              setVariantForms(nextForms);
                            }}>Cancelar</Button>
                            <Button size="sm" onClick={() => submitVariant(product.id, variant)}>Salvar variante</Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={variant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-black/20 p-3 text-sm">
                        <div>
                          <strong>{variant.name}</strong>
                          <span className="ml-2 text-slate-400">{variant.price ? formatCurrency(variant.price) : 'Preco base'}</span>
                          <Badge className="ml-2" variant={variant.is_active ? 'success' : 'neutral'}>{variant.is_active ? 'Ativa' : 'Inativa'}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => startVariantEdit(product.id, variant)}>Editar</Button>
                          <Button size="sm" variant="danger" onClick={() => onDeleteVariant(product.id, variant.id)}>Desativar</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
                <h3 className="text-sm font-black text-slate-300">Nova variante</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {['name', 'code', 'description', 'price'].map((field) => (
                    <AdminTextInput
                      key={field}
                      placeholder={{ name: 'Variante', code: 'Codigo', description: 'Descricao', price: 'Preco' }[field]}
                      type={field === 'price' ? 'number' : 'text'}
                      min={field === 'price' ? '0' : undefined}
                      step={field === 'price' ? '0.01' : undefined}
                      value={variantForms[`new-${product.id}`]?.[field] || ''}
                      onChange={(event) => setVariantForms({
                        ...variantForms,
                        [`new-${product.id}`]: { ...(variantForms[`new-${product.id}`] || {}), [field]: event.target.value },
                      })}
                    />
                  ))}
                </div>
                <Button className="mt-3 w-full" size="sm" onClick={async () => {
                  await onCreateVariant(product.id, variantForms[`new-${product.id}`] || {});
                  setVariantForms({ ...variantForms, [`new-${product.id}`]: { name: '', code: '', description: '', price: '' } });
                }}>
                  <Plus size={16} /> Criar variante
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {productModal && (
        <ProductFormDialog
          product={productModal.product}
          onClose={() => setProductModal(null)}
          onSave={async (product, form, image) => {
            await onSaveProduct(product, form, image);
            setProductModal(null);
          }}
        />
      )}
    </section>
  );
}

function ProductFormDialog({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    code: product?.code || '',
    description: product?.description || '',
    price: product?.price || '',
    is_active: product?.is_active ?? true,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || '');

  async function submitProduct(event) {
    event.preventDefault();
    await onSave(product, form, image);
  }

  function handleImageChange(event) {
    const nextImage = event.target.files?.[0] || null;
    setImage(nextImage);
    setImagePreview(nextImage ? URL.createObjectURL(nextImage) : product?.image_url || '');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={submitProduct} className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-[#101214] p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="neutral">{product ? 'Editar' : 'Novo'}</Badge>
            <h2 className="mt-3 text-2xl font-black">{product ? 'Editar produto' : 'Novo produto'}</h2>
          </div>
          <Button type="button" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
          <div>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/20">
              {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-black uppercase text-slate-500">Preview</span>}
            </div>
            <AdminFileInput onChange={handleImageChange} />
          </div>

          <div className="space-y-3">
            <AdminTextInput placeholder="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <AdminTextInput placeholder="Codigo" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
            <AdminTextInput placeholder="Descricao" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <AdminTextInput placeholder="Preco" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
            <AdminCheckbox checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} label="Produto ativo no cardapio" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar produto</Button>
        </div>
      </form>
    </div>
  );
}

function InventoryPanel({ inventory, inventoryForms, setInventoryForms, onSaveInventory, productMap }) {
  const [filters, setFilters] = useState({ search: '', onlyLow: false });
  const lowInventory = inventory.filter((item) => item.quantity <= item.min_quantity);
  const filteredInventory = inventory.filter((item) => {
    const product = productMap.get(item.product_id);
    const variant = product?.variants?.find((productVariant) => productVariant.id === item.variant_id);
    const searchableText = `${product?.name || ''} ${variant?.name || ''} ${item.product_id} ${item.variant_id || ''}`.toLowerCase();
    const matchesSearch = searchableText.includes(filters.search.toLowerCase());
    const matchesLow = !filters.onlyLow || item.quantity <= item.min_quantity;
    return matchesSearch && matchesLow;
  });

  return (
    <DataCard title="Estoque" subtitle="Controle por produto, variante, minimo e alerta operacional." count={lowInventory.length > 0 ? `${lowInventory.length} alerta` : 'Sem alertas'} danger={lowInventory.length > 0}>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_190px_140px]">
        <AdminTextInput placeholder="Buscar produto ou variante" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <AdminCheckbox checked={filters.onlyLow} onChange={(event) => setFilters({ ...filters, onlyLow: event.target.checked })} label="Baixo estoque" />
        <Button variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setFilters({ search: '', onlyLow: false })}>Limpar</Button>
      </div>

      {inventory.length === 0 ? <Feedback>Nenhum estoque cadastrado.</Feedback> : filteredInventory.length === 0 ? <Feedback>Nenhum item encontrado para os filtros.</Feedback> : (
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.03] text-xs font-black uppercase text-slate-400">
            <tr><th className="px-4 py-3">Produto</th><th>Variante</th><th>Quantidade</th><th>Minimo</th><th>Severidade</th><th className="text-right">Acao</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredInventory.map((item) => {
              const isLow = item.quantity <= item.min_quantity;
              const isCritical = item.quantity === 0;
              const product = productMap.get(item.product_id);
              const variant = product?.variants?.find((productVariant) => productVariant.id === item.variant_id);
              return (
                <tr key={item.id}>
                  <td className="px-4 py-4 font-black">{product?.name || `Produto #${item.product_id}`}</td>
                  <td className="text-slate-300">{variant?.name || (item.variant_id ? `Variante #${item.variant_id}` : 'Produto base')}</td>
                  <td className="py-4"><AdminTextInput className="max-w-28" type="number" min="0" value={inventoryForms[item.id]?.quantity ?? ''} onChange={(event) => setInventoryForms({ ...inventoryForms, [item.id]: { ...(inventoryForms[item.id] || {}), quantity: event.target.value } })} /></td>
                  <td><AdminTextInput className="max-w-28" type="number" min="0" value={inventoryForms[item.id]?.min_quantity ?? ''} onChange={(event) => setInventoryForms({ ...inventoryForms, [item.id]: { ...(inventoryForms[item.id] || {}), min_quantity: event.target.value } })} /></td>
                  <td><Badge variant={isLow ? 'danger' : 'success'}>{isCritical ? 'Critico' : isLow ? 'Baixo' : 'Ok'}</Badge></td>
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
          <thead className="bg-white/[0.03] text-xs font-black uppercase text-slate-400">
            <tr><th className="px-4 py-3">Acao</th><th>Entidade</th><th>Usuario</th><th>Data</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-4 font-black">{log.action}</td>
                <td className="text-slate-300">{log.entity || 'Sistema'} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                <td className="text-slate-300">{log.user_id ? `#${log.user_id}` : 'Sistema'}</td>
                <td className="text-slate-400">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DataCard>
  );
}

function CustomersPanel({ customers }) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const filteredCustomers = customers.filter((customer) => {
    const text = `${customer.full_name} ${customer.email} ${customer.cpf_masked || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <DataCard title="Clientes" subtitle="Contas cadastradas, historico resumido e dados sensiveis mascarados." count={`${filteredCustomers.length}/${customers.length} clientes`}>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_140px]">
          <AdminTextInput placeholder="Buscar por nome, email ou CPF mascarado" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setSearch('')}>Limpar</Button>
        </div>
        {filteredCustomers.length === 0 ? <Feedback>Nenhum cliente encontrado.</Feedback> : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs font-black uppercase text-slate-400">
              <tr><th className="px-4 py-3">Cliente</th><th>Email</th><th>CPF</th><th>Pedidos</th><th>Ultimo pedido</th><th className="text-right">Total gasto</th><th className="text-right">Acao</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-4 font-black">{customer.full_name}</td>
                  <td className="text-slate-300">{customer.email}</td>
                  <td><Badge variant="neutral">{customer.cpf_masked || 'Nao informado'}</Badge></td>
                  <td>{customer.total_orders}</td>
                  <td className="text-slate-400">{customer.last_order_at ? new Date(customer.last_order_at).toLocaleString('pt-BR') : 'Sem pedidos'}</td>
                  <td className="pr-4 text-right font-black">{formatCurrency(customer.total_spent)}</td>
                  <td className="pr-4 text-right">
                    <Button size="sm" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setSelectedCustomer(customer)}><Eye size={14} /> Detalhe</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataCard>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 p-4">
          <section className="w-full max-w-md rounded-lg border border-white/10 bg-[#101214] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="neutral">Cliente</Badge>
                <h2 className="mt-3 text-2xl font-black">{selectedCustomer.full_name}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedCustomer.email}</p>
              </div>
              <Button variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setSelectedCustomer(null)}>Fechar</Button>
            </div>
            <div className="mt-5 grid gap-3">
              <InfoBlock label="CPF" value={selectedCustomer.cpf_masked || 'Nao informado'} />
              <InfoBlock label="Pedidos" value={selectedCustomer.total_orders} />
              <InfoBlock label="Total gasto" value={formatCurrency(selectedCustomer.total_spent)} />
              <InfoBlock label="Ultimo pedido" value={selectedCustomer.last_order_at ? new Date(selectedCustomer.last_order_at).toLocaleString('pt-BR') : 'Sem pedidos'} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function SettingsPanel({ settings, onSaveSettings }) {
  const [form, setForm] = useState({
    establishment_name: settings?.establishment_name || 'Gym Prime',
    whatsapp_phone: settings?.whatsapp_phone || '',
    menu_is_open: settings?.menu_is_open ?? true,
    totem_message: settings?.totem_message || 'Finalize seu pedido e retire no balcao.',
  });

  async function submitSettings(event) {
    event.preventDefault();
    await onSaveSettings({
      establishment_name: form.establishment_name,
      whatsapp_phone: form.whatsapp_phone || null,
      menu_is_open: form.menu_is_open,
      totem_message: form.totem_message,
    });
  }

  const preview = `Novo pedido\nCliente: Cliente Exemplo\nItens:\n- 1x Coca-Cola: R$ 7.00\nTotal: R$ 7.00`;

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <form onSubmit={submitSettings} className="rounded-lg border border-white/10 bg-[#121415]/85 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Configuracoes</h2>
            <p className="mt-1 text-sm text-slate-400">Dados operacionais persistidos no backend.</p>
          </div>
          <Badge variant={form.menu_is_open ? 'success' : 'danger'}>{form.menu_is_open ? 'Cardapio aberto' : 'Cardapio fechado'}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Nome exibido</span>
            <AdminTextInput value={form.establishment_name} onChange={(event) => setForm({ ...form, establishment_name: event.target.value })} required />
          </label>
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">WhatsApp</span>
            <AdminTextInput placeholder="5511999999999" value={form.whatsapp_phone} onChange={(event) => setForm({ ...form, whatsapp_phone: event.target.value })} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Mensagem do totem</span>
            <AdminTextInput value={form.totem_message} onChange={(event) => setForm({ ...form, totem_message: event.target.value })} required />
          </label>
          <AdminCheckbox checked={form.menu_is_open} onChange={(event) => setForm({ ...form, menu_is_open: event.target.checked })} label="Cardapio aberto para Cliente e Totem" />
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit">Salvar configuracoes</Button>
        </div>
      </form>

      <aside className="rounded-lg border border-white/10 bg-[#121415]/85 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
        <Badge variant="neutral">Preview</Badge>
        <h2 className="mt-3 text-lg font-black">Mensagem WhatsApp</h2>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-black/30 p-4 text-sm leading-6 text-slate-300">{preview}</pre>
        <div className="mt-4 rounded-lg bg-black/20 p-4 text-sm text-slate-300">
          {form.totem_message}
        </div>
      </aside>
    </section>
  );
}

function DataCard({ title, subtitle, count, danger = false, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#121415]/85 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
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

function AdminSummaryCard({ analytics, orders, inventory }) {
  const revenue = analytics?.kpis?.sales_today ?? orders.reduce((total, order) => total + Number(order.total_amount), 0);
  const ordersToday = analytics?.kpis?.orders_today ?? orders.length;
  const itemsSold = analytics?.kpis?.items_sold_today ?? orders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const customersServed = analytics?.kpis?.customers_served ?? new Set(orders.map((order) => order.user_id || order.customer_name).filter(Boolean)).size;
  const lowInventory = inventory.filter((item) => item.quantity <= item.min_quantity).length;

  return (
    <section className="rounded-lg border border-white/15 bg-[#0B0D0E]/90 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black">Resumo do dia</h2>
        <ChevronDown size={17} className="text-slate-300" />
      </div>
      {[
        ['Vendas', formatCurrency(revenue)],
        ['Pedidos', ordersToday],
        ['Itens vendidos', itemsSold],
        ['Clientes atendidos', customersServed],
        ['Alertas estoque', lowInventory],
      ].map(([label, value]) => (
        <div key={label} className="border-t border-white/10 py-3 first:border-t-0 first:pt-0">
          <span className="block text-xs font-medium text-slate-300">{label}</span>
          <strong className="mt-1 block text-lg font-black text-[#B6FF3B]">{value}</strong>
        </div>
      ))}
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
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [salesSeries, setSalesSeries] = useState(null);
  const [salesPeriod, setSalesPeriod] = useState('hour');
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
      const [productData, orderData, inventoryData, auditData, customerData, settingsData] = await Promise.all([
        gymPrimeApi.listProducts(),
        gymPrimeApi.listOrders(),
        gymPrimeApi.listInventory(),
        gymPrimeApi.listAuditLogs(),
        gymPrimeApi.listAdminCustomers(),
        gymPrimeApi.getAdminSettings(),
      ]);
      try {
        const [summaryData, salesSeriesData] = await Promise.all([
          gymPrimeApi.getAdminAnalyticsSummary(),
          gymPrimeApi.getAdminSalesSeries(salesPeriod),
        ]);
        setAnalytics(summaryData);
        setSalesSeries(salesSeriesData);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          throw error;
        }
        setAnalytics(null);
        setSalesSeries(null);
        toast.error(`Analytics indisponivel: ${error.message}`);
      }
      setProducts(productData);
      setOrders(orderData);
      setInventory(inventoryData);
      setAuditLogs(auditData);
      setCustomers(customerData);
      setSettings(settingsData);
      setInventoryForms(Object.fromEntries(inventoryData.map((item) => [item.id, { quantity: String(item.quantity), min_quantity: String(item.min_quantity) }])));
    } finally {
      setAdminDataLoading(false);
    }
  }

  async function changeSalesPeriod(nextPeriod) {
    setSalesPeriod(nextPeriod);
    try {
      setSalesSeries(await gymPrimeApi.getAdminSalesSeries(nextPeriod));
    } catch (error) {
      handleAdminError(error);
    }
  }

  async function saveProduct(editingProduct, productForm, productImage) {
    const payload = {
      name: productForm.name,
      code: productForm.code,
      description: productForm.description || null,
      price: productForm.price,
      is_active: productForm.is_active,
    };
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

  async function updateVariant(productId, variantId, form) {
    try {
      await gymPrimeApi.updateVariant(productId, variantId, form);
      await refreshAdminData();
      toast.success('Variante atualizada');
    } catch (error) {
      handleAdminError(error);
    }
  }

  async function deleteVariant(productId, variantId) {
    try {
      await gymPrimeApi.deleteVariant(productId, variantId);
      await refreshAdminData();
      toast.success('Variante desativada');
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

  async function saveSettings(payload) {
    try {
      const updatedSettings = await gymPrimeApi.updateAdminSettings(payload);
      setSettings(updatedSettings);
      toast.success('Configuracoes salvas');
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
  const activeTabLabel = ADMIN_TABS.find((item) => item.key === tab)?.label || 'Dashboard';

  return (
    <main className="grid min-h-screen grid-cols-[228px_1fr] bg-[#050606] text-white">
      <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#07090A] p-5 text-white">
        <BrandMark label="Gym Prime" tone="dark" />
        <span className="mt-1 block pl-14 text-sm font-bold uppercase tracking-normal text-slate-300">ADMIN</span>
        <nav className="mt-8 space-y-2">
          {ADMIN_TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              className={`flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-black transition ${tab === key ? 'bg-[#B6FF3B] text-[#101214] shadow-[0_0_24px_rgba(182,255,59,0.22)]' : 'text-slate-200 hover:bg-white/8 hover:text-white'}`}
              onClick={() => setTab(key)}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <AdminSummaryCard analytics={analytics} orders={orders} inventory={inventory} />
          <Link to={APP_ROUTES.totem} className="flex min-h-10 items-center justify-center rounded-md border border-white/10 text-xs font-black text-slate-300 hover:bg-white/10 hover:text-white">
            Abrir Totem
          </Link>
          <div className="text-xs font-medium leading-6 text-slate-500">
            <span className="block">© 2026 Gym Prime</span>
            <span className="block">v1.0.0</span>
          </div>
        </div>
      </aside>

      <section className="min-w-0 bg-[radial-gradient(circle_at_48%_4%,rgba(182,255,59,0.05),transparent_34%)] p-7">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black leading-none">{activeTabLabel}</h1>
            {tab !== 'dashboard' && <p className="mt-2 text-sm font-medium text-slate-400">Operacao local da lanchonete Gym Prime.</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex min-h-11 items-center gap-3 rounded-lg border border-white/15 bg-[#0B0D0E] px-4 text-sm font-black">
              <span className="h-3 w-3 rounded-full bg-[#B6FF3B] shadow-[0_0_18px_rgba(182,255,59,0.62)]" />
              Servidor local online
            </div>
            <button type="button" className="flex min-h-11 items-center gap-3 rounded-lg border border-white/15 bg-[#0B0D0E] px-4 text-sm font-black">
              <CalendarDays size={16} />
              Hoje
              <ChevronDown size={15} />
            </button>
            <button type="button" className="flex min-h-11 items-center gap-3 rounded-lg border border-white/15 bg-[#0B0D0E] px-4 text-sm font-black">
              <Shield size={16} />
              Administrador
              <ChevronDown size={15} />
            </button>
            <button type="button" className="text-xs font-black text-slate-400 underline-offset-4 hover:text-white hover:underline" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        {adminDataLoading && <Feedback className="mb-4 py-3">Carregando dados...</Feedback>}
        {tab === 'dashboard' && (
          <Dashboard
            orders={orders}
            inventory={inventory}
            productMap={productMap}
            analytics={analytics}
            salesSeries={salesSeries}
            salesPeriod={salesPeriod}
            onSalesPeriodChange={changeSalesPeriod}
            setTab={setTab}
          />
        )}
        {tab === 'orders' && <OrdersPanel orders={orders} productMap={productMap} onUpdateStatus={updateOrderStatus} />}
        {tab === 'products' && <ProductsPanel products={products} onSaveProduct={saveProduct} onCreateVariant={createVariant} onUpdateVariant={updateVariant} onDeleteVariant={deleteVariant} onDeleteProduct={setProductToDelete} />}
        {tab === 'inventory' && <InventoryPanel inventory={inventory} inventoryForms={inventoryForms} setInventoryForms={setInventoryForms} onSaveInventory={saveInventory} productMap={productMap} />}
        {tab === 'audit' && <AuditPanel auditLogs={auditLogs} />}
        {tab === 'customers' && <CustomersPanel customers={customers} />}
        {tab === 'settings' && <SettingsPanel key={settings ? JSON.stringify(settings) : 'settings'} settings={settings} onSaveSettings={saveSettings} />}
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
