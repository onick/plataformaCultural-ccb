"""
Generador de Reportes Profesionales en PDF
Centro Cultural Banreservas
"""

import io
import os
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
from reportlab.graphics.shapes import Drawing, Rect, Line
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from matplotlib.figure import Figure
import matplotlib.dates as mdates

# Configurar matplotlib para uso sin GUI
import matplotlib
matplotlib.use('Agg')

class ProfessionalReportGenerator:
    """Generador de reportes profesionales en PDF con diseño corporativo elegante"""
    
    def __init__(self):
        # Paleta de colores corporativa elegante
        self.colors = {
            'primary': '#1a365d',        # Azul marino profundo
            'secondary': '#2d3748',      # Gris carbón
            'accent': '#3182ce',         # Azul corporativo
            'gold': '#d69e2e',           # Dorado elegante
            'success': '#38a169',        # Verde corporativo
            'text': '#2d3748',           # Gris oscuro para texto
            'light_gray': '#f7fafc',     # Gris muy claro
            'medium_gray': '#e2e8f0',    # Gris medio
            'white': '#ffffff',
            'border': '#cbd5e0'          # Gris para bordes
        }
        
        # Estilos personalizados
        self.styles = {
            'CustomTitle': ParagraphStyle(
                'CustomTitle',
                parent=getSampleStyleSheet()['Title'],
                fontSize=28,
                spaceAfter=12,
                alignment=TA_CENTER,
                textColor=colors.HexColor(self.colors['primary']),
                fontName='Helvetica-Bold',
                leading=34
            ),
            'MainTitleDelicate': ParagraphStyle(
                'MainTitleDelicate',
                parent=getSampleStyleSheet()['Title'],
                fontSize=22,  # Reducido de 28
                spaceAfter=8,
                alignment=TA_CENTER,
                textColor=colors.HexColor(self.colors['primary']),
                fontName='Helvetica-Bold',
                leading=26,
                letterSpacing=1
            ),
            'CorporateInfo': ParagraphStyle(
                'CorporateInfo',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=12,
                textColor=colors.HexColor(self.colors['primary']),
                fontName='Helvetica-Bold',
                alignment=TA_RIGHT,
                leading=14
            ),
            'CorporateSubtitle': ParagraphStyle(
                'CorporateSubtitle',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=14,
                textColor=colors.HexColor(self.colors['secondary']),
                fontName='Helvetica',
                alignment=TA_CENTER,
                leading=16,
                spaceAfter=8
            ),
            'DateInfo': ParagraphStyle(
                'DateInfo',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#718096'),
                fontName='Helvetica',
                alignment=TA_CENTER,
                leading=12
            ),
            'LogoFallback': ParagraphStyle(
                'LogoFallback',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=24,
                alignment=TA_LEFT,
                textColor=colors.HexColor(self.colors['primary'])
            ),
            'CustomSubtitle': ParagraphStyle(
                'CustomSubtitle',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=18,
                spaceAfter=20,
                alignment=TA_CENTER,
                textColor=colors.HexColor(self.colors['secondary']),
                fontName='Helvetica',
                leading=22
            ),
            'SectionHeader': ParagraphStyle(
                'SectionHeader',
                parent=getSampleStyleSheet()['Heading2'],
                fontSize=16,
                spaceAfter=12,
                spaceBefore=20,
                alignment=TA_LEFT,
                textColor=colors.HexColor(self.colors['primary']),
                fontName='Helvetica-Bold',
                backColor=colors.HexColor(self.colors['background']),
                borderPadding=8,
                leading=20
            ),
            'Normal': ParagraphStyle(
                'Normal',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=11,
                leading=14,
                textColor=colors.HexColor(self.colors['text']),
                fontName='Helvetica',
                alignment=TA_JUSTIFY
            ),
            'Footer': ParagraphStyle(
                'Footer',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=9,
                alignment=TA_CENTER,
                textColor=colors.HexColor('#a0aec0'),
                fontName='Helvetica-Oblique',
                spaceAfter=10,
                leading=11
            )
        }
        
        # Buscar logo
        self.logo_path = self._find_logo()
    
    def _find_logo(self):
        """Buscar el archivo de logo en el proyecto"""
        possible_paths = [
            os.path.join(os.path.dirname(__file__), '..', '..', 'logo.png'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'logo.png'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'build', 'logo.png')
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return os.path.abspath(path)
        return None
    
    def _setup_custom_styles(self):
        """Configurar estilos personalizados elegantes"""
        
        # Título principal - Elegante y prominente
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=28,
            textColor=colors.HexColor(self.colors['primary']),
            spaceAfter=25,
            spaceBefore=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            leading=34
        ))
        
        # Subtítulo corporativo
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor(self.colors['accent']),
            spaceAfter=20,
            spaceBefore=15,
            alignment=TA_CENTER,
            fontName='Helvetica',
            leading=22
        ))
        
        # Encabezado de sección con línea decorativa
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=16,
            textColor=colors.HexColor(self.colors['primary']),
            spaceAfter=15,
            spaceBefore=20,
            fontName='Helvetica-Bold',
            leading=20,
            borderWidth=0,
            borderPadding=8,
            backColor=colors.HexColor(self.colors['light_gray'])
        ))
        
        # Texto de métricas destacado
        self.styles.add(ParagraphStyle(
            name='MetricText',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor(self.colors['text']),
            spaceAfter=8,
            fontName='Helvetica',
            leading=14,
            alignment=TA_JUSTIFY
        ))
        
        # Texto destacado para valores importantes
        self.styles.add(ParagraphStyle(
            name='HighlightText',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor(self.colors['accent']),
            fontName='Helvetica-Bold',
            leading=15
        ))
        
        # Pie de página elegante
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor(self.colors['medium_gray']),
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique',
            spaceAfter=0,
            spaceBefore=30
        ))
        
        # Estilo para información del evento
        self.styles.add(ParagraphStyle(
            name='EventInfo',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor(self.colors['text']),
            fontName='Helvetica',
            leading=16,
            leftIndent=20,
            spaceAfter=6
        ))

    def _create_header(self, doc, title):
        """Crear encabezado corporativo profesional con logo real"""
        # Buscar logo real
        logo_path = self._find_logo()
        
        if logo_path and os.path.exists(logo_path):
            try:
                # Obtener dimensiones originales del logo usando PIL
                try:
                    from PIL import Image as PILImage
                    with PILImage.open(logo_path) as img:
                        original_width, original_height = img.size
                        aspect_ratio = original_width / original_height
                except ImportError:
                    # Fallback si PIL no está disponible
                    aspect_ratio = 1.5  # Proporción por defecto
                
                # Definir altura deseada y calcular ancho manteniendo proporción
                desired_height = 0.8 * inch  # Reducido de 1 inch
                desired_width = desired_height * aspect_ratio
                
                # Limitar ancho máximo si es necesario
                max_width = 2 * inch
                if desired_width > max_width:
                    desired_width = max_width
                    desired_height = desired_width / aspect_ratio
                
                # Crear logo con dimensiones proporcionales
                logo = Image(logo_path, width=desired_width, height=desired_height)
                
            except Exception as e:
                print(f"Error al procesar logo: {e}")
                # Fallback a texto elegante si hay error
                logo = Paragraph("🏛️", self.styles['LogoFallback'])
        else:
            # Fallback elegante sin logo
            logo = Paragraph("🏛️", self.styles['LogoFallback'])
        
        # Información corporativa
        corp_info = Paragraph(
            "<b>CENTRO CULTURAL<br/>BANRESERVAS</b><br/>"
            "<font size='10' color='#718096'>República Dominicana</font>",
            self.styles['CorporateInfo']
        )
        
        # Tabla del encabezado
        header_table = Table(
            [[logo, corp_info]],
            colWidths=[2.5*inch, 4*inch]
        )
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        # Línea decorativa corporativa
        line = HRFlowable(
            width="100%", 
            thickness=2, 
            lineCap='round', 
            color=colors.HexColor(self.colors['primary'])
        )
        
        # Título principal más delicado
        title_para = Paragraph(
            f"<b>{title.upper()}</b>",
            self.styles['MainTitleDelicate']
        )
        
        # Subtítulo corporativo
        subtitle = Paragraph(
            "Reporte Institucional Confidencial",
            self.styles['CorporateSubtitle']
        )
        
        # Fecha de generación
        date_para = Paragraph(
            f"<i>Generado el {datetime.now().strftime('%d de %B de %Y a las %H:%M')}</i>",
            self.styles['DateInfo']
        )
        
        return [header_table, Spacer(1, 0.1*inch), line, Spacer(1, 0.15*inch), 
                title_para, Spacer(1, 0.05*inch), subtitle, Spacer(1, 0.1*inch), 
                date_para, Spacer(1, 0.3*inch)]

    def _create_summary_metrics_table(self, metrics: Dict[str, Any]) -> Table:
        """Crear tabla de métricas con diseño profesional"""
        data = [
            ['MÉTRICA', 'VALOR', 'INDICADOR'],
        ]
        
        # Definir métricas con iconos y colores
        metrics_config = [
            ('Total de Reservas', metrics.get('total_reservations', 0), '📊'),
            ('Asistentes Confirmados', metrics.get('total_attendees', 0), '✅'),
            ('Tasa de Asistencia', f"{metrics.get('attendance_rate', 0):.1f}%", '📈'),
            ('Utilización de Capacidad', f"{metrics.get('capacity_utilization', 0):.1f}%", '🏢'),
            ('Cancelaciones', metrics.get('total_cancellations', 0), '❌'),
        ]
        
        for metric_name, value, icon in metrics_config:
            data.append([metric_name, str(value), icon])
        
        table = Table(data, colWidths=[3.5*inch, 1.5*inch, 0.8*inch])
        
        # Estilo elegante para la tabla
        table.setStyle(TableStyle([
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.colors['primary'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Filas de datos
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor(self.colors['white'])),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor(self.colors['text'])),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),
            
            # Bordes y espaciado
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor(self.colors['border'])),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(self.colors['light_gray'])]),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        return table

    def _create_demographics_table(self, demographics: Dict[str, Any]) -> Table:
        """Crear tabla demográfica con diseño elegante"""
        data = [
            ['DEMOGRAFÍA', 'DISTRIBUCIÓN'],
        ]
        
        # Distribución por edad
        age_dist = demographics.get('age_distribution', {})
        if age_dist:
            data.append(['📊 DISTRIBUCIÓN POR EDAD', ''])
            total_age = sum(age_dist.values())
            for age_range, count in sorted(age_dist.items()):
                percentage = (count / total_age * 100) if total_age > 0 else 0
                data.append([f"  {age_range}", f"{count} ({percentage:.1f}%)"])
        
        # Distribución por ubicación
        location_dist = demographics.get('location_distribution', {})
        if location_dist:
            data.append(['', ''])  # Separador
            data.append(['🌍 DISTRIBUCIÓN POR UBICACIÓN', ''])
            total_location = sum(location_dist.values())
            for location, count in sorted(location_dist.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_location * 100) if total_location > 0 else 0
                data.append([f"  {location}", f"{count} ({percentage:.1f}%)"])
        
        table = Table(data, colWidths=[3.5*inch, 2.3*inch])
        
        # Estilo profesional
        table.setStyle(TableStyle([
            # Encabezado principal
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.colors['gold'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Contenido
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor(self.colors['text'])),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            
            # Bordes y espaciado
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.colors['border'])),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            
            # Alternar colores de fila
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(self.colors['light_gray'])]),
        ]))
        
        return table

    def _create_events_summary_table(self, events_data: List[Dict[str, Any]]) -> Table:
        """Crear tabla resumen de eventos con diseño profesional"""
        data = [['EVENTO', 'FECHA', 'RESERVAS', 'ASISTENCIA', 'TASA %']]
        
        for event in events_data:
            # Formatear fecha elegantemente
            event_date = event.get('date', 'N/A')
            if event_date != 'N/A':
                try:
                    date_obj = datetime.strptime(event_date, '%Y-%m-%d')
                    event_date = date_obj.strftime('%d/%m/%Y')
                except:
                    pass
            
            # Calcular tasa y determinar color según rendimiento
            attendance_rate = (event['attendees'] / event['reservations'] * 100) if event['reservations'] > 0 else 0
            if attendance_rate >= 80:
                rate_text = f"🟢 {attendance_rate:.1f}%"
            elif attendance_rate >= 60:
                rate_text = f"🟡 {attendance_rate:.1f}%"
            else:
                rate_text = f"🔴 {attendance_rate:.1f}%"
            
            data.append([
                event['title'][:35] + '...' if len(event['title']) > 35 else event['title'],
                event_date,
                str(event['reservations']),
                str(event['attendees']),
                rate_text
            ])
        
        table = Table(data, colWidths=[2.8*inch, 1.2*inch, 0.8*inch, 0.8*inch, 1*inch])
        table.setStyle(TableStyle([
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.colors['success'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            
            # Contenido
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor(self.colors['text'])),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            
            # Bordes y espaciado
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor(self.colors['border'])),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(self.colors['light_gray'])]),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        return table

    def _create_chart_image(self, chart_data: Dict[str, Any], chart_type: str) -> Optional[Image]:
        """Crear imagen de gráfico matplotlib con diseño profesional"""
        try:
            # Configurar estilo profesional
            plt.style.use('seaborn-v0_8-whitegrid')
            fig, ax = plt.subplots(figsize=(10, 6))
            fig.patch.set_facecolor('white')
            
            # Colores corporativos
            primary_color = self.colors['primary']
            accent_color = self.colors['accent']
            gold_color = self.colors['gold']
            success_color = self.colors['success']
            
            if chart_type == 'attendance_trend':
                dates = chart_data.get('dates', [])
                values = chart_data.get('values', [])
                
                # Gráfico de línea elegante
                ax.plot(dates, values, marker='o', linewidth=3, markersize=8, 
                       color=primary_color, markerfacecolor=accent_color, 
                       markeredgecolor='white', markeredgewidth=2)
                
                # Rellenar área bajo la curva
                ax.fill_between(dates, values, alpha=0.3, color=accent_color)
                
                ax.set_title('Tendencia de Asistencia', fontsize=16, fontweight='bold', 
                           color=primary_color, pad=20)
                ax.set_xlabel('Fecha', fontsize=12, color=primary_color)
                ax.set_ylabel('Número de Asistentes', fontsize=12, color=primary_color)
                ax.grid(True, alpha=0.3, linestyle='--')
                
                # Personalizar ejes
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
                ax.spines['left'].set_color(primary_color)
                ax.spines['bottom'].set_color(primary_color)
                
            elif chart_type == 'age_distribution':
                ages = list(chart_data.keys())
                counts = list(chart_data.values())
                
                # Gradiente de colores
                colors_gradient = [primary_color, accent_color, gold_color, success_color]
                colors_list = colors_gradient * (len(ages) // len(colors_gradient) + 1)
                
                bars = ax.bar(ages, counts, color=colors_list[:len(ages)], 
                             alpha=0.8, edgecolor='white', linewidth=2)
                
                ax.set_title('Distribución por Edad', fontsize=16, fontweight='bold', 
                           color=primary_color, pad=20)
                ax.set_xlabel('Rango de Edad', fontsize=12, color=primary_color)
                ax.set_ylabel('Número de Participantes', fontsize=12, color=primary_color)
                
                # Agregar valores en las barras con estilo
                for bar, count in zip(bars, counts):
                    height = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                           f'{int(count)}', ha='center', va='bottom', 
                           fontweight='bold', color=primary_color, fontsize=11)
                
                # Personalizar ejes
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
                ax.spines['left'].set_color(primary_color)
                ax.spines['bottom'].set_color(primary_color)
                
            elif chart_type == 'monthly_performance':
                months = chart_data.get('months', [])
                attendance = chart_data.get('attendance', [])
                capacity = chart_data.get('capacity', [])
                
                x = range(len(months))
                width = 0.35
                
                # Barras con colores corporativos
                bars1 = ax.bar([i - width/2 for i in x], attendance, width, 
                              label='Asistencia Real', color=primary_color, alpha=0.8,
                              edgecolor='white', linewidth=1)
                bars2 = ax.bar([i + width/2 for i in x], capacity, width,
                              label='Capacidad Total', color=accent_color, alpha=0.8,
                              edgecolor='white', linewidth=1)
                
                ax.set_title('Rendimiento Mensual', fontsize=16, fontweight='bold', 
                           color=primary_color, pad=20)
                ax.set_xlabel('Mes', fontsize=12, color=primary_color)
                ax.set_ylabel('Número de Personas', fontsize=12, color=primary_color)
                ax.set_xticks(x)
                ax.set_xticklabels(months, rotation=45)
                
                # Leyenda elegante
                legend = ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True)
                legend.get_frame().set_facecolor('white')
                legend.get_frame().set_alpha(0.9)
                
                # Personalizar ejes
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
                ax.spines['left'].set_color(primary_color)
                ax.spines['bottom'].set_color(primary_color)
            
            # Ajustar diseño
            plt.tight_layout()
            
            # Convertir a imagen con alta calidad
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight', 
                       facecolor='white', edgecolor='none')
            img_buffer.seek(0)
            plt.close(fig)
            
            return Image(img_buffer, width=7*inch, height=4*inch)
            
        except Exception as e:
            print(f"Error creando gráfico {chart_type}: {e}")
            return None

    def generate_individual_event_report(self, event_data: Dict[str, Any]) -> bytes:
        """Generar reporte individual de evento"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        
        # Encabezado
        story.extend(self._create_header(doc, "REPORTE DE EVENTO INDIVIDUAL"))
        
        # Información del evento con diseño elegante
        story.append(Paragraph("📅 INFORMACIÓN DEL EVENTO", self.styles['SectionHeader']))
        
        # Crear tabla de información del evento
        event_info_data = [
            ['Título:', event_data.get('title', 'N/A')],
            ['Fecha:', event_data.get('date', 'N/A')],
            ['Hora:', event_data.get('time', 'N/A')],
            ['Ubicación:', event_data.get('location', 'N/A')],
            ['Capacidad:', f"{event_data.get('capacity', 0)} personas"],
            ['Categoría:', event_data.get('category', 'N/A')]
        ]
        
        event_info_table = Table(event_info_data, colWidths=[1.5*inch, 4*inch])
        event_info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(self.colors['primary'])),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor(self.colors['text'])),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor(self.colors['light_gray'])]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.colors['border'])),
        ]))
        
        story.append(event_info_table)
        story.append(Spacer(1, 25))
        
        # Métricas del evento
        story.append(Paragraph("📊 MÉTRICAS DE ASISTENCIA", self.styles['SectionHeader']))
        metrics_table = self._create_summary_metrics_table(event_data.get('metrics', {}))
        story.append(metrics_table)
        story.append(Spacer(1, 20))
        
        # Demografía
        if event_data.get('demographics'):
            story.append(Paragraph("👥 ANÁLISIS DEMOGRÁFICO", self.styles['SectionHeader']))
            demographics_table = self._create_demographics_table(event_data.get('demographics', {}))
            story.append(demographics_table)
            story.append(Spacer(1, 20))
        
        # Gráfico de distribución por edad
        if event_data.get('demographics', {}).get('age_distribution'):
            age_chart = self._create_chart_image(
                event_data['demographics']['age_distribution'], 
                'age_distribution'
            )
            if age_chart:
                story.append(Paragraph("📈 DISTRIBUCIÓN POR EDAD", self.styles['SectionHeader']))
                story.append(age_chart)
                story.append(Spacer(1, 20))
        
        # Lista de participantes (si está disponible)
        if event_data.get('participants'):
            story.append(PageBreak())
            story.append(Paragraph("👥 LISTA DE PARTICIPANTES", self.styles['SectionHeader']))
            
            participants_data = [['NOMBRE', 'EMAIL', 'TELÉFONO', 'EDAD', 'ESTADO']]
            for participant in event_data.get('participants', [])[:50]:  # Máximo 50
                participants_data.append([
                    participant.get('name', ''),
                    participant.get('email', ''),
                    participant.get('phone', ''),
                    str(participant.get('age', '')),
                    '✅' if participant.get('checked_in') else '⏳'
                ])
            
            participants_table = Table(participants_data, colWidths=[1.8*inch, 2*inch, 1.2*inch, 0.7*inch, 0.8*inch])
            participants_table.setStyle(TableStyle([
                # Encabezado elegante
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.colors['primary'])),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                
                # Contenido
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor(self.colors['text'])),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),  # Nombres alineados a la izquierda
                ('ALIGN', (1, 1), (1, -1), 'LEFT'),  # Emails alineados a la izquierda
                ('ALIGN', (2, 1), (-1, -1), 'CENTER'),  # Resto centrado
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                
                # Bordes y espaciado
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.colors['border'])),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(self.colors['light_gray'])]),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(participants_table)
        
        # Pie de página elegante
        story.append(Spacer(1, 40))
        
        # Línea decorativa
        footer_line = Drawing(500, 3)
        footer_line.add(Line(0, 1, 500, 1, strokeColor=colors.HexColor(self.colors['accent']), strokeWidth=1))
        story.append(footer_line)
        story.append(Spacer(1, 10))
        
        # Información del pie de página
        footer_text = f"""
        <para align="center">
        <font size="10" color="{self.colors['primary']}"><b>Centro Cultural Banreservas</b></font><br/>
        <font size="8" color="{self.colors['medium_gray']}">
        Reporte generado el {datetime.now().strftime('%d de %B de %Y a las %H:%M')}<br/>
        Este documento es confidencial y de uso exclusivo institucional
        </font>
        </para>
        """
        story.append(Paragraph(footer_text, self.styles['Footer']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_monthly_report(self, monthly_data: Dict[str, Any]) -> bytes:
        """Generar reporte mensual consolidado"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        
        # Encabezado
        month_year = monthly_data.get('period', 'Mes')
        story.extend(self._create_header(doc, "REPORTE MENSUAL DE ACTIVIDADES"))
        
        # Resumen ejecutivo
        story.append(Paragraph("🎯 RESUMEN EJECUTIVO", self.styles['SectionHeader']))
        
        executive_summary = f"""
        Durante el período de <b>{month_year}</b>, el Centro Cultural Banreservas organizó 
        <b>{monthly_data.get('total_events', 0)} eventos</b> con un total de 
        <b>{monthly_data.get('total_reservations', 0)} reservas</b> y 
        <b>{monthly_data.get('total_attendees', 0)} asistentes confirmados</b>.
        
        La tasa promedio de asistencia fue del <b>{monthly_data.get('avg_attendance_rate', 0):.1f}%</b>,
        con una utilización de capacidad del <b>{monthly_data.get('avg_capacity_utilization', 0):.1f}%</b>.
        """
        story.append(Paragraph(executive_summary, self.styles['MetricText']))
        story.append(Spacer(1, 20))
        
        # Métricas generales
        story.append(Paragraph("📊 MÉTRICAS GENERALES", self.styles['SectionHeader']))
        general_metrics_table = self._create_summary_metrics_table(monthly_data.get('metrics', {}))
        story.append(general_metrics_table)
        story.append(Spacer(1, 20))
        
        # Rendimiento por evento
        if monthly_data.get('events'):
            story.append(Paragraph("🎭 RENDIMIENTO POR EVENTO", self.styles['SectionHeader']))
            events_table = self._create_events_summary_table(monthly_data.get('events', []))
            story.append(events_table)
            story.append(Spacer(1, 20))
        
        # Gráfico de rendimiento mensual
        if monthly_data.get('performance_data'):
            performance_chart = self._create_chart_image(
                monthly_data['performance_data'], 
                'monthly_performance'
            )
            if performance_chart:
                story.append(Paragraph("📈 ANÁLISIS DE RENDIMIENTO", self.styles['SectionHeader']))
                story.append(performance_chart)
                story.append(Spacer(1, 20))
        
        # Análisis demográfico consolidado
        if monthly_data.get('demographics'):
            story.append(PageBreak())
            story.append(Paragraph("👥 ANÁLISIS DEMOGRÁFICO CONSOLIDADO", self.styles['SectionHeader']))
            demographics_table = self._create_demographics_table(monthly_data.get('demographics', {}))
            story.append(demographics_table)
            story.append(Spacer(1, 20))
            
            # Gráfico de distribución por edad
            age_chart = self._create_chart_image(
                monthly_data['demographics'].get('age_distribution', {}),
                'age_distribution'
            )
            if age_chart:
                story.append(age_chart)
                story.append(Spacer(1, 20))
        
        # Recomendaciones
        story.append(Paragraph("💡 RECOMENDACIONES", self.styles['SectionHeader']))
        
        recommendations = """
        <b>1. Optimización de Capacidad:</b> Considerar ajustar el tamaño de los espacios para eventos con alta demanda.<br/><br/>
        <b>2. Marketing Dirigido:</b> Enfocar estrategias de promoción en los grupos demográficos más activos.<br/><br/>
        <b>3. Seguimiento de Tendencias:</b> Analizar patrones de asistencia para planificar eventos futuros.<br/><br/>
        <b>4. Mejora Continua:</b> Implementar encuestas de satisfacción para optimizar la experiencia del usuario.
        """
        story.append(Paragraph(recommendations, self.styles['MetricText']))
        
        # Pie de página elegante
        story.append(Spacer(1, 40))
        
        # Línea decorativa
        footer_line = Drawing(500, 3)
        footer_line.add(Line(0, 1, 500, 1, strokeColor=colors.HexColor(self.colors['accent']), strokeWidth=1))
        story.append(footer_line)
        story.append(Spacer(1, 10))
        
        # Información del pie de página
        footer_text = f"""
        <para align="center">
        <font size="10" color="{self.colors['primary']}"><b>Centro Cultural Banreservas</b></font><br/>
        <font size="8" color="{self.colors['medium_gray']}">
        Reporte Mensual - {month_year}<br/>
        Generado el {datetime.now().strftime('%d de %B de %Y a las %H:%M')}<br/>
        Documento confidencial de uso exclusivo institucional
        </font>
        </para>
        """
        story.append(Paragraph(footer_text, self.styles['Footer']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue() 