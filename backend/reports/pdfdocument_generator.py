"""
Generador de reportes elegante usando PDFDocument
Centro Cultural Banreservas
"""

from io import BytesIO
import os
import base64
from datetime import datetime
from typing import List, Dict, Any

from pdfdocument.document import PDFDocument
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.platypus import Spacer


class PDFDocumentReportGenerator:
    """Generador de reportes elegante usando PDFDocument"""
    
    # Colores corporativos del Centro Cultural Banreservas
    COLORS = {
        'primary': HexColor('#1a365d'),      # Azul marino institucional
        'secondary': HexColor('#3182ce'),     # Azul corporativo
        'accent': HexColor('#d69e2e'),        # Dorado elegante
        'success': HexColor('#38a169'),       # Verde corporativo
        'text': HexColor('#2d3748'),          # Gris oscuro para texto
        'light_gray': HexColor('#f7fafc'),    # Gris claro para fondos
        'border': HexColor('#e2e8f0')         # Gris para bordes
    }
    
    def __init__(self):
        self.logo_path = self._find_logo()
        
    def _find_logo(self) -> str:
        """Busca el logo en múltiples ubicaciones posibles"""
        possible_paths = [
            "frontend/build/logo.png",
            "frontend/public/logo.png",
            "frontend/public/assets/logo.png", 
            "backend/static/logo.png",
            "logo.png",
            "assets/logo.png"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    def _embed_logo_base64(self) -> str:
        """Convierte el logo a base64 para embedding"""
        if not self.logo_path or not os.path.exists(self.logo_path):
            return None
            
        try:
            with open(self.logo_path, 'rb') as img_file:
                return base64.b64encode(img_file.read()).decode('utf-8')
        except Exception as e:
            print(f"Error al cargar logo: {e}")
            return None
    
    def _format_date(self, date_str: str) -> str:
        """Formatea fecha para mostrar en español"""
        try:
            if isinstance(date_str, str):
                date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                date_obj = date_str
            
            months = [
                'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
            ]
            
            return f"{date_obj.day} de {months[date_obj.month - 1]} de {date_obj.year}"
        except:
            return str(date_str)
    
    def _get_status_badge(self, status: str) -> str:
        """Retorna el texto del badge según el estado"""
        status_map = {
            'confirmed': '✓ Confirmado',
            'pending': '⏳ Pendiente', 
            'cancelled': '✗ Cancelado',
            'attended': '✓ Asistió',
            'no_show': '✗ No asistió'
        }
        return status_map.get(status, status.title())
    
    def generate_event_report(self, event_data: Dict[str, Any], participants: List[Dict[str, Any]]) -> bytes:
        """
        Genera un reporte elegante de evento usando PDFDocument
        
        Args:
            event_data: Datos del evento
            participants: Lista de participantes
            
        Returns:
            bytes: PDF generado
        """
        # Crear documento
        buffer = BytesIO()
        pdf = PDFDocument(buffer)
        pdf.init_report()
        
        # Configurar estilos personalizados
        self._setup_custom_styles(pdf)
        
        # Generar contenido
        self._add_header(pdf, event_data)
        self._add_event_info(pdf, event_data)
        self._add_metrics(pdf, event_data, participants)
        self._add_participants_table(pdf, participants)
        self._add_footer(pdf)
        
        # Generar PDF
        pdf.generate()
        return buffer.getvalue()
    
    def _setup_custom_styles(self, pdf):
        """Configura estilos personalizados para el documento"""
        # Los estilos de PDFDocument son configurables
        # Aquí podemos personalizar colores y fuentes
        pass
    
    def _add_header(self, pdf, event_data):
        """Añade el encabezado corporativo"""
        # Título principal
        pdf.h1('CENTRO CULTURAL BANRESERVAS')
        pdf.spacer(0.2 * inch)
        
        # Subtítulo del reporte
        pdf.h2('Reporte de Asistencia - Evento Cultural')
        pdf.spacer(0.3 * inch)
        
        # Línea separadora
        pdf.hr()
        pdf.spacer(0.2 * inch)
    
    def _add_event_info(self, pdf, event_data):
        """Añade información del evento"""
        pdf.h2(f'■ {event_data.get("title", "Evento Cultural")}')
        pdf.spacer(0.1 * inch)
        
        # Información básica del evento con formato corporativo
        info_items = [
            f"■ **Ubicación:** {event_data.get('location', 'Galería Principal')}",
            f"■ **Fecha:** {self._format_date(event_data.get('date', '15 de julio de 2025'))}",
            f"■ **Hora:** {event_data.get('time', '18:00')}",
            f"■ **Capacidad:** {event_data.get('capacity', 100)} personas"
        ]
        
        for item in info_items:
            pdf.p(item)
        
        # Descripción del evento
        if event_data.get('description'):
            pdf.spacer(0.1 * inch)
            pdf.p(f"**Descripción:** {event_data['description']}")
        
        pdf.spacer(0.3 * inch)
        pdf.hr_mini()
        pdf.spacer(0.2 * inch)
    
    def _add_metrics(self, pdf, event_data, participants):
        """Añade métricas de participación"""
        pdf.h2('📊 Métricas de Participación')
        pdf.spacer(0.1 * inch)
        
        # Calcular métricas
        total_reservas = len(participants)
        confirmadas = len([p for p in participants if p.get('status') == 'confirmed'])
        asistieron = len([p for p in participants if p.get('status') == 'attended'])
        
        tasa_confirmacion = (confirmadas / total_reservas * 100) if total_reservas > 0 else 0
        tasa_asistencia = (asistieron / confirmadas * 100) if confirmadas > 0 else 0
        
        # Mostrar métricas
        metrics = [
            f"📝 **Total de Reservas:** {total_reservas}",
            f"✅ **Reservas Confirmadas:** {confirmadas}",
            f"👥 **Personas que Asistieron:** {asistieron}",
            f"📈 **Tasa de Confirmación:** {tasa_confirmacion:.1f}%",
            f"🎯 **Tasa de Asistencia:** {tasa_asistencia:.1f}%"
        ]
        
        for metric in metrics:
            pdf.p(metric)
        
        pdf.spacer(0.3 * inch)
        pdf.hr_mini()
        pdf.spacer(0.2 * inch)
    
    def _add_participants_table(self, pdf, participants):
        """Añade tabla de participantes"""
        pdf.h2('👥 Lista de Participantes')
        pdf.spacer(0.1 * inch)
        
        if not participants:
            pdf.p("No hay participantes registrados para este evento.")
            return
        
        # Preparar datos para la tabla
        table_data = [
            ['#', 'Nombre', 'Email', 'Teléfono', 'Estado']
        ]
        
        for i, participant in enumerate(participants, 1):
            table_data.append([
                str(i),
                participant.get('user_name', 'N/A'),
                participant.get('user_email', 'N/A'),
                participant.get('user_phone', 'N/A'),
                self._get_status_badge(participant.get('status', 'pending'))
            ])
        
        # Crear tabla
        pdf.table(table_data, ['10%', '25%', '30%', '20%', '15%'])
        
        pdf.spacer(0.3 * inch)
    
    def _add_footer(self, pdf):
        """Añade pie de página"""
        pdf.hr()
        pdf.spacer(0.1 * inch)
        
        # Información institucional
        pdf.small("Centro Cultural Banreservas")
        pdf.small("Sistema de Gestión de Eventos Culturales")
        pdf.small(f"Reporte generado el {datetime.now().strftime('%d/%m/%Y a las %H:%M')}")
        
        pdf.spacer(0.1 * inch)
        pdf.smaller("Este documento es confidencial y de uso exclusivo del Centro Cultural Banreservas")


# Clase de compatibilidad con el sistema anterior
class ModernReportGenerator(PDFDocumentReportGenerator):
    """Alias para compatibilidad con el sistema anterior"""
    
    def generate_professional_report(self, event_data: Dict[str, Any], participants: List[Dict[str, Any]]) -> bytes:
        """Método de compatibilidad con la API anterior"""
        return self.generate_event_report(event_data, participants) 