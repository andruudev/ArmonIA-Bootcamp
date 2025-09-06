"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Brain,
  TrendingUp,
  Calendar,
  Activity,
  Medal,
  Target,
  Smile,
  Frown,
  Meh,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const moodData = {
  daily: [
    {
      day: "Mon",
      value: 65,
      activities: [
        { name: "Exercise", duration: "30min", impact: "positive" },
        { name: "Meditation", duration: "15min", impact: "positive" },
      ],
      energy: 70,
      sleep: 7.5,
    },
    {
      day: "Tue",
      value: 75,
      activities: [
        { name: "Therapy", duration: "1hr", impact: "positive" },
        { name: "Reading", duration: "45min", impact: "neutral" },
      ],
      energy: 75,
      sleep: 8,
    },
  ],
  monthly: [
    { week: 1, average: 72, peak: 85, low: 60 },
    { week: 2, average: 78, peak: 90, low: 65 },
    { week: 3, average: 75, peak: 88, low: 62 },
    { week: 4, average: 82, peak: 95, low: 70 },
  ],
  insights: [
    {
      title: "Progreso semanal",
      description: "Tu estabilidad anímica ha mejorado un 15% esta semana",
      trend: "up",
    },
    {
      title: "Impacto de la actividad",
      description: "El ejercicio y la meditación muestran el impacto más positivo",
      trend: "up",
    },
  ],
};

const getMoodEmoji = (value: number) => {
  if (value >= 80) return { icon: Smile, color: "text-green-500" };
  if (value >= 60) return { icon: Meh, color: "text-yellow-500" };
  return { icon: Frown, color: "text-red-500" };
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "positive":
      return "bg-green-500/10 text-green-500";
    case "negative":
      return "bg-red-500/10 text-red-500";
    default:
      return "bg-yellow-500/10 text-yellow-500";
  }
};

export function MoodTracker() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <Card className="border-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Información sobre el estado de ánimo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tu viaje emocional a través del tiempo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Semana
            </Button>
            <Button variant="ghost" size="sm">
              Mes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
         <div className="space-y-4">
          <div className="h-[200px] flex items-end justify-between">
            {moodData.daily.map((day, index) => (
              <div
                key={day.day}
                className="flex flex-col items-center space-y-2 group"
                onClick={() =>
                  setSelectedDay(selectedDay === index ? null : index)
                }
              >
                <AnimatePresence>
                  {selectedDay === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 bg-popover/95 p-4 rounded-lg shadow-lg w-64 space-y-3 backdrop-blur-sm border border-border z-10"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {day.day} actividades
                        </h4>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-sm">{day.value}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {day.activities.map((activity, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg bg-background"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1.5 rounded-md ${getImpactColor(
                                  activity.impact
                                )}`}
                              >
                                <Activity className="w-3 h-3" />
                              </div>
                              <span className="text-sm font-medium">
                                {activity.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {activity.duration}
                              </span>
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  activity.impact === "positive"
                                    ? "bg-green-500"
                                    : activity.impact === "negative"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            Energia
                          </p>
                          <Progress value={day.energy} className="h-1 mt-1" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Dormir</p>
                          <p className="text-sm font-medium">{day.sleep}hrs</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative w-12 cursor-pointer">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${day.value}%` }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-8 rounded-full bg-gradient-to-t from-primary/20 to-primary/30 group-hover:from-primary/30 group-hover:to-primary/40 transition-all absolute bottom-0 left-1/2 -translate-x-1/2 ${
                      selectedDay === index ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {React.createElement(getMoodEmoji(day.value).icon, {
                        className: `w-4 h-4 ${getMoodEmoji(day.value).color}`,
                      })}
                    </div>
                  </motion.div>
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    selectedDay === index
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {moodData.insights.map((insight, index) => (
            <div key={index} className="p-4 rounded-lg bg-primary/5 space-y-2">
              <div className="flex items-center gap-2">
                {insight.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <LineChart className="w-4 h-4 text-yellow-500" />
                )}
                <h4 className="font-medium">{insight.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {insight.description}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Resumen mensual
            </h4>
            <p className="text-sm text-muted-foreground">Estado de ánimo promedio: 77%</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {moodData.monthly.map((week) => (
              <div
                key={week.week}
                className="p-2 rounded-lg bg-primary/5 text-center"
              >
                <p className="text-sm font-medium">Semana {week.week}</p>
                <p className="text-xs text-muted-foreground">
                  Promedio: {week.average}%
                </p>
                <div className="text-xs space-x-2 text-muted-foreground">
                  <span className="text-green-500">↑{week.peak}</span>
                  <span className="text-yellow-500">↓{week.low}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}