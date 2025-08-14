'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          🏛️ Centro Cultural Banreservas
        </h1>
        <p className="text-gray-600 mb-6">
          Bienvenido a la plataforma CCB. La aplicación está funcionando correctamente.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">✅ Sistema Completo</h3>
            <p className="text-sm text-blue-600">Gestión de eventos, usuarios y reservas</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">📊 Analytics Nuevos</h3>
            <p className="text-sm text-green-600">Gráficos interactivos implementados</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <a 
            href="/auth/login" 
            className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
          >
            🔐 Iniciar Sesión
          </a>
          <a 
            href="/admin/analytics" 
            className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
          >
            📈 Ver Analytics Dashboard
          </a>
          <a 
            href="/events" 
            className="block w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
          >
            🎭 Ver Eventos
          </a>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>🚀 Plataforma CCB v2.0 - Analytics Habilitado</p>
        </div>
      </div>
    </div>
  );
}
