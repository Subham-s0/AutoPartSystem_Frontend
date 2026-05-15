import { ArrowLeft } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  KhaltiCheckoutPanel,
  type KhaltiCheckoutSummary,
} from '@/features/payments/components/khalti-checkout-panel'

interface KhaltiCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  summary: KhaltiCheckoutSummary
  onPay: (amount: number) => Promise<void>
}

export function KhaltiCheckoutDialog({
  open,
  onOpenChange,
  title,
  description,
  summary,
  onPay,
}: KhaltiCheckoutDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="!max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <KhaltiCheckoutPanel onPay={onPay} summary={summary} />

        <DialogFooter>
          <DialogClose asChild>
            <button className="tb-btn" type="button">
              <ArrowLeft size={14} />
              Cancel
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
