"""
Real-time Analytics Tracking System
Tracks user events, performance metrics, and business KPIs
"""
import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
from functools import wraps
import logging
import redis.asyncio as redis
from pymongo import MongoClient
import os

# Configure logging
logger = logging.getLogger(__name__)

class RealTimeAnalytics:
    """
    Real-time analytics tracker that captures user events and business metrics
    """
    
    def __init__(self):
        self.redis_client = None
        self.mongo_client = None
        self.db = None
        
    async def initialize(self):
        """Initialize connections to Redis and MongoDB"""
        try:
            # Redis for real-time data
            redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
            self.redis_client = redis.from_url(redis_url)
            
            # MongoDB for historical data
            mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
            self.mongo_client = MongoClient(mongo_url)
            self.db = self.mongo_client.cultural_center_analytics
            
            logger.info("Analytics tracker initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize analytics tracker: {e}")
            raise

    async def track_user_event(self, user_id: str, event_type: str, metadata: Dict[str, Any]):
        """
        Track user interaction events
        
        Args:
            user_id: Unique user identifier
            event_type: Type of event (page_view, event_booking, etc.)
            metadata: Additional event data
        """
        try:
            event_data = {
                'user_id': user_id,
                'event_type': event_type,
                'timestamp': datetime.utcnow().isoformat(),
                'metadata': metadata
            }
            
            # Store in Redis for real-time access (TTL: 24 hours)
            redis_key = f"events:realtime:{event_type}"
            await self.redis_client.lpush(redis_key, json.dumps(event_data))
            await self.redis_client.expire(redis_key, 86400)  # 24 hours
            
            # Store in MongoDB for historical analysis
            self.db.user_events.insert_one(event_data)
            
            # Update live counters
            await self._update_live_counters(event_type, user_id)
            
        except Exception as e:
            logger.error(f"Failed to track user event: {e}")

    async def track_business_metric(self, metric_name: str, value: float, tags: Dict[str, str] = None):
        """
        Track business KPIs and metrics
        
        Args:
            metric_name: Name of the metric (revenue, bookings, etc.)
            value: Metric value
            tags: Additional tags for segmentation
        """
        try:
            metric_data = {
                'metric_name': metric_name,
                'value': value,
                'timestamp': datetime.utcnow().isoformat(),
                'tags': tags or {}
            }
            
            # Store in Redis for real-time dashboard
            redis_key = f"metrics:realtime:{metric_name}"
            await self.redis_client.lpush(redis_key, json.dumps(metric_data))
            await self.redis_client.expire(redis_key, 86400)
            
            # Store in MongoDB for analysis
            self.db.business_metrics.insert_one(metric_data)
            
        except Exception as e:
            logger.error(f"Failed to track business metric: {e}")

    async def track_performance_metric(self, endpoint: str, response_time: float, success: bool, user_id: str = None):
        """
        Track API performance metrics
        
        Args:
            endpoint: API endpoint name
            response_time: Response time in seconds
            success: Whether the request was successful
            user_id: Optional user ID for user-specific performance tracking
        """
        try:
            perf_data = {
                'endpoint': endpoint,
                'response_time': response_time,
                'success': success,
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Store in Redis for real-time monitoring
            redis_key = f"performance:realtime:{endpoint}"
            await self.redis_client.lpush(redis_key, json.dumps(perf_data))
            await self.redis_client.expire(redis_key, 3600)  # 1 hour
            
            # Store in MongoDB for analysis
            self.db.performance_metrics.insert_one(perf_data)
            
            # Update performance counters
            await self._update_performance_counters(endpoint, response_time, success)
            
        except Exception as e:
            logger.error(f"Failed to track performance metric: {e}")

    async def _update_live_counters(self, event_type: str, user_id: str):
        """Update live counters for real-time dashboard"""
        try:
            # Active users counter
            await self.redis_client.sadd("active_users", user_id)
            await self.redis_client.expire("active_users", 300)  # 5 minutes
            
            # Event type counters
            counter_key = f"counter:{event_type}:hourly"
            await self.redis_client.incr(counter_key)
            await self.redis_client.expire(counter_key, 3600)  # 1 hour
            
        except Exception as e:
            logger.error(f"Failed to update live counters: {e}")

    async def _update_performance_counters(self, endpoint: str, response_time: float, success: bool):
        """Update performance counters for monitoring"""
        try:
            # Average response time (using Redis for simplicity)
            perf_key = f"perf:{endpoint}"
            pipe = self.redis_client.pipeline()
            pipe.lpush(f"{perf_key}:times", response_time)
            pipe.ltrim(f"{perf_key}:times", 0, 99)  # Keep last 100 measurements
            pipe.incr(f"{perf_key}:total")
            pipe.incr(f"{perf_key}:success" if success else f"{perf_key}:errors")
            await pipe.execute()
            
        except Exception as e:
            logger.error(f"Failed to update performance counters: {e}")

    async def get_live_metrics(self) -> Dict[str, Any]:
        """Get current live metrics for dashboard"""
        try:
            metrics = {}
            
            # Active users
            active_users = await self.redis_client.scard("active_users")
            metrics['active_users'] = active_users
            
            # Event counters
            event_types = ['page_view', 'event_booking', 'user_registration', 'event_checkin']
            for event_type in event_types:
                counter_key = f"counter:{event_type}:hourly"
                count = await self.redis_client.get(counter_key)
                metrics[f'{event_type}_hourly'] = int(count) if count else 0
            
            # Performance metrics
            endpoints = ['events', 'reservations', 'login', 'register']
            for endpoint in endpoints:
                perf_key = f"perf:{endpoint}"
                times = await self.redis_client.lrange(f"{perf_key}:times", 0, -1)
                if times:
                    avg_time = sum(float(t) for t in times) / len(times)
                    metrics[f'{endpoint}_avg_response'] = round(avg_time, 3)
                else:
                    metrics[f'{endpoint}_avg_response'] = 0
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get live metrics: {e}")
            return {}

    async def get_user_behavior_data(self, user_id: str) -> Dict[str, Any]:
        """Get user behavior data for segmentation"""
        try:
            # Get user events from MongoDB
            events = list(self.db.user_events.find({'user_id': user_id}))
            
            # Calculate behavior metrics
            total_events = len(events)
            event_types = {}
            for event in events:
                event_type = event['event_type']
                event_types[event_type] = event_types.get(event_type, 0) + 1
            
            return {
                'user_id': user_id,
                'total_events': total_events,
                'event_types': event_types,
                'last_activity': events[-1]['timestamp'] if events else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get user behavior data: {e}")
            return {}


class PerformanceTracker:
    """
    Decorator and utilities for automatic performance tracking
    """
    
    def __init__(self, analytics: RealTimeAnalytics):
        self.analytics = analytics

    def track_endpoint_performance(self, endpoint_name: str = None):
        """
        Decorator to automatically track endpoint performance
        
        Usage:
            @performance_tracker.track_endpoint_performance("user_login")
            async def login_endpoint():
                # endpoint code
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                success = False
                user_id = None
                
                try:
                    # Try to extract user_id from kwargs
                    user_id = kwargs.get('user_id')
                    
                    result = await func(*args, **kwargs)
                    success = True
                    return result
                    
                except Exception as e:
                    success = False
                    raise e
                    
                finally:
                    end_time = time.time()
                    duration = end_time - start_time
                    
                    # Track performance
                    endpoint = endpoint_name or func.__name__
                    await self.analytics.track_performance_metric(
                        endpoint=endpoint,
                        response_time=duration,
                        success=success,
                        user_id=user_id
                    )
                    
            return wrapper
        return decorator


# Global analytics instance
analytics = RealTimeAnalytics()
performance_tracker = PerformanceTracker(analytics) 