import { Check, CheckCircle2, Flame, ShoppingBag, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../components/classNames.js';
import { Badge, Button, Dialog, ModalActions } from '../../components/ui.jsx';
import gymPrimeLogo from '../../assets/gym-prime-logo.svg';
import { formatCurrency } from './catalog.js';

export function BrandMark({ label = 'Gym Prime', tone = 'light' }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const fallbackTextClass = tone === 'dark' ? 'text-gp-text-primary' : 'text-gp-text-inverse';

  return (
    <div className="flex min-h-11 min-w-0 items-center">
      {!logoFailed ? (
        <img
          src={gymPrimeLogo}
          alt={label || 'Gym Prime'}
          className="block h-auto max-h-12 w-auto max-w-[9.5rem] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)] sm:max-h-14 sm:max-w-[11.5rem]"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-gp bg-[linear-gradient(135deg,var(--gp-lime),#8FEA1E)] text-gp-text-inverse shadow-gp-glow">
            <Zap size={24} strokeWidth={3} />
          </span>
          <span className={cn('min-w-0 leading-none', fallbackTextClass)}>
            <span className="block truncate text-xl font-gp-black uppercase italic tracking-normal">{label.split(' ')[0]}</span>
            <span className="block truncate text-lg font-gp-black uppercase italic tracking-normal text-gp-lime">{label.split(' ').slice(1).join(' ') || 'Prime'}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export function ProductImage({ product, className = '' }) {
  const canUseImage = product.image_url && !String(product.image_url).toLowerCase().endsWith('.svg');

  return (
    <div className={`gp-product-image relative flex items-center justify-center overflow-hidden text-gp-text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] ${className}`}>
      {canUseImage ? (
        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="rounded-gp border border-gp-border-inverse bg-white/[0.075] px-3 py-2.5 text-center text-gp-text-primary shadow-gp-sm backdrop-blur">
            <ShoppingBag className="mx-auto text-gp-lime" size={26} />
            <strong className="mt-2 block max-w-24 truncate text-gp-xs font-gp-black">{product.name}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductPromoBadge({ children = 'Popular', showIcon = false, className = '' }) {
  return (
    <Badge className={cn('border border-amber-300/60 shadow-gp-sm', className)} variant="warning">
      {showIcon && <Flame size={13} />}
      {children}
    </Badge>
  );
}

export function ProductStockBadge({ showIcon = false, className = '' }) {
  return (
    <Badge className={cn('border border-emerald-300/70 shadow-gp-sm', className)} variant="success">
      {showIcon && <CheckCircle2 size={13} />}
      Em estoque
    </Badge>
  );
}

export function PriceSummary({
  label = 'Total',
  value,
  className = '',
  labelClassName = 'text-gp-text-secondary',
  valueClassName = 'text-2xl',
  stacked = false,
}) {
  const formattedValue = typeof value === 'string' ? value : formatCurrency(value);

  return (
    <div className={cn('gp-price-summary min-w-0 rounded-gp p-4 text-gp-text-primary shadow-gp-sm ring-1 ring-white/5', className)}>
      <div className={stacked ? 'min-w-0' : 'flex min-w-0 items-center justify-between gap-3'}>
        <span className={cn('text-gp-sm font-gp-bold', labelClassName)}>{label}</span>
        <strong className={cn(stacked ? 'mt-1 block' : 'shrink-0', 'font-gp-black', valueClassName)}>{formattedValue}</strong>
      </div>
    </div>
  );
}

export function ProductDetailsModal({ product, onClose }) {
  return (
    <Dialog className="max-w-lg overflow-x-hidden p-0">
      <ProductImage product={product} className="aspect-[16/9]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-gp-black text-gp-text-inverse">{product.name}</h2>
            <p className="mt-2 text-gp-sm leading-6 text-slate-700">
              {product.description || 'Produto disponível para pedido.'}
            </p>
          </div>
          {product.code && <Badge className="max-w-32 shrink-0 truncate">{product.code}</Badge>}
        </div>
        {product.variants?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <Badge key={variant.id} variant="success">{variant.name}</Badge>
            ))}
          </div>
        )}
        <PriceSummary className="mt-5" label="A partir de" value={product.price} />
        <Button className="mt-5 w-full" onClick={onClose}>Fechar</Button>
      </div>
    </Dialog>
  );
}

export function VariantPickerModal({ product, selectedVariantId, setSelectedVariantId, onCancel, onConfirm, large = false }) {
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const price = selectedVariant?.price || product.price;

  return (
    <Dialog className={large ? 'max-w-2xl p-5 sm:p-7' : 'max-h-[calc(100dvh-1rem)] rounded-t-gp p-5 sm:rounded-gp'}>
      <Badge variant="success">Variante</Badge>
      <h2 className="mt-3 break-words text-xl font-gp-black text-gp-text-inverse">{product.name}</h2>
      <p className="mt-1 text-gp-sm text-slate-700">Escolha uma opção antes de adicionar ao carrinho.</p>
      <div className={`gp-scrollbar-soft mt-4 grid max-h-[42dvh] gap-2 overflow-y-auto pr-1 ${large ? 'sm:max-h-[48dvh] sm:grid-cols-2' : ''}`}>
        {product.variants.map((variant) => (
          <Button
            key={variant.id}
            variant={variant.id === selectedVariantId ? 'dark' : 'secondary'}
            onClick={() => setSelectedVariantId(variant.id)}
            className="justify-between"
          >
            <span className="min-w-0 truncate">{variant.name}</span>
            <strong>{formatCurrency(variant.price || product.price)}</strong>
          </Button>
        ))}
      </div>
      <PriceSummary className="mt-4" value={price} />
      <ModalActions>
        <Button variant="secondary" onClick={onCancel}>Voltar</Button>
        <Button className="gp-primary-cta" onClick={onConfirm}>Adicionar</Button>
      </ModalActions>
    </Dialog>
  );
}

export function OrderSuccessModal({ result, onClose, totem = false }) {
  return (
    <Dialog className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-gp bg-gp-lime text-gp-text-inverse">
        <Check size={24} />
      </div>
      <h2 className="mt-4 text-xl font-gp-black text-gp-text-inverse">Pedido #{result.order_id} criado</h2>
      <p className="mt-2 text-gp-sm text-slate-700">
        {totem ? 'Pedido enviado. Avise a administração para pagamento e retirada.' : 'O resumo está pronto para envio pelo WhatsApp.'}
      </p>
      {totem && <p className="mt-2 text-gp-xs font-gp-black uppercase text-slate-600">Retorno automático ao cardápio</p>}
      <PriceSummary className="mt-4" value={result.total_amount} stacked />
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
        <Button onClick={() => window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer')}>
          WhatsApp
        </Button>
      </ModalActions>
    </Dialog>
  );
}

export function ErrorDialog({ message, onClose }) {
  return (
    <Dialog>
      <Badge variant="danger">Erro</Badge>
      <h2 className="mt-3 text-xl font-gp-black text-gp-text-inverse">Não foi possível concluir</h2>
      <p className="mt-2 text-gp-sm leading-6 text-slate-700">{message}</p>
      <Button className="mt-5 w-full" onClick={onClose}>Entendi</Button>
    </Dialog>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', onCancel, onConfirm, danger = false }) {
  return (
    <Dialog>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant={danger ? 'danger' : 'success'}>{danger ? 'Atenção' : 'Confirmação'}</Badge>
          <h2 className="mt-3 text-xl font-gp-black text-gp-text-inverse">{title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Fechar">
          <X size={18} />
        </Button>
      </div>
      <p className="mt-2 text-gp-sm leading-6 text-slate-700">{message}</p>
      <ModalActions>
        <Button variant="secondary" onClick={onCancel}>Voltar</Button>
        <Button className={danger ? '' : 'gp-primary-cta'} variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </ModalActions>
    </Dialog>
  );
}
