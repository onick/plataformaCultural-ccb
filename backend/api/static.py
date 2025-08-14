"""
Static files router for favicon and other assets
"""

from fastapi import APIRouter
from fastapi.responses import FileResponse, Response
import os

router = APIRouter()

@router.get("/favicon.ico")
async def get_favicon():
    """Return a simple favicon or 204 No Content"""
    # Return empty response to avoid 404 
    return Response(status_code=204)

@router.get("/robots.txt") 
async def get_robots():
    """Return robots.txt"""
    return Response(
        content="User-agent: *\nDisallow: /api/\nAllow: /docs\n",
        media_type="text/plain"
    )
