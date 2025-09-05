"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Activity,
  Sun,
  Moon,
  Heart,
  Trophy,
  Bell,
  AlertCircle,
  PhoneCall,
  Sparkles,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

import { MoodForm } from "@/components/mood/mood-form";
import { AnxietyGames } from "@/components/games/anxiety-games";

import {
  getUserActivities,
  saveMoodData,
  logActivity,
} from "@/lib/static-dashboard-data";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  format,
  subDays,
  startOfDay,
  isWithinInterval,
} from "date-fns";

import { ActivityLogger } from "@/components/activities/activity-logger";
import { useSession } from "@/lib/contexts/session-context";
import { getAllChatSessions } from "@/lib/api/chat";

// Add this type definition
type ActivityLevel = "none" | "low" | "medium" | "high";

interface DayActivity {
  date: Date;
  level: ActivityLevel;
  activities: {
    type: string;
    name: string;
    completed: boolean;
    time?: string;
  }[];
}

interface Activity {
  id: string;
  userId: string | null;
  type: string;
  name: string;
  description: string | null;
  timestamp: Date;
  duration: number | null;
  completed: boolean;
  moodScore: number | null;
  moodNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DailyStats {
  moodScore: number | null;
  completionRate: number;
  mindfulnessCount: number;
  totalActivities: number;
  lastUpdated: Date;
}

const calculateDailyStats = (activities: Activity[]): DailyStats => {
  const today = startOfDay(new Date());
  const todaysActivities = activities.filter((activity) =>
    isWithinInterval(new Date(activity.timestamp), {
      start: today,
      end: addDays(today, 1),
    })
  );

  const moodEntries = todaysActivities.filter(
    (a) => a.type === "mood" && a.moodScore !== null
  );
  const averageMood =
    moodEntries.length > 0
      ? Math.round(
          moodEntries.reduce((acc, curr) => acc + (curr.moodScore || 0), 0) /
            moodEntries.length
        )
      : null;

  const therapySessions = activities.filter((a) => a.type === "therapy").length;

  return {
    moodScore: averageMood,
    completionRate: 100, 
    mindfulnessCount: therapySessions, 
    totalActivities: todaysActivities.length,
    lastUpdated: new Date(),
  };
};

// Rename the function
const generateInsights = (activities: Activity[]) => {
  const insights: {
    title: string;
    description: string;
    icon: any;
    priority: "low" | "medium" | "high";
  }[] = [];


  const lastWeek = subDays(new Date(), 7);
  const recentActivities = activities.filter(
    (a) => new Date(a.timestamp) >= lastWeek
  );


  const moodEntries = recentActivities.filter(
    (a) => a.type === "mood" && a.moodScore !== null
  );
  if (moodEntries.length >= 2) {
    const averageMood =
      moodEntries.reduce((acc, curr) => acc + (curr.moodScore || 0), 0) /
      moodEntries.length;
    const latestMood = moodEntries[moodEntries.length - 1].moodScore || 0;

    if (latestMood > averageMood) {
      insights.push({
        title: "Mejora del estado de ánimo",
        description:
          "Tus puntuaciones recientes de humor están por encima de tu promedio semanal. ¡Sigue así!",
        icon: Brain,
        priority: "high",
      });
    } else if (latestMood < averageMood - 20) {
      insights.push({
        title: "Cambio de humor detectado",
        description:
          "He notado que tu estado de ánimo ha bajado. ¿Te gustaría probar alguna actividad para levantar el ánimo?",
        icon: Heart,
        priority: "high",
      });
    }
  }

  const mindfulnessActivities = recentActivities.filter((a) =>
    ["game", "meditation", "breathing"].includes(a.type)
  );
  if (mindfulnessActivities.length > 0) {
    const dailyAverage = mindfulnessActivities.length / 7;
    if (dailyAverage >= 1) {
      insights.push({
        title: "Práctica consistente",
        description: `Has estado practicando mindfulness con regularidad. Esto puede ayudarte a reducir el estrés y mejorar la concentración.`,
        icon: Trophy,
        priority: "medium",
      });
    } else {
      insights.push({
        title: "Oportunidad de atención plena",
        description:
          "Intente incorporar más actividades de atención plena en su rutina diaria.",
        icon: Sparkles,
        priority: "low",
      });
    }
  }

  const completedActivities = recentActivities.filter((a) => a.completed);
  const completionRate =
    recentActivities.length > 0
      ? (completedActivities.length / recentActivities.length) * 100
      : 0;

  if (completionRate >= 80) {
    insights.push({
      title: "Alto rendimiento",
      description: `Has completado ${Math.round(
        completionRate
      )}% de tus actividades esta semana. ¡Excelente compromiso!`,
      icon: Trophy,
      priority: "high",
    });
  } else if (completionRate < 50) {
    insights.push({
      title: "Recordatorio de actividad",
      description:
        "Podría resultar beneficioso para usted establecer metas diarias más pequeñas y alcanzables.",
      icon: Calendar,
      priority: "medium",
    });
  }

  const morningActivities = recentActivities.filter(
    (a) => new Date(a.timestamp).getHours() < 12
  );
  const eveningActivities = recentActivities.filter(
    (a) => new Date(a.timestamp).getHours() >= 18
  );

  if (morningActivities.length > eveningActivities.length) {
    insights.push({
      title: "Persona mañanera",
      description:
        "Estás más activo por las mañanas. Considera programar tareas importantes durante tus horas pico.",
      icon: Sun,
      priority: "medium",
    });
  } else if (eveningActivities.length > morningActivities.length) {
    insights.push({
      title: "Rutina nocturna",
      description:
        "Tiendes a estar más activo por las noches. Asegúrate de relajarte antes de acostarte.",
      icon: Moon,
      priority: "medium",
    });
  }

  return insights
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const { user } = useSession();

  const [insights, setInsights] = useState<
    {
      title: string;
      description: string;
      icon: any;
      priority: "low" | "medium" | "high";
    }[]
  >([]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showCheckInChat, setShowCheckInChat] = useState(false);
  const [activityHistory, setActivityHistory] = useState<DayActivity[]>([]);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    moodScore: null,
    completionRate: 100,
    mindfulnessCount: 0,
    totalActivities: 0,
    lastUpdated: new Date(),
  });

  const transformActivitiesToDayActivity = (
    activities: Activity[]
  ): DayActivity[] => {
    const days: DayActivity[] = [];
    const today = new Date();

    for (let i = 27; i >= 0; i--) {
      const date = startOfDay(subDays(today, i));
      const dayActivities = activities.filter((activity) =>
        isWithinInterval(new Date(activity.timestamp), {
          start: date,
          end: addDays(date, 1),
        })
      );

      let level: ActivityLevel = "none";
      if (dayActivities.length > 0) {
        if (dayActivities.length <= 2) level = "low";
        else if (dayActivities.length <= 4) level = "medium";
        else level = "high";
      }

      days.push({
        date,
        level,
        activities: dayActivities.map((activity) => ({
          type: activity.type,
          name: activity.name,
          completed: activity.completed,
          time: format(new Date(activity.timestamp), "h:mm a"),
        })),
      });
    }

    return days;
  };

  const loadActivities = useCallback(async () => {
    try {
      const userActivities = await getUserActivities("default-user");
      setActivities(userActivities);
      setActivityHistory(transformActivitiesToDayActivity(userActivities));
    } catch (error) {
      console.error("Error cargando actividades:", error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      setDailyStats(calculateDailyStats(activities));
    }
  }, [activities]);

  useEffect(() => {
    if (activities.length > 0) {
      setInsights(generateInsights(activities));
    }
  }, [activities]);

  const fetchDailyStats = useCallback(async () => {
    try {
      const sessions = await getAllChatSessions();

      const activitiesResponse = await fetch("/api/activities/today");
      if (!activitiesResponse.ok) throw new Error("Fallo en conseguir las actividades");
      const activities = await activitiesResponse.json();

      const moodEntries = activities.filter(
        (a: Activity) => a.type === "mood" && a.moodScore !== null
      );
      const averageMood =
        moodEntries.length > 0
          ? Math.round(
              moodEntries.reduce(
                (acc: number, curr: Activity) => acc + (curr.moodScore || 0),
                0
              ) / moodEntries.length
            )
          : null;

      setDailyStats({
        moodScore: averageMood,
        completionRate: 100,
        mindfulnessCount: sessions.length,
        totalActivities: activities.length,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error("Error consiguiendo estadisticas diarias:", error);
    }
  }, []);

  useEffect(() => {
    fetchDailyStats();
    const interval = setInterval(fetchDailyStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDailyStats]);

  const wellnessStats = [
    {
      title: "Puntuación del estado de ánimo",
      value: dailyStats.moodScore ? `${dailyStats.moodScore}%` : "No hay datos",
      icon: Brain,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Estado de ánimo promedio de hoy",
    },
    {
      title: "Tasa de finalización",
      value: "100%",
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      description: "Tasa de finalización perfecta",
    },
    {
      title: "Sesiones de terapia",
      value: `${dailyStats.mindfulnessCount} sessions`,
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      description: "Total de sesiones completas",
    },
    {
      title: "Total de Actividades",
      value: dailyStats.totalActivities.toString(),
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Planeado para hoy",
    },
  ];

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleStartTherapy = () => {
    router.push("/therapy/new");
  };

  const handleMoodSubmit = async (data: { moodScore: number }) => {
    setIsSavingMood(true);
    try {
      await saveMoodData({
        userId: "default-user",
        mood: data.moodScore,
        note: "",
      });
      setShowMoodModal(false);
    } catch (error) {
      console.error("Error guardando el mood:", error);
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleAICheckIn = () => {
    setShowActivityLogger(true);
  };

  const handleGamePlayed = useCallback(
    async (gameName: string, description: string) => {
      try {
        await logActivity({
          userId: "default-user",
          type: "game",
          name: gameName,
          description: description,
          duration: 0,
        });

        loadActivities();
      } catch (error) {
        console.error("Error iniciando el modo juego:", error);
      }
    },
    [loadActivities]
  );

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-20 pb-8 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenido otra vez, {user?.name || "there"}
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString("es-ES", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />
              <CardContent className="p-6 relative">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Acciones Rápidas</h3>
                      <p className="text-sm text-muted-foreground">
                        Comienza tu viaje de bienestar
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Button
                      variant="default"
                      className={cn(
                        "w-full justify-between items-center p-6 h-auto group/button",
                        "bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90",
                        "transition-all duration-200 group-hover:translate-y-[-2px]"
                      )}
                      onClick={handleStartTherapy}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-white">
                            Iniciar terapia
                          </div>
                          <div className="text-xs text-white/80">
                            Iniciar una nueva sesión
                          </div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover/button:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/mood hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={() => setShowMoodModal(true)}
                      >
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                          <Heart className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Seguimiento del estado de ánimo</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            ¿Cómo te sientes?
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/ai hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={handleAICheckIn}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                          <BrainCircuit className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Registrarse</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Control rápido de bienestar
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resumen de hoy</CardTitle>
                    <CardDescription>
                      Sus métricas de bienestar para{" "}
                      {format(new Date(), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchDailyStats}
                    className="h-8 w-8"
                  >
                    <Loader2 className={cn("h-4 w-4", "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {wellnessStats.map((stat) => (
                    <div
                      key={stat.title}
                      className={cn(
                        "p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                        stat.bgColor
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                        <p className="text-sm font-medium">{stat.title}</p>
                      </div>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-right">
                  Última actualización: {format(dailyStats.lastUpdated, "h:mm a")}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Insights
                </CardTitle>
                <CardDescription>
                  Recomendaciones personalizadas basadas en tus patrones de actividad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg space-y-2 transition-all hover:scale-[1.02]",
                          insight.priority === "high"
                            ? "bg-primary/10"
                            : insight.priority === "medium"
                            ? "bg-primary/5"
                            : "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <insight.icon className="w-5 h-5 text-primary" />
                          <p className="font-medium">{insight.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>
                        Completa más actividades para recibir información personalizada.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
   
            <div className="lg:col-span-3 space-y-6">
             
              <AnxietyGames onGamePlayed={handleGamePlayed} />
            </div>
          </div>
        </div>
      </Container>

      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
            <DialogDescription>
             Mueva el control deslizante para realizar un seguimiento de su estado de ánimo actual
            </DialogDescription>
          </DialogHeader>
          <MoodForm onSuccess={() => setShowMoodModal(false)} />
        </DialogContent>
      </Dialog>

      {/* AI check-in chat */}
      {showCheckInChat && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background border-l shadow-lg">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold">Registro de IA</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCheckInChat(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4"></div>
            </div>
          </div>
        </div>
      )}

      <ActivityLogger
        open={showActivityLogger}
        onOpenChange={setShowActivityLogger}
        onActivityLogged={loadActivities}
      />
    </div>
  );
}