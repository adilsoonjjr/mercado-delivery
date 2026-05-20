import { CartProvider } from "@/contexts/CartContext";

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
