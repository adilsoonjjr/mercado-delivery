import { CartProvider } from "@/contexts/CartContext";
import { PushPermissionBanner } from "@/components/PushPermissionBanner";

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <PushPermissionBanner />
    </CartProvider>
  );
}
