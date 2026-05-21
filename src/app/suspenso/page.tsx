export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Acesso suspenso</h1>
        <p className="text-sm text-gray-500">
          O período de teste ou a assinatura deste mercado expirou.
          Entre em contato com o suporte para reativar o acesso.
        </p>
        <a
          href="https://wa.me/5511999999999"
          className="block w-full bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 transition"
        >
          Falar com suporte
        </a>
      </div>
    </div>
  );
}
