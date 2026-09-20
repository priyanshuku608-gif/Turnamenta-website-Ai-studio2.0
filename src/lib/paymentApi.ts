// Payment Gateway Client API
// Interfaces and single-path relay requests

export interface CreatePaymentResponse {
  success: boolean;
  message?: string;
  amount?: string | number;
  uniqueid?: string;
  transactionid?: string;
  payment_url?: string;
  created_at?: string;
  expires_at?: string;
  status?: string;
}

export interface CheckPaymentStatusResponse {
  success: boolean;
  message?: string;
  amount?: string | number;
  uniqueid?: string;
  transactionid?: string;
  provider_transaction_id?: string;
  utr?: string;
  payment_url?: string;
  status?: 'pending' | 'success' | 'expired' | 'failed' | string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

/**
 * Initiate an instant payment via the server-side relay
 */
export async function apiCreatePayment(amount: number, uniqueid: string): Promise<CreatePaymentResponse> {
  const res = await fetch(`/api/create-payment?amount=${encodeURIComponent(amount)}&uniqueid=${encodeURIComponent(uniqueid)}`);
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    try {
      const parsed = JSON.parse(errorText);
      return parsed;
    } catch {
      throw new Error(`Server returned error status ${res.status}: ${errorText || 'Gateway unreachable'}`);
    }
  }

  const data: CreatePaymentResponse = await res.json();
  return data;
}

/**
 * Check payment status via the server-side relay
 */
export async function apiCheckPaymentStatus(uniqueid: string): Promise<CheckPaymentStatusResponse> {
  const res = await fetch(`/api/check-status?uniqueid=${encodeURIComponent(uniqueid)}`);
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    try {
      const parsed = JSON.parse(errorText);
      return parsed;
    } catch {
      throw new Error(`Server returned error status ${res.status}: ${errorText || 'Status check failed'}`);
    }
  }

  const data: CheckPaymentStatusResponse = await res.json();
  return data;
}
