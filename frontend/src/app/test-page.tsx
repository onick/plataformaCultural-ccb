'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Plataforma CCB - Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          Si puedes ver este mensaje, la aplicación está funcionando correctamente.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-green-600">✅ Next.js funcionando</p>
          <p className="text-sm text-green-600">✅ Tailwind CSS funcionando</p>
          <p className="text-sm text-green-600">✅ Componentes React funcionando</p>
        </div>
        <div className="mt-6">
          <a 
            href="/admin/analytics" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Ver Analytics Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}