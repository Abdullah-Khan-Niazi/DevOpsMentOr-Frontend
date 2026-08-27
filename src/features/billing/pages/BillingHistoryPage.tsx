import { useState } from 'react';
import { Button, PageHeader, Pagination } from '@/shared/components';
import { useInvoiceDownload, useOrders } from '../hooks/useBilling';
import { ROUTES } from '@/shared/constants';
import { Link } from 'react-router-dom';
import type { OrderStatus } from '../types';
import './history.css';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

function formatMoney(value: number, currency: string): string {
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function InvoiceDownloadButton({ invoiceId }: { invoiceId: number }) {
  const download = useInvoiceDownload();
  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={download.isPending}
      onClick={() =>
        download.mutate(invoiceId, {
          onSuccess: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
        })
      }
    >
      Download
    </Button>
  );
}

/** SCR-F9-04: order history (BIL-10) with per-row invoice download (BIL-12). */
export function BillingHistoryPage() {
  const [page, setPage] = useState(1);
  const orders = useOrders(page, 20);
  const orderItems = orders.data?.items ?? [];

  return (
    <div className="history-page">
      <PageHeader
        title="Billing history"
        description="Orders, receipts and invoices for your account."
        actions={
          <Link to={ROUTES.BILLING}>
            <Button variant="ghost" size="sm">
              Back to billing
            </Button>
          </Link>
        }
      />

      {orders.isLoading ? <p className="history-page__hint">Loading…</p> : null}
      {orders.isError ? <p className="history-page__hint">Could not load history.</p> : null}
      {!orders.isLoading && !orders.isError && orderItems.length === 0 ? (
        <p className="history-page__hint">Nothing here yet.</p>
      ) : null}

      {orderItems.length > 0 ? (
        <table className="history-page__table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((order) => (
              <tr key={order.orderId}>
                <td>{order.orderNumber}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{formatMoney(order.finalAmount, order.currency)}</td>
                <td>{ORDER_STATUS_LABELS[order.status]}</td>
                <td>
                  {order.invoiceId ? <InvoiceDownloadButton invoiceId={order.invoiceId} /> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {orders.data && orders.data.total > orders.data.limit ? (
        <Pagination
          page={orders.data.page}
          pageSize={orders.data.limit}
          total={orders.data.total}
          totalPages={Math.ceil(orders.data.total / orders.data.limit)}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

export default BillingHistoryPage;
