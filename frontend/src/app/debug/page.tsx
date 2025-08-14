'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { apiService } from '@/services/api';

interface SystemStatus {
  api_connection: boolean;
  backend_status: string;
  frontend_status: string;
  database_status: string;
  last_check: string;
}

export default function DebugPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api_connection: false,
    backend_status: 'checking',
    frontend_status: 'active',
    database_status: 'unknown',
    last_check: new Date().toISOString()
  });
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setTesting(true);
    const results = [];
    
    try {
      // Test API connection
      console.log('🔍 Testing API connection...');
      const eventsResponse = await apiService.getEvents();
      results.push({
        test: 'API Events Endpoint',
        status: 'success',
        message: `✅ Successfully loaded ${eventsResponse.length} events`,
        data: eventsResponse
      });
      
      setSystemStatus(prev => ({
        ...prev,
        api_connection: true,
        backend_status: 'online',
        last_check: new Date().toISOString()
      }));
      
    } catch (error) {
      results.push({
        test: 'API Events Endpoint',
        status: 'error',
        message: `❌ Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      });
      
      setSystemStatus(prev => ({
        ...prev,
        api_connection: false,
        backend_status: 'offline',
        last_check: new Date().toISOString()
      }));
    }

    // Test localStorage
    try {
      localStorage.setItem('debug_test', 'test_value');
      const testValue = localStorage.getItem('debug_test');
      if (testValue === 'test_value') {
        results.push({
          test: 'LocalStorage',
          status: 'success',
          message: '✅ LocalStorage working correctly'
        });
      } else {
        throw new Error('LocalStorage test failed');
      }
      localStorage.removeItem('debug_test');
    } catch (error) {
      results.push({
        test: 'LocalStorage',
        status: 'error',
        message: `❌ LocalStorage error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test network connectivity
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      results.push({
        test: 'Network Connectivity',
        status: 'success',
        message: '✅ Network connectivity OK'
      });
    } catch (error) {
      results.push({
        test: 'Network Connectivity',
        status: 'warning',
        message: `⚠️ Network connectivity test failed (expected for external APIs)`
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  const runManualTest = async () => {
          if (typeof window !== 'undefined' && window.logError) {
        window.logError('Manual test error', 'Debug page test', {
        test: 'manual_trigger',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    }
  };

  const clearConsole = () => {
    console.clear();
    console.log('🧹 Console cleared by user');
  };

  const exportLogs = () => {
    const logs = {
      system_status: systemStatus,
      test_results: testResults,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
              url: typeof window !== 'undefined' ? window.location.href : 'server'
    };
    
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ccb-debug-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!mounted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sistema de Debug</h1>
        <p className="text-gray-600">
          Información técnica y diagnóstico del sistema CCB Platform
        </p>
      </div>

      {/* System Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span>Conexión API:</span>
              <Badge variant={systemStatus.api_connection ? "default" : "destructive"}>
                {systemStatus.api_connection ? (
                  <><Wifi className="h-3 w-3 mr-1" /> Online</>
                ) : (
                  <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Backend:</span>
              <Badge variant={systemStatus.backend_status === 'online' ? "default" : "destructive"}>
                {systemStatus.backend_status === 'online' ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Online</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> {systemStatus.backend_status}</>
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Frontend:</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" /> Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Última verificación:</span>
              <span className="text-sm text-gray-500">
                {new Date(systemStatus.last_check).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Resultados de Pruebas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.test}</span>
                  <Badge variant={
                    result.status === 'success' ? 'default' : 
                    result.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{result.message}</p>
                {result.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500">
                      Ver detalles del error
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button 
          onClick={checkSystemStatus} 
          disabled={testing}
          variant="default"
        >
          {testing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Verificar Sistema
        </Button>
        
        <Button 
          onClick={runManualTest}
          variant="outline"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Probar Error Logger
        </Button>
        
        <Button 
          onClick={clearConsole}
          variant="outline"
        >
          Limpiar Consola
        </Button>
        
        <Button 
          onClick={exportLogs}
          variant="outline"
        >
          Exportar Logs
        </Button>
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Entorno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User Agent:</strong>
              <p className="text-gray-600 break-all">{navigator.userAgent}</p>
            </div>
            <div>
              <strong>URL Actual:</strong>
                              <p className="text-gray-600 break-all">{typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
            </div>
            <div>
              <strong>Timestamp:</strong>
              <p className="text-gray-600">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <strong>Zona Horaria:</strong>
              <p className="text-gray-600">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}