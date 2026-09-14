import Swal from 'sweetalert2';
import { notifyPortfolioChanged } from '../utils/realtimeSync';

export async function confirmDelete(title = 'Delete?', text = 'This action cannot be undone.') {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: 'var(--soft-strong)',
    confirmButtonText: 'Delete',
    background: 'var(--elevated)',
    color: 'var(--primary)',
  });
  return result.isConfirmed;
}

export function notifyChanged() {
  notifyPortfolioChanged();
}
