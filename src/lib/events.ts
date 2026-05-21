type Handler = (data: string) => void;

// Scoped per marketId so admins only receive events for their own market
const adminSubscribers = new Map<string, { marketId: string; handler: Handler }>();

export function subscribeAdmin(id: string, marketId: string, handler: Handler) {
  adminSubscribers.set(id, { marketId, handler });
  return () => adminSubscribers.delete(id);
}

export function publishNewOrder(order: Record<string, unknown>) {
  const marketId = order.marketId as string | undefined;
  const msg = `data: ${JSON.stringify({ type: "NEW_ORDER", order })}\n\n`;
  adminSubscribers.forEach(({ marketId: subMarket, handler }) => {
    if (subMarket !== marketId) return;
    try { handler(msg); } catch { /* client gone */ }
  });
}

export function publishStatusUpdate(orderId: string, status: string, marketId: string) {
  const msg = `data: ${JSON.stringify({ type: "STATUS_UPDATE", orderId, status })}\n\n`;
  adminSubscribers.forEach(({ marketId: subMarket, handler }) => {
    if (subMarket !== marketId) return;
    try { handler(msg); } catch { /* client gone */ }
  });
}
