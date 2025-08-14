"""
Reports API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from models.common import SuccessResponse
from core.security import get_admin_user
from core.database import database

router = APIRouter()


@router.get("/reports/overview")
async def get_reports_overview(admin_user: dict = Depends(get_admin_user)):
    """Get reports overview with available report types (Admin only)"""
    try:
        available_reports = [
            {
                "id": "events_summary",
                "title": "Events Summary Report",
                "description": "Overview of all events with attendance and revenue",
                "category": "Events"
            },
            {
                "id": "user_engagement",
                "title": "User Engagement Report", 
                "description": "User activity and engagement metrics",
                "category": "Users"
            },
            {
                "id": "revenue_analysis",
                "title": "Revenue Analysis",
                "description": "Financial performance and revenue trends",
                "category": "Finance"
            },
            {
                "id": "attendance_patterns",
                "title": "Attendance Patterns",
                "description": "Check-in rates and attendance trends",
                "category": "Analytics"
            }
        ]
        
        return SuccessResponse(
            message="Reports overview retrieved successfully",
            data={"available_reports": available_reports}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reports overview"
        )


@router.get("/reports/events-summary")
async def get_events_summary_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    admin_user: dict = Depends(get_admin_user)
):
    """Generate events summary report (Admin only)"""
    try:
        # Build date filter
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        
        # Build query
        query = {}
        if date_filter:
            query["date"] = date_filter
        if category:
            query["category"] = category
        
        # Get events with reservation stats
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "reservations",
                    "localField": "id",
                    "foreignField": "event_id",
                    "as": "reservations"
                }
            },
            {
                "$addFields": {
                    "total_reservations": {"$size": "$reservations"},
                    "confirmed_reservations": {
                        "$size": {
                            "$filter": {
                                "input": "$reservations",
                                "cond": {"$ne": ["$$this.status", "cancelled"]}
                            }
                        }
                    },
                    "checked_in_count": {
                        "$size": {
                            "$filter": {
                                "input": "$reservations", 
                                "cond": {"$eq": ["$$this.status", "checked_in"]}
                            }
                        }
                    }
                }
            },
            {
                "$addFields": {
                    "occupancy_rate": {
                        "$cond": [
                            {"$gt": ["$capacity", 0]},
                            {"$multiply": [{"$divide": ["$confirmed_reservations", "$capacity"]}, 100]},
                            0
                        ]
                    },
                    "checkin_rate": {
                        "$cond": [
                            {"$gt": ["$confirmed_reservations", 0]},
                            {"$multiply": [{"$divide": ["$checked_in_count", "$confirmed_reservations"]}, 100]},
                            0
                        ]
                    },
                    "revenue": {
                        "$multiply": ["$confirmed_reservations", {"$ifNull": ["$price", 0]}]
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "reservations": 0
                }
            },
            {"$sort": {"date": 1}}
        ]
        
        events_data = list(database.events.aggregate(pipeline))
        
        # Calculate summary stats
        total_events = len(events_data)
        total_capacity = sum(event.get("capacity", 0) for event in events_data)
        total_reservations = sum(event.get("confirmed_reservations", 0) for event in events_data)
        total_checkins = sum(event.get("checked_in_count", 0) for event in events_data)
        total_revenue = sum(event.get("revenue", 0) for event in events_data)
        
        avg_occupancy = (total_reservations / total_capacity * 100) if total_capacity > 0 else 0
        avg_checkin_rate = (total_checkins / total_reservations * 100) if total_reservations > 0 else 0
        
        # Category breakdown
        category_stats = {}
        for event in events_data:
            cat = event.get("category", "Unknown")
            if cat not in category_stats:
                category_stats[cat] = {
                    "events": 0,
                    "reservations": 0,
                    "revenue": 0
                }
            category_stats[cat]["events"] += 1
            category_stats[cat]["reservations"] += event.get("confirmed_reservations", 0)
            category_stats[cat]["revenue"] += event.get("revenue", 0)
        
        report_data = {
            "period": {
                "start_date": start_date,
                "end_date": end_date,
                "generated_at": datetime.utcnow().isoformat()
            },
            "summary": {
                "total_events": total_events,
                "total_capacity": total_capacity,
                "total_reservations": total_reservations,
                "total_checkins": total_checkins,
                "total_revenue": round(total_revenue, 2),
                "avg_occupancy_rate": round(avg_occupancy, 1),
                "avg_checkin_rate": round(avg_checkin_rate, 1)
            },
            "category_breakdown": category_stats,
            "events_detail": events_data
        }
        
        return SuccessResponse(
            message="Events summary report generated successfully",
            data=report_data
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate events summary report"
        )


@router.get("/reports/revenue-analysis")
async def get_revenue_analysis_report(
    period: str = Query("90", regex="^(30|90|365)$"),
    admin_user: dict = Depends(get_admin_user)
):
    """Generate revenue analysis report (Admin only)"""
    try:
        # Calculate date range
        days = int(period)
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        # Revenue by month
        revenue_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date},
                    "status": {"$ne": "cancelled"}
                }
            },
            {
                "$lookup": {
                    "from": "events",
                    "localField": "event_id",
                    "foreignField": "id",
                    "as": "event"
                }
            },
            {"$unwind": "$event"},
            {
                "$group": {
                    "_id": {
                        "$substr": ["$created_at", 0, 7]  # YYYY-MM
                    },
                    "revenue": {"$sum": {"$ifNull": ["$event.price", 0]}},
                    "reservations": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        monthly_revenue = list(database.reservations.aggregate(revenue_pipeline))
        
        # Revenue by category
        category_revenue_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date},
                    "status": {"$ne": "cancelled"}
                }
            },
            {
                "$lookup": {
                    "from": "events",
                    "localField": "event_id",
                    "foreignField": "id",
                    "as": "event"
                }
            },
            {"$unwind": "$event"},
            {
                "$group": {
                    "_id": "$event.category",
                    "revenue": {"$sum": {"$ifNull": ["$event.price", 0]}},
                    "reservations": {"$sum": 1}
                }
            },
            {"$sort": {"revenue": -1}}
        ]
        
        category_revenue = list(database.reservations.aggregate(category_revenue_pipeline))
        
        # Calculate totals
        total_revenue = sum(item["revenue"] for item in monthly_revenue)
        total_reservations = sum(item["reservations"] for item in monthly_revenue)
        avg_revenue_per_reservation = total_revenue / total_reservations if total_reservations > 0 else 0
        
        report_data = {
            "period": {
                "days": days,
                "start_date": start_date,
                "generated_at": datetime.utcnow().isoformat()
            },
            "summary": {
                "total_revenue": round(total_revenue, 2),
                "total_reservations": total_reservations,
                "avg_revenue_per_reservation": round(avg_revenue_per_reservation, 2)
            },
            "monthly_breakdown": monthly_revenue,
            "category_breakdown": category_revenue
        }
        
        return SuccessResponse(
            message="Revenue analysis report generated successfully",
            data=report_data
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate revenue analysis report"
        )


@router.get("/reports/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = Query("json", regex="^(json|csv)$"),
    admin_user: dict = Depends(get_admin_user)
):
    """Export report in specified format (Admin only)"""
    try:
        # This is a placeholder for report export functionality
        # In a real implementation, you would generate the actual file
        
        export_data = {
            "report_type": report_type,
            "format": format,
            "generated_at": datetime.utcnow().isoformat(),
            "download_url": f"/api/reports/download/{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{format}",
            "status": "ready"
        }
        
        return SuccessResponse(
            message=f"Report export prepared in {format.upper()} format",
            data=export_data
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export report"
        )
