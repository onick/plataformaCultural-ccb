"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { CalendarDays, Users, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const chartData = [
  { month: "Enero", eventos: 12, usuarios: 186, reservas: 245 },
  { month: "Febrero", eventos: 18, usuarios: 305, reservas: 398 },
  { month: "Marzo", eventos: 15, usuarios: 237, reservas: 352 },
  { month: "Abril", eventos: 22, usuarios: 450, reservas: 567 },
  { month: "Mayo", eventos: 19, usuarios: 380, reservas: 489 },
  { month: "Junio", eventos: 25, usuarios: 520, reservas: 645 },
  { month: "Julio", eventos: 28, usuarios: 610, reservas: 734 }
]

const chartConfig = {
  eventos: {
    label: "Eventos",
    color: "hsl(var(--chart-1))",
    icon: CalendarDays,
  },
  usuarios: {
    label: "Usuarios",
    color: "hsl(var(--chart-2))",
    icon: Users,
  },
  reservas: {
    label: "Reservas",
    color: "hsl(var(--chart-3))",
    icon: TrendingUp,
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [activeChart, setActiveChart] = 
    React.useState<keyof typeof chartConfig>("eventos")

  const total = React.useMemo(
    () => ({
      eventos: chartData.reduce((acc, curr) => acc + curr.eventos, 0),
      usuarios: chartData.reduce((acc, curr) => acc + curr.usuarios, 0),
      reservas: chartData.reduce((acc, curr) => acc + curr.reservas, 0),
    }),
    []
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Análisis Interactivo</CardTitle>
          <CardDescription>
            Estadísticas de eventos, usuarios y reservas
          </CardDescription>
        </div>
        <div className="flex">
          {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map((key) => {
            const chart = chartConfig[key]
            const Icon = chart.icon
            return (
              <button
                key={key}
                data-active={activeChart === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground">
                    {chart.label}
                  </span>
                </div>
                <div className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </div>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey={activeChart}
              type="natural"
              fill={chartConfig[activeChart].color}
              fillOpacity={0.4}
              stroke={chartConfig[activeChart].color}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        
        {/* Chart insights */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Tendencia positiva
            </Badge>
            <span className="text-xs text-muted-foreground">
              Crecimiento del 12% este mes
            </span>
          </div>
          <Button variant="outline" size="sm">
            Ver detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}