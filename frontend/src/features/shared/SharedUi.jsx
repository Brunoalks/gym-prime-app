import { Check, ShoppingBag, X } from 'lucide-react';
import { Badge, Button, Dialog } from '../../components/ui.jsx';
import { formatCurrency } from './catalog.js';

export function BrandMark({ label = 'Gym Prime', tone = 'light' }) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#B6FF3B] text-xl font-black italic text-[#101214] shadow-[0_0_28px_rgba(182,255,59,0.28)]">
        ⚡
      </span>
      <span className={tone === 'dark' ? 'leading-none text-white' : 'leading-none text-[#101214]'}>
        <span className="block text-xl font-black uppercase italic tracking-normal">{label.split(' ')[0]}</span>
        <span className="block text-lg font-black uppercase italic tracking-normal text-[#B6FF3B]">{label.split(' ').slice(1).join(' ') || 'Prime'}</span>
      </span>
    </div>
  );
}

export function ProductImage({ product, className = '' }) {
  const canUseImage = product.image_url && !String(product.image_url).toLowerCase().endsWith('.svg');

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[#151719] text-slate-400 ${className}`}>
      {canUseImage ? (
        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,rgba(182,255,59,0.32),transparent_28%),linear-gradient(135deg,#23272b,#070808)]">
          <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-center text-white shadow-lg backdrop-blur">
            <ShoppingBag className="mx-auto text-[#B6FF3B]" size={30} />
            <strong className="mt-2 block max-w-28 truncate text-sm font-black">{product.name}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductDetailsModal({ product, onClose }) {
  return (
    <Dialog className="max-w-lg overflow-hidden p-0">
      <ProductImage product={product} className="aspect-[16/9]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#101214]">{product.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {product.description || 'Produto disponivel para pedido.'}
            </p>
          </div>
          {product.code && <Badge>{product.code}</Badge>}
        </div>
        {product.variants?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <Badge key={variant.id} variant="success">{variant.name}</Badge>
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center justify-between rounded-lg bg-[#101214] p-4 text-white">
          <span className="text-sm font-bold text-slate-300">A partir de</span>
          <strong className="text-2xl font-black">{formatCurrency(product.price)}</strong>
        </div>
        <Button className="mt-5 w-full" onClick={onClose}>Fechar</Button>
      </div>
    </Dialog>
  );
}

export function VariantPickerModal({ product, selectedVariantId, setSelectedVariantId, onCancel, onConfirm, large = false }) {
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const price = selectedVariant?.price || product.price;

  return (
    <Dialog className={large ? 'max-w-2xl p-7' : ''}>
      <Badge variant="success">Variante</Badge>
      <h2 className="mt-3 text-xl font-black text-[#101214]">{product.name}</h2>
      <p className="mt-1 text-sm text-slate-600">Escolha uma opcao antes de adicionar ao carrinho.</p>
      <div className={`mt-4 grid gap-2 ${large ? 'grid-cols-2' : ''}`}>
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
      <div className="mt-4 flex items-center justify-between rounded-lg bg-[#101214] p-4 text-white">
        <span className="text-sm font-bold text-slate-300">Total</span>
        <strong className="text-2xl font-black">{formatCurrency(price)}</strong>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onCancel}>Voltar</Button>
        <Button onClick={onConfirm}>Adicionar</Button>
      </div>
    </Dialog>
  );
}

export function OrderSuccessModal({ result, onClose, totem = false }) {
  return (
    <Dialog className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#B6FF3B] text-[#101214]">
        <Check size={24} />
      </div>
      <h2 className="mt-4 text-xl font-black text-[#101214]">Pedido #{result.order_id} criado</h2>
      <p className="mt-2 text-sm text-slate-600">
        {totem ? 'Pedido enviado. Avise a administracao para pagamento e retirada.' : 'O resumo esta pronto para envio pelo WhatsApp.'}
      </p>
      <div className="mt-4 rounded-lg bg-[#101214] p-4 text-white">
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

export function ErrorDialog({ message, onClose }) {
  return (
    <Dialog>
      <Badge variant="danger">Erro</Badge>
      <h2 className="mt-3 text-xl font-black text-[#101214]">Nao foi possivel concluir</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      <Button className="mt-5 w-full" onClick={onClose}>Entendi</Button>
    </Dialog>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', onCancel, onConfirm, danger = false }) {
  return (
    <Dialog>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant={danger ? 'danger' : 'success'}>{danger ? 'Atencao' : 'Confirmacao'}</Badge>
          <h2 className="mt-3 text-xl font-black text-[#101214]">{title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Fechar">
          <X size={18} />
        </Button>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onCancel}>Voltar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}
