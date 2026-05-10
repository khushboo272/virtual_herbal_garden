// ──────────────────────────────────────────────────────────
// ConfirmModal — reusable confirmation dialog (PRD §5.4)
// Supports: danger / warning / primary variants
// Optional type-to-confirm for destructive actions
// ──────────────────────────────────────────────────────────

import { useState } from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../ui/utils';

export type ConfirmVariant = 'primary' | 'warning' | 'danger';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If set, user must type this exact string to enable the confirm button */
  typeToConfirm?: string;
  /** Additional message shown when typeToConfirm is active */
  typeToConfirmHint?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: typeof Info;
  iconClass: string;
  buttonClass: string;
}> = {
  primary: {
    icon: Info,
    iconClass: 'text-green-600 bg-green-100',
    buttonClass: 'bg-green-600 hover:bg-green-700',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 bg-amber-100',
    buttonClass: 'bg-amber-600 hover:bg-amber-700',
  },
  danger: {
    icon: ShieldAlert,
    iconClass: 'text-red-600 bg-red-100',
    buttonClass: 'bg-red-600 hover:bg-red-700',
  },
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  variant = 'primary',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  typeToConfirm,
  typeToConfirmHint,
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const canConfirm = typeToConfirm ? typed === typeToConfirm : true;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm();
    setTyped('');
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setTyped('');
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.iconClass)}>
              <Icon className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg text-gray-900">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">{description}</DialogDescription>
        </DialogHeader>

        {typeToConfirm && (
          <div className="space-y-2 py-2">
            <Label className="text-sm text-gray-700">
              {typeToConfirmHint || `Type "${typeToConfirm}" to confirm:`}
            </Label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typeToConfirm}
              className="font-mono"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            className={config.buttonClass}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
