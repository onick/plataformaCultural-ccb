"""
Real-time Dashboard Manager
Handles WebSocket connections and real-time metric broadcasting
"""
import asyncio
import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import redis.asyncio as redis
import os

logger = logging.getLogger(__name__)

class DashboardManager:
    """
    Manages real-time dashboard connections and metric broadcasting
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.redis_client = None
        self.broadcast_task = None
        
    async def initialize(self):
        """Initialize Redis connection and start broadcasting"""
        try:
            redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
            self.redis_client = redis.from_url(redis_url)
            
            # Start broadcasting task
            self.broadcast_task = asyncio.create_task(self._broadcast_loop())
            
            logger.info("Dashboard manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize dashboard manager: {e}")
            raise

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            logger.info(f"New dashboard connection. Total: {len(self.active_connections)}")
            
            # Send initial metrics to new connection
            await self._send_initial_metrics(websocket)
            
        except Exception as e:
            logger.error(f"Failed to connect dashboard websocket: {e}")

    async def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        try:
            self.active_connections.remove(websocket)
            logger.info(f"Dashboard disconnected. Total: {len(self.active_connections)}")
        except ValueError:
            # Connection was already removed
            pass

    async def broadcast_metrics(self, metrics: Dict[str, Any]):
        """Broadcast metrics to all connected dashboards"""
        if not self.active_connections:
            return
            
        message = json.dumps({
            'type': 'metrics_update',
            'data': metrics,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Send to all connections
        disconnected = []
        for connection in self.active_connections[:]:  # Copy list to avoid iteration issues
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                disconnected.append(connection)
            except Exception as e:
                logger.error(f"Failed to send message to websocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            await self.disconnect(conn)

    async def _broadcast_loop(self):
        """Main broadcasting loop that sends metrics every 5 seconds"""
        while True:
            try:
                if self.active_connections:
                    metrics = await self._get_current_metrics()
                    await self.broadcast_metrics(metrics)
                
                await asyncio.sleep(5)  # Broadcast every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in broadcast loop: {e}")
                await asyncio.sleep(5)

    async def _send_initial_metrics(self, websocket: WebSocket):
        """Send initial metrics to newly connected dashboard"""
        try:
            metrics = await self._get_current_metrics()
            initial_message = json.dumps({
                'type': 'initial_metrics',
                'data': metrics,
                'timestamp': datetime.utcnow().isoformat()
            })
            await websocket.send_text(initial_message)
        except Exception as e:
            logger.error(f"Failed to send initial metrics: {e}")

    async def _get_current_metrics(self) -> Dict[str, Any]:
        """Get current metrics from Redis"""
        try:
            metrics = {}
            
            # Active users
            active_users = await self.redis_client.scard("active_users")
            metrics['active_users'] = active_users
            
            # Hourly event counters
            event_types = ['page_view', 'event_booking', 'user_registration', 'event_checkin']
            for event_type in event_types:
                counter_key = f"counter:{event_type}:hourly"
                count = await self.redis_client.get(counter_key)
                metrics[f'{event_type}_hourly'] = int(count) if count else 0
            
            # Performance metrics
            endpoints = ['events', 'reservations', 'login', 'register']
            performance_data = {}
            for endpoint in endpoints:
                perf_key = f"perf:{endpoint}"
                
                # Average response time
                times = await self.redis_client.lrange(f"{perf_key}:times", 0, -1)
                if times:
                    avg_time = sum(float(t) for t in times) / len(times)
                    performance_data[f'{endpoint}_avg_response'] = round(avg_time, 3)
                    performance_data[f'{endpoint}_max_response'] = round(max(float(t) for t in times), 3)
                    performance_data[f'{endpoint}_min_response'] = round(min(float(t) for t in times), 3)
                else:
                    performance_data[f'{endpoint}_avg_response'] = 0
                    performance_data[f'{endpoint}_max_response'] = 0
                    performance_data[f'{endpoint}_min_response'] = 0
                
                # Success rate
                total = await self.redis_client.get(f"{perf_key}:total")
                success = await self.redis_client.get(f"{perf_key}:success")
                if total and int(total) > 0:
                    success_rate = (int(success) if success else 0) / int(total) * 100
                    performance_data[f'{endpoint}_success_rate'] = round(success_rate, 2)
                else:
                    performance_data[f'{endpoint}_success_rate'] = 100
            
            metrics['performance'] = performance_data
            
            # System metrics
            system_metrics = await self._get_system_metrics()
            metrics['system'] = system_metrics
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get current metrics: {e}")
            return {}

    async def _get_system_metrics(self) -> Dict[str, Any]:
        """Get system performance metrics"""
        try:
            import psutil
            
            # CPU and Memory usage
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_used_gb': round(memory.used / (1024**3), 2),
                'memory_total_gb': round(memory.total / (1024**3), 2),
                'disk_percent': disk.percent,
                'disk_used_gb': round(disk.used / (1024**3), 2),
                'disk_total_gb': round(disk.total / (1024**3), 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get system metrics: {e}")
            return {}

    async def get_historical_data(self, metric_name: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Get historical data for charts"""
        try:
            # Get data from Redis (simplified approach)
            redis_key = f"metrics:realtime:{metric_name}"
            data = await self.redis_client.lrange(redis_key, 0, hours * 12)  # Assuming 5-minute intervals
            
            historical_data = []
            for item in data:
                try:
                    parsed_item = json.loads(item)
                    historical_data.append(parsed_item)
                except json.JSONDecodeError:
                    continue
            
            return historical_data
            
        except Exception as e:
            logger.error(f"Failed to get historical data: {e}")
            return []

    async def get_user_analytics(self) -> Dict[str, Any]:
        """Get user analytics data"""
        try:
            # This would typically query MongoDB for deeper analytics
            # For now, return Redis-based data
            
            analytics = {}
            
            # User registration trend (last 7 days)
            registration_data = []
            for i in range(7):
                day_key = f"counter:user_registration:day:{i}"
                count = await self.redis_client.get(day_key)
                registration_data.append({
                    'day': i,
                    'count': int(count) if count else 0
                })
            
            analytics['registration_trend'] = registration_data
            
            # Event booking trend
            booking_data = []
            for i in range(24):  # Last 24 hours
                hour_key = f"counter:event_booking:hour:{i}"
                count = await self.redis_client.get(hour_key)
                booking_data.append({
                    'hour': i,
                    'count': int(count) if count else 0
                })
            
            analytics['booking_trend'] = booking_data
            
            return analytics
            
        except Exception as e:
            logger.error(f"Failed to get user analytics: {e}")
            return {}

    async def cleanup(self):
        """Cleanup resources"""
        try:
            if self.broadcast_task:
                self.broadcast_task.cancel()
                
            if self.redis_client:
                await self.redis_client.close()
                
            # Close all WebSocket connections
            for connection in self.active_connections[:]:
                try:
                    await connection.close()
                except:
                    pass
            
            self.active_connections.clear()
            
        except Exception as e:
            logger.error(f"Failed to cleanup dashboard manager: {e}")


# Global dashboard manager instance
dashboard_manager = DashboardManager() 