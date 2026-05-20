type Handler = (data: string) => void;

const adminSubscribers = new Map<string, Handler>();

export function subscribeAdmin(id: string, handler: Handler) {
  adminSubscribers.set(id, handler);
  return () => adminSubscribers.delete(id);
}

export function publishNewOrder(order: Record<string, unknown>) {
  const msg = `data: ${JSON.stringify({ type: "NEW_ORDER", order })}\n\n`;
  adminSubscribers.forEach((handler) => {
    try { handler(msg); } catch { /* client gone */ }
  });
}

export function publishStatusUpdate(orderId: string, status: string) {
  const msg = `data: ${JSON.stringify({ type: "STATUS_UPDATE", orderId, status })}\n\n`;
  adminSubscribers.forEach((handler) => {
    try { handler(msg); } catch { /* client gone */ }
  });
}
