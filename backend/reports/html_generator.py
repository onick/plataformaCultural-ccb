"""
Generador de Reportes HTML Modernos
Reemplaza ReportLab con HTML + CSS + Playwright para máxima flexibilidad de diseño
"""

import os
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
from playwright.async_api import async_playwright
import base64

class HTMLReportGenerator:
    def __init__(self):
        self.templates_dir = Path(__file__).parent / "templates"
        self.output_dir = Path(__file__).parent / "output"
        self.output_dir.mkdir(exist_ok=True)
        
        # Colores corporativos del Centro Cultural Banreservas
        self.colors = {
            'primary': '#1a365d',
            'secondary': '#3182ce',
            'accent': '#d69e2e',
            'success': '#38a169',
            'text': '#2d3748',
            'light_gray': '#f7fafc',
            'medium_gray': '#e2e8f0',
            'border': '#cbd5e0'
        }
    
    def _find_logo(self) -> Optional[str]:
        """Buscar el logo del Centro Cultural Banreservas"""
        possible_paths = [
            'logo.png',
            'frontend/public/logo.png',
            'frontend/build/logo.png',
            '../frontend/public/logo.png',
            '../logo.png'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        return None
    
    def _get_logo_section(self) -> str:
        """Generar sección del logo para la plantilla"""
        logo_path = self._find_logo()
        
        if logo_path and os.path.exists(logo_path):
            # Convertir imagen a base64 para embebido
            try:
                with open(logo_path, 'rb') as img_file:
                    img_data = base64.b64encode(img_file.read()).decode()
                    img_ext = os.path.splitext(logo_path)[1][1:].lower()
                    if img_ext == 'jpg':
                        img_ext = 'jpeg'
                    
                    return f'<img src="data:image/{img_ext};base64,{img_data}" alt="Centro Cultural Banreservas" class="logo">'
            except Exception:
                pass
        
        # Fallback elegante
        return '<div class="logo-fallback">CCB</div>'
    
    def _format_status_badge(self, status: str) -> str:
        """Formatear estado con badge colorido"""
        status_classes = {
            'confirmed': 'status-confirmed',
            'pending': 'status-pending',
            'cancelled': 'status-cancelled'
        }
        
        status_texts = {
            'confirmed': '✅ Confirmado',
            'pending': '⏳ Pendiente',
            'cancelled': '❌ Cancelado'
        }
        
        css_class = status_classes.get(status, 'status-pending')
        text = status_texts.get(status, status.title())
        
        return f'<span class="status-badge {css_class}">{text}</span>'
    
    def _generate_participants_table(self, participants: List[Dict]) -> str:
        """Generar tabla HTML de participantes"""
        if not participants:
            return '<tr><td colspan="5" style="text-align: center; color: #666; font-style: italic;">No hay participantes registrados</td></tr>'
        
        rows = []
        for participant in participants:
            status_badge = self._format_status_badge(participant.get('status', 'pending'))
            
            # Formatear fecha de reserva
            created_at = participant.get('created_at', '')
            if created_at:
                try:
                    if isinstance(created_at, str):
                        date_obj = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    else:
                        date_obj = created_at
                    formatted_date = date_obj.strftime('%d/%m/%Y %H:%M')
                except:
                    formatted_date = str(created_at)
            else:
                formatted_date = 'N/A'
            
            row = f"""
            <tr>
                <td><strong>{participant.get('name', 'N/A')}</strong></td>
                <td>{participant.get('email', 'N/A')}</td>
                <td>{participant.get('phone', 'N/A')}</td>
                <td>{status_badge}</td>
                <td>{formatted_date}</td>
            </tr>
            """
            rows.append(row)
        
        return ''.join(rows)
    
    def _calculate_metrics(self, event_data: Dict, participants: List[Dict]) -> Dict[str, Any]:
        """Calcular métricas del evento"""
        total_reservations = len(participants)
        confirmed_reservations = len([p for p in participants if p.get('status') == 'confirmed'])
        
        # Calcular tasa de asistencia
        if total_reservations > 0:
            attendance_rate = round((confirmed_reservations / total_reservations) * 100, 1)
        else:
            attendance_rate = 0
        
        return {
            'total_reservations': total_reservations,
            'confirmed_reservations': confirmed_reservations,
            'attendance_rate': attendance_rate
        }
    
    def _load_template(self, template_name: str) -> str:
        """Cargar plantilla HTML"""
        template_path = self.templates_dir / template_name
        
        if not template_path.exists():
            raise FileNotFoundError(f"Plantilla no encontrada: {template_path}")
        
        with open(template_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    def _populate_template(self, template: str, event_data: Dict, participants: List[Dict]) -> str:
        """Rellenar plantilla con datos del evento"""
        
        # Calcular métricas
        metrics = self._calculate_metrics(event_data, participants)
        
        # Formatear fecha del evento
        event_date = event_data.get('date', 'N/A')
        if event_date and event_date != 'N/A':
            try:
                if isinstance(event_date, str):
                    date_obj = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
                else:
                    date_obj = event_date
                formatted_event_date = date_obj.strftime('%d de %B de %Y a las %H:%M')
            except:
                formatted_event_date = str(event_date)
        else:
            formatted_event_date = 'Fecha no especificada'
        
        # Datos para reemplazar en la plantilla
        replacements = {
            'logo_section': self._get_logo_section(),
            'report_date': datetime.now().strftime('%d de %B de %Y'),
            'event_title': event_data.get('title', 'Evento Sin Título'),
            'event_date': formatted_event_date,
            'event_location': event_data.get('location', 'Ubicación no especificada'),
            'event_capacity': event_data.get('capacity', 'N/A'),
            'event_category': event_data.get('category', 'Sin categoría'),
            'total_reservations': metrics['total_reservations'],
            'confirmed_reservations': metrics['confirmed_reservations'],
            'attendance_rate': metrics['attendance_rate'],
            'participants_table': self._generate_participants_table(participants),
            'generation_timestamp': datetime.now().strftime('%d/%m/%Y a las %H:%M:%S')
        }
        
        # Reemplazar placeholders
        populated_template = template
        for key, value in replacements.items():
            placeholder = f'{{{{{key}}}}}'
            populated_template = populated_template.replace(placeholder, str(value))
        
        return populated_template
    
    async def generate_event_report(self, event_data: Dict, participants: List[Dict], 
                                  output_filename: Optional[str] = None) -> str:
        """
        Generar reporte PDF de evento usando HTML + Playwright
        
        Args:
            event_data: Datos del evento
            participants: Lista de participantes
            output_filename: Nombre del archivo de salida (opcional)
            
        Returns:
            Ruta del archivo PDF generado
        """
        
        # Cargar y rellenar plantilla
        template = self._load_template('event_report.html')
        html_content = self._populate_template(template, event_data, participants)
        
        # Generar nombre de archivo si no se proporciona
        if not output_filename:
            event_title_clean = "".join(c for c in event_data.get('title', 'evento') 
                                      if c.isalnum() or c in (' ', '-', '_')).rstrip()
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f"reporte_evento_{event_title_clean}_{timestamp}.pdf"
        
        output_path = self.output_dir / output_filename
        
        # Generar PDF con Playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Configurar el contenido HTML
            await page.set_content(html_content, wait_until='networkidle')
            
            # Generar PDF con configuración optimizada
            await page.pdf(
                path=str(output_path),
                format='A4',
                margin={
                    'top': '20mm',
                    'right': '15mm',
                    'bottom': '20mm',
                    'left': '15mm'
                },
                print_background=True,
                prefer_css_page_size=True
            )
            
            await browser.close()
        
        return str(output_path)
    
    def generate_event_report_sync(self, event_data: Dict, participants: List[Dict], 
                                 output_filename: Optional[str] = None) -> str:
        """
        Versión síncrona del generador de reportes
        """
        return asyncio.run(self.generate_event_report(event_data, participants, output_filename))


# Funciones de conveniencia para compatibilidad
def generate_professional_report(event_data: Dict, participants: List[Dict]) -> str:
    """
    Función de conveniencia para generar reporte profesional
    Mantiene compatibilidad con el sistema anterior
    """
    generator = HTMLReportGenerator()
    return generator.generate_event_report_sync(event_data, participants)


def create_monthly_report(events_data: List[Dict]) -> str:
    """
    Placeholder para reporte mensual
    Se implementará en futuras iteraciones
    """
    # TODO: Implementar reporte mensual consolidado
    raise NotImplementedError("Reporte mensual HTML en desarrollo")


# Clase principal para compatibilidad
class ModernReportGenerator:
    """
    Clase principal que reemplaza ProfessionalReportGenerator
    """
    
    def __init__(self):
        self.html_generator = HTMLReportGenerator()
    
    def generate_event_report(self, event_data: Dict, participants: List[Dict]) -> str:
        """Generar reporte de evento individual"""
        return self.html_generator.generate_event_report_sync(event_data, participants)
    
    def generate_monthly_report(self, events_data: List[Dict]) -> str:
        """Generar reporte mensual consolidado"""
        return create_monthly_report(events_data) 