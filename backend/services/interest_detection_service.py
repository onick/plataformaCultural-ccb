"""
User Interest Detection Service
Analyzes user behavior to detect interests and preferences
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import Counter

from core.database import database
from core.config import settings

logger = logging.getLogger(__name__)


class InterestDetectionService:
    """Service for detecting user interests based on their activity"""
    
    def __init__(self):
        self.category_weights = {
            'reservation': 3.0,
            'checkin': 5.0,
            'view': 1.0,
            'search': 2.0,
            'share': 2.5
        }
        
        # Time decay factors (how much older activities are worth)
        self.time_decay = {
            'recent': 1.0,    # Last 30 days
            'medium': 0.7,    # 30-90 days
            'old': 0.4        # 90+ days
        }
    
    def calculate_time_weight(self, activity_date: str) -> float:
        """Calculate weight based on activity age"""
        try:
            activity_dt = datetime.fromisoformat(activity_date.replace('Z', '+00:00'))
            now = datetime.utcnow()
            days_ago = (now - activity_dt).days
            
            if days_ago <= 30:
                return self.time_decay['recent']
            elif days_ago <= 90:
                return self.time_decay['medium']
            else:
                return self.time_decay['old']
        except:
            return 0.1  # Very low weight for invalid dates
    
    def analyze_user_interests(self, user_id: str) -> Dict[str, Any]:
        """
        Analyze user interests based on their activity history
        
        Args:
            user_id: User ID to analyze
            
        Returns:
            Dictionary with interest analysis results
        """
        try:
            interest_scores = Counter()
            activity_summary = {
                'total_events': 0,
                'total_reservations': 0,
                'total_checkins': 0,
                'categories_explored': set(),
                'preferred_times': Counter(),
                'preferred_locations': Counter(),
                'activity_patterns': {}
            }
            
            # Analyze reservations
            reservations = list(database.reservations.find({
                "user_id": user_id,
                "status": {"$ne": "cancelled"}
            }))
            
            activity_summary['total_reservations'] = len(reservations)
            
            for reservation in reservations:
                # Get event details
                event = database.events.find_one({"id": reservation.get("event_id")})
                if not event:
                    continue
                
                category = event.get("category", "Unknown")
                activity_summary['categories_explored'].add(category)
                
                # Calculate weighted score
                time_weight = self.calculate_time_weight(reservation.get("created_at", ""))
                activity_weight = self.category_weights.get('reservation', 1.0)
                
                # Check if user actually attended
                if reservation.get("status") == "checked_in":
                    activity_weight *= 1.5  # Boost for actual attendance
                
                score = activity_weight * time_weight
                interest_scores[category] += score
                
                # Track time preferences
                event_time = event.get("time", "")
                if event_time:
                    try:
                        hour = int(event_time.split(":")[0])
                        if hour < 12:
                            time_slot = "morning"
                        elif hour < 18:
                            time_slot = "afternoon"
                        else:
                            time_slot = "evening"
                        activity_summary['preferred_times'][time_slot] += 1
                    except:
                        pass
                
                # Track location preferences
                location = event.get("location", "")
                if location:
                    activity_summary['preferred_locations'][location] += 1
            
            # Analyze check-ins
            checkins = list(database.checkins.find({"user_id": user_id}))
            activity_summary['total_checkins'] = len(checkins)
            
            for checkin in checkins:
                event = database.events.find_one({"id": checkin.get("event_id")})
                if not event:
                    continue
                
                category = event.get("category", "Unknown")
                time_weight = self.calculate_time_weight(checkin.get("timestamp", ""))
                activity_weight = self.category_weights.get('checkin', 1.0)
                
                score = activity_weight * time_weight
                interest_scores[category] += score
            
            # Convert sets to lists for JSON serialization
            activity_summary['categories_explored'] = list(activity_summary['categories_explored'])
            activity_summary['total_events'] = len(set(
                res.get("event_id") for res in reservations if res.get("event_id")
            ))
            
            # Calculate interest percentages
            total_score = sum(interest_scores.values())
            interest_percentages = {}
            
            if total_score > 0:
                for category, score in interest_scores.items():
                    interest_percentages[category] = round((score / total_score) * 100, 2)
            
            # Determine primary interests (top 3)
            primary_interests = [
                {"category": cat, "score": score, "percentage": interest_percentages.get(cat, 0)}
                for cat, score in interest_scores.most_common(3)
            ]
            
            # Generate recommendations
            recommendations = self.generate_recommendations(user_id, interest_scores)
            
            return {
                "user_id": user_id,
                "analysis_date": database.get_current_timestamp(),
                "primary_interests": primary_interests,
                "interest_percentages": interest_percentages,
                "activity_summary": {
                    **activity_summary,
                    "preferred_times": dict(activity_summary['preferred_times']),
                    "preferred_locations": dict(activity_summary['preferred_locations'])
                },
                "recommendations": recommendations,
                "engagement_level": self.calculate_engagement_level(activity_summary),
                "diversity_score": self.calculate_diversity_score(interest_scores)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing user interests for {user_id}: {e}")
            return {
                "user_id": user_id,
                "error": "Failed to analyze interests",
                "analysis_date": database.get_current_timestamp()
            }
    
    def calculate_engagement_level(self, activity_summary: Dict) -> str:
        """Calculate user engagement level"""
        total_activity = (
            activity_summary['total_reservations'] + 
            activity_summary['total_checkins']
        )
        
        categories_count = len(activity_summary['categories_explored'])
        
        if total_activity >= 10 and categories_count >= 4:
            return "high"
        elif total_activity >= 5 and categories_count >= 2:
            return "medium"
        elif total_activity >= 1:
            return "low"
        else:
            return "new"
    
    def calculate_diversity_score(self, interest_scores: Counter) -> float:
        """Calculate how diverse user's interests are (0-1 scale)"""
        if len(interest_scores) <= 1:
            return 0.0
        
        total_score = sum(interest_scores.values())
        if total_score == 0:
            return 0.0
        
        # Calculate entropy-like measure
        diversity = 0.0
        for score in interest_scores.values():
            if score > 0:
                p = score / total_score
                diversity -= p * (p ** 0.5)  # Modified entropy formula
        
        # Normalize to 0-1 scale
        max_categories = 8  # Number of event categories
        max_diversity = max_categories * (1/max_categories) * ((1/max_categories) ** 0.5)
        
        return min(1.0, diversity / max_diversity) if max_diversity > 0 else 0.0
    
    def generate_recommendations(self, user_id: str, interest_scores: Counter) -> List[Dict]:
        """Generate event recommendations based on interests"""
        try:
            recommendations = []
            
            # Get user's center for filtering
            user = database.users.find_one({"id": user_id})
            user_center = user.get("center", "santo-domingo") if user else "santo-domingo"
            
            # Get top interests
            top_categories = [cat for cat, _ in interest_scores.most_common(3)]
            
            if not top_categories:
                # For new users, recommend popular events
                top_categories = ["Conciertos", "Cinema Dominicano", "Talleres"]
            
            # Find upcoming events in user's interested categories
            upcoming_events = list(database.events.find({
                "category": {"$in": top_categories},
                "center": user_center,
                "date": {"$gte": datetime.utcnow().strftime("%Y-%m-%d")},
                "published": True
            }).sort("date", 1).limit(5))
            
            for event in upcoming_events:
                # Calculate recommendation score
                category_score = interest_scores.get(event.get("category", ""), 0)
                
                # Boost score for events matching user's preferred times
                time_boost = 1.0
                event_time = event.get("time", "")
                if event_time:
                    try:
                        hour = int(event_time.split(":")[0])
                        if hour < 12:
                            time_slot = "morning"
                        elif hour < 18:
                            time_slot = "afternoon"
                        else:
                            time_slot = "evening"
                        # This would require storing user's preferred times
                        time_boost = 1.2  # Default boost
                    except:
                        pass
                
                rec_score = category_score * time_boost
                
                recommendations.append({
                    "event_id": event["id"],
                    "title": event["title"],
                    "category": event["category"],
                    "date": event["date"],
                    "time": event["time"],
                    "location": event.get("location", ""),
                    "recommendation_score": round(rec_score, 2),
                    "reason": f"Based on your interest in {event['category']}"
                })
            
            # Sort by recommendation score
            recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
            
            return recommendations[:3]  # Return top 3 recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations for {user_id}: {e}")
            return []
    
    def get_similar_users(self, user_id: str, limit: int = 5) -> List[Dict]:
        """Find users with similar interests"""
        try:
            user_interests = self.analyze_user_interests(user_id)
            user_categories = set(
                interest["category"] for interest in user_interests.get("primary_interests", [])
            )
            
            if not user_categories:
                return []
            
            # Find users with similar category preferences
            similar_users = []
            
            # This is a simplified version - in production, you'd want to use
            # more sophisticated similarity algorithms
            all_users = database.users.find(
                {"id": {"$ne": user_id}, "deleted": {"$ne": True}},
                {"id": 1, "name": 1, "email": 1}
            )
            
            for other_user in all_users:
                other_interests = self.analyze_user_interests(other_user["id"])
                other_categories = set(
                    interest["category"] for interest in other_interests.get("primary_interests", [])
                )
                
                # Calculate Jaccard similarity
                intersection = user_categories.intersection(other_categories)
                union = user_categories.union(other_categories)
                
                if union:
                    similarity = len(intersection) / len(union)
                    
                    if similarity > 0.3:  # Threshold for similarity
                        similar_users.append({
                            "user_id": other_user["id"],
                            "name": other_user["name"],
                            "similarity_score": round(similarity, 3),
                            "common_interests": list(intersection)
                        })
            
            # Sort by similarity score
            similar_users.sort(key=lambda x: x["similarity_score"], reverse=True)
            
            return similar_users[:limit]
            
        except Exception as e:
            logger.error(f"Error finding similar users for {user_id}: {e}")
            return []
    
    def update_user_profile_with_interests(self, user_id: str) -> bool:
        """Update user profile with detected interests"""
        try:
            interests_data = self.analyze_user_interests(user_id)
            
            # Update user document with interests
            result = database.users.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "interests": interests_data,
                        "interests_updated_at": database.get_current_timestamp()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating user profile with interests for {user_id}: {e}")
            return False


# Create singleton instance
interest_detection_service = InterestDetectionService()