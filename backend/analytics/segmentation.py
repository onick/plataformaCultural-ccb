"""
User Segmentation System
Uses machine learning to segment users based on behavior patterns
"""
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from pymongo import MongoClient
import os
import pickle

logger = logging.getLogger(__name__)

class UserSegmentation:
    """
    ML-based user segmentation system
    Analyzes user behavior to create meaningful segments
    """
    
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.analytics_db = None
        self.scaler = StandardScaler()
        self.pca = None  # Will be initialized dynamically
        self.kmeans = None  # Will be initialized dynamically
        self.is_trained = False
        self.min_users_for_ml = 5  # Minimum users needed for meaningful clustering
        
    async def initialize(self):
        """Initialize database connections"""
        try:
            mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
            self.mongo_client = MongoClient(mongo_url)
            self.db = self.mongo_client.cultural_center
            self.analytics_db = self.mongo_client.cultural_center_analytics
            
            logger.info("User segmentation system initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize segmentation system: {e}")
            raise

    async def extract_user_features(self, days_back: int = 30) -> pd.DataFrame:
        """
        Extract features for user segmentation
        
        Args:
            days_back: Number of days to look back for feature extraction
            
        Returns:
            DataFrame with user features
        """
        try:
            # Get users
            users = list(self.db.users.find({}))
            
            # Get user events from analytics
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            user_events = list(self.analytics_db.user_events.find({
                'timestamp': {'$gte': cutoff_date.isoformat()}
            }))
            
            # Get reservations
            reservations = list(self.db.reservations.find({
                'created_at': {'$gte': cutoff_date.isoformat()}
            }))
            
            # Get events
            events = list(self.db.events.find({}))
            events_dict = {event['id']: event for event in events}
            
            # Process user data
            user_features = []
            
            for user in users:
                user_id = user['id']
                
                # Basic user info
                features = {
                    'user_id': user_id,
                    'age': user.get('age', 25),
                    'days_since_registration': self._days_since_registration(user.get('created_at')),
                }
                
                # Event interaction features
                user_event_data = [e for e in user_events if e['user_id'] == user_id]
                features.update(self._extract_event_features(user_event_data))
                
                # Reservation features
                user_reservations = [r for r in reservations if r['user_id'] == user_id]
                features.update(self._extract_reservation_features(user_reservations, events_dict))
                
                user_features.append(features)
            
            # Convert to DataFrame
            df = pd.DataFrame(user_features)
            
            # Fill missing values
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            df[numeric_columns] = df[numeric_columns].fillna(0)
            
            logger.info(f"Extracted features for {len(df)} users")
            return df
            
        except Exception as e:
            logger.error(f"Failed to extract user features: {e}")
            return pd.DataFrame()

    def _extract_event_features(self, user_events: List[Dict]) -> Dict[str, Any]:
        """Extract features from user events"""
        features = {
            'total_events': len(user_events),
            'unique_sessions': len(set(e.get('session_id', 'default') for e in user_events)),
            'page_views': sum(1 for e in user_events if e['event_type'] == 'page_view'),
            'event_bookings': sum(1 for e in user_events if e['event_type'] == 'event_booking'),
            'checkins': sum(1 for e in user_events if e['event_type'] == 'event_checkin'),
        }
        
        # Time-based features
        if user_events:
            timestamps = [datetime.fromisoformat(e['timestamp'].replace('Z', '+00:00')) for e in user_events]
            features['days_active'] = (max(timestamps) - min(timestamps)).days + 1
            features['avg_events_per_day'] = len(user_events) / max(features['days_active'], 1)
            
            # Time of day preferences
            hours = [t.hour for t in timestamps]
            features['prefers_morning'] = sum(1 for h in hours if 6 <= h < 12) / len(hours)
            features['prefers_afternoon'] = sum(1 for h in hours if 12 <= h < 18) / len(hours)
            features['prefers_evening'] = sum(1 for h in hours if 18 <= h < 24) / len(hours)
        else:
            features.update({
                'days_active': 0,
                'avg_events_per_day': 0,
                'prefers_morning': 0,
                'prefers_afternoon': 0,
                'prefers_evening': 0
            })
        
        return features

    def _extract_reservation_features(self, reservations: List[Dict], events_dict: Dict) -> Dict[str, Any]:
        """Extract features from user reservations"""
        features = {
            'total_reservations': len(reservations),
            'confirmed_reservations': sum(1 for r in reservations if r['status'] == 'confirmed'),
            'checked_in_reservations': sum(1 for r in reservations if r['status'] == 'checked_in'),
            'cancelled_reservations': sum(1 for r in reservations if r['status'] == 'cancelled'),
        }
        
        # Calculate success rate
        if features['total_reservations'] > 0:
            features['checkin_rate'] = features['checked_in_reservations'] / features['total_reservations']
            features['cancellation_rate'] = features['cancelled_reservations'] / features['total_reservations']
        else:
            features['checkin_rate'] = 0
            features['cancellation_rate'] = 0
        
        # Category preferences
        categories = {}
        for reservation in reservations:
            event_id = reservation['event_id']
            if event_id in events_dict:
                category = events_dict[event_id]['category']
                categories[category] = categories.get(category, 0) + 1
        
        # Convert to preferences (most common category gets highest score)
        total_reservations = len(reservations)
        if total_reservations > 0:
            for category in ['Dominican Cinema', 'Classic Cinema', 'General Cinema', 'Workshops', 
                           'Concerts', 'Talks/Conferences', 'Art Exhibitions', '3D Immersive Experiences']:
                features[f'prefers_{category.lower().replace(" ", "_").replace("/", "_")}'] = \
                    categories.get(category, 0) / total_reservations
        else:
            for category in ['Dominican Cinema', 'Classic Cinema', 'General Cinema', 'Workshops',
                           'Concerts', 'Talks/Conferences', 'Art Exhibitions', '3D Immersive Experiences']:
                features[f'prefers_{category.lower().replace(" ", "_").replace("/", "_")}'] = 0
        
        return features

    def _days_since_registration(self, created_at: str) -> int:
        """Calculate days since user registration"""
        try:
            if created_at:
                reg_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                return (datetime.utcnow() - reg_date).days
        except:
            pass
        return 30  # Default value

    async def train_segmentation_model(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Train the segmentation model on user data with dynamic clustering
        
        Args:
            days_back: Number of days to look back for training data
            
        Returns:
            Training results and model performance metrics
        """
        try:
            # Extract features
            df = await self.extract_user_features(days_back)
            
            if df.empty:
                raise ValueError("No user data available for training")
            
            num_users = len(df)
            logger.info(f"Training with {num_users} users")
            
            # Check if we have enough users for meaningful ML
            if num_users < self.min_users_for_ml:
                logger.warning(f"Only {num_users} users available. Using simple statistical segmentation.")
                return await self._simple_statistical_segmentation(df)
            
            # Prepare features for ML
            feature_columns = [col for col in df.columns if col != 'user_id']
            X = df[feature_columns].copy()
            
            # Validate feature matrix
            if X.shape[1] == 0:
                raise ValueError("No features available for training")
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Dynamic PCA components (max 3 or number of features, whichever is smaller)
            n_components = min(3, X.shape[1], X.shape[0] - 1)
            if n_components < 1:
                n_components = 1
                
            self.pca = PCA(n_components=n_components)
            X_pca = self.pca.fit_transform(X_scaled)
            
            # Dynamic number of clusters based on data size
            # Rule: max clusters = sqrt(n_users), min = 2, max = 5
            optimal_clusters = max(2, min(5, int(np.sqrt(num_users))))
            
            logger.info(f"Using {optimal_clusters} clusters for {num_users} users")
            
            # Initialize KMeans with optimal clusters
            self.kmeans = KMeans(n_clusters=optimal_clusters, random_state=42, n_init=10)
            
            # Fit K-means
            self.kmeans.fit(X_pca)
            
            # Get cluster assignments
            cluster_labels = self.kmeans.labels_
            df['cluster'] = cluster_labels
            
            # Calculate cluster characteristics
            cluster_analysis = self._analyze_clusters(df)
            
            # Save model
            await self._save_model()
            
            self.is_trained = True
            
            results = {
                'num_users': len(df),
                'num_features': len(feature_columns),
                'num_clusters': len(set(cluster_labels)),
                'optimal_clusters': optimal_clusters,
                'pca_components': n_components,
                'cluster_analysis': cluster_analysis,
                'silhouette_score': self._calculate_silhouette_score(X_pca, cluster_labels),
                'model_type': 'ml_clustering'
            }
            
            logger.info(f"Segmentation model trained successfully: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to train segmentation model: {e}")
            raise

    def _analyze_clusters(self, df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Analyze cluster characteristics and assign meaningful names"""
        try:
            cluster_analysis = {}
            
            for cluster_id in df['cluster'].unique():
                cluster_data = df[df['cluster'] == cluster_id]
                
                # Calculate cluster characteristics
                characteristics = {
                    'size': len(cluster_data),
                    'percentage': len(cluster_data) / len(df) * 100,
                    'avg_age': cluster_data['age'].mean(),
                    'avg_reservations': cluster_data['total_reservations'].mean(),
                    'avg_checkin_rate': cluster_data['checkin_rate'].mean(),
                    'avg_events_per_day': cluster_data['avg_events_per_day'].mean(),
                    'avg_days_since_registration': cluster_data['days_since_registration'].mean()
                }
                
                # Determine cluster name based on characteristics
                name = self._determine_cluster_name(characteristics, cluster_data)
                
                cluster_analysis[name] = characteristics
                cluster_analysis[name]['cluster_id'] = int(cluster_id)
            
            return cluster_analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze clusters: {e}")
            return {}

    def _determine_cluster_name(self, characteristics: Dict, cluster_data: pd.DataFrame) -> str:
        """Determine meaningful name for cluster based on characteristics"""
        try:
            # High-value users: High reservations, high check-in rate
            if (characteristics['avg_reservations'] > 3 and 
                characteristics['avg_checkin_rate'] > 0.8):
                return "VIP Members"
            
            # Regular attendees: Moderate reservations, good check-in rate
            elif (characteristics['avg_reservations'] > 1 and 
                  characteristics['avg_checkin_rate'] > 0.6):
                return "Regular Attendees"
            
            # New users: Recently registered, low activity
            elif characteristics['avg_days_since_registration'] < 7:
                return "New Users"
            
            # Browsers: High page views, low reservations
            elif (cluster_data['page_views'].mean() > cluster_data['total_reservations'].mean() * 3):
                return "Browsers"
            
            # At-risk: Old users, low recent activity
            elif (characteristics['avg_days_since_registration'] > 30 and 
                  characteristics['avg_events_per_day'] < 0.1):
                return "At Risk"
            
            else:
                return f"Segment {characteristics.get('cluster_id', 0)}"
                
        except Exception as e:
            logger.error(f"Failed to determine cluster name: {e}")
            return "Unknown Segment"

    def _calculate_silhouette_score(self, X: np.ndarray, labels: np.ndarray) -> float:
        """Calculate silhouette score for cluster quality"""
        try:
            from sklearn.metrics import silhouette_score
            return silhouette_score(X, labels)
        except:
            return 0.0

    async def segment_user(self, user_id: str) -> Dict[str, Any]:
        """
        Segment a specific user
        
        Args:
            user_id: User ID to segment
            
        Returns:
            User segment information
        """
        try:
            if not self.is_trained:
                await self.train_segmentation_model()
            
            # Extract features for this user
            df = await self.extract_user_features()
            user_data = df[df['user_id'] == user_id]
            
            if user_data.empty:
                return {'segment': 'Unknown', 'confidence': 0.0}
            
            # Prepare features
            feature_columns = [col for col in df.columns if col != 'user_id']
            X = user_data[feature_columns].values
            
            # Transform and predict
            X_scaled = self.scaler.transform(X)
            X_pca = self.pca.transform(X_scaled)
            
            cluster = self.kmeans.predict(X_pca)[0]
            
            # Get cluster name (would need cluster analysis data)
            # For now, return cluster number
            segment = f"Segment {cluster}"
            
            # Calculate confidence based on distance to cluster center
            distance = np.linalg.norm(X_pca[0] - self.kmeans.cluster_centers_[cluster])
            confidence = max(0.0, 1.0 - distance / 2.0)  # Normalize distance
            
            return {
                'user_id': user_id,
                'segment': segment,
                'cluster_id': int(cluster),
                'confidence': round(confidence, 3)
            }
            
        except Exception as e:
            logger.error(f"Failed to segment user {user_id}: {e}")
            return {'segment': 'Unknown', 'confidence': 0.0}

    async def get_segment_analytics(self) -> Dict[str, Any]:
        """Get analytics for all user segments"""
        try:
            if not self.is_trained:
                await self.train_segmentation_model()
            
            df = await self.extract_user_features()
            
            if df.empty:
                return {}
            
            # Get predictions for all users
            feature_columns = [col for col in df.columns if col != 'user_id']
            X = df[feature_columns].values
            X_scaled = self.scaler.transform(X)
            X_pca = self.pca.transform(X_scaled)
            clusters = self.kmeans.predict(X_pca)
            
            df['cluster'] = clusters
            
            # Analyze segments
            segment_analytics = {}
            for cluster_id in df['cluster'].unique():
                cluster_data = df[df['cluster'] == cluster_id]
                
                segment_analytics[f"Segment {cluster_id}"] = {
                    'user_count': len(cluster_data),
                    'percentage': len(cluster_data) / len(df) * 100,
                    'avg_reservations': cluster_data['total_reservations'].mean(),
                    'avg_checkin_rate': cluster_data['checkin_rate'].mean(),
                    'top_users': cluster_data.nlargest(5, 'total_reservations')['user_id'].tolist()
                }
            
            return segment_analytics
            
        except Exception as e:
            logger.error(f"Failed to get segment analytics: {e}")
            return {}

    async def _save_model(self):
        """Save trained model to file"""
        try:
            model_data = {
                'scaler': self.scaler,
                'pca': self.pca,
                'kmeans': self.kmeans,
                'trained_at': datetime.utcnow().isoformat()
            }
            
            with open('models/user_segmentation.pkl', 'wb') as f:
                pickle.dump(model_data, f)
                
        except Exception as e:
            logger.error(f"Failed to save model: {e}")

    async def load_model(self):
        """Load trained model from file"""
        try:
            with open('models/user_segmentation.pkl', 'rb') as f:
                model_data = pickle.load(f)
                
            self.scaler = model_data['scaler']
            self.pca = model_data['pca']
            self.kmeans = model_data['kmeans']
            self.is_trained = True
            
            logger.info("Segmentation model loaded successfully")
            
        except FileNotFoundError:
            logger.info("No saved model found, will train new model")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
    
    async def _simple_statistical_segmentation(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Simple statistical segmentation for small datasets
        Uses percentiles and business rules instead of ML clustering
        """
        try:
            logger.info("Applying statistical segmentation for small dataset")
            
            # Calculate engagement score for each user
            df['engagement_score'] = (
                df.get('total_reservations', pd.Series([0])).fillna(0) * 0.4 +
                df.get('total_events_attended', pd.Series([0])).fillna(0) * 0.6
            )
            
            # Simple segmentation based on engagement
            num_users = len(df)
            if num_users == 1:
                df['cluster'] = 0
                segments = ['Solo Usuario']
            elif num_users == 2:
                df['cluster'] = [0, 1]
                segments = ['Usuario Nuevo', 'Usuario Activo']
            else:
                # Use percentiles for 3-4 users
                engagement_scores = df['engagement_score'].values
                q33 = np.percentile(engagement_scores, 33)
                q66 = np.percentile(engagement_scores, 66)
                
                def assign_cluster(score):
                    if score <= q33:
                        return 0  # Low engagement
                    elif score <= q66:
                        return 1  # Medium engagement
                    else:
                        return 2  # High engagement
                
                df['cluster'] = df['engagement_score'].apply(assign_cluster)
                segments = ['Engagement Bajo', 'Engagement Medio', 'Engagement Alto']
            
            # Analyze statistical segments
            cluster_analysis = {}
            for cluster_id in df['cluster'].unique():
                cluster_data = df[df['cluster'] == cluster_id]
                cluster_analysis[f'cluster_{cluster_id}'] = {
                    'size': len(cluster_data),
                    'percentage': len(cluster_data) / len(df) * 100,
                    'avg_reservations': cluster_data.get('total_reservations', pd.Series([0])).fillna(0).mean(),
                    'avg_attendance': cluster_data.get('total_events_attended', pd.Series([0])).fillna(0).mean(),
                    'segment_name': segments[cluster_id] if cluster_id < len(segments) else f'Segmento {cluster_id + 1}'
                }
            
            # Mark as statistically segmented (not ML trained)
            self.is_trained = False  # Statistical, not ML
            
            results = {
                'num_users': num_users,
                'num_clusters': len(df['cluster'].unique()),
                'cluster_analysis': cluster_analysis,
                'model_type': 'statistical_segmentation',
                'silhouette_score': -1,  # Not applicable for statistical segmentation
                'warning': f'Used statistical segmentation due to insufficient data ({num_users} < {self.min_users_for_ml})'
            }
            
            logger.info(f"Statistical segmentation completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to perform statistical segmentation: {e}")
            raise


# Global segmentation instance
user_segmentation = UserSegmentation() 