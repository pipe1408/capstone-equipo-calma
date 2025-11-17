"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Send, Bot, User, LogOut, RefreshCw, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"

const STREAK_STORAGE_KEY = "calma-streaks"

const toISODateString = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseISODate = (isoString) => {
  if (!isoString) return null
  const [year, month, day] = isoString.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

const differenceInDays = (a, b) => {
  if (!a || !b) return 0
  const first = new Date(a)
  const second = new Date(b)
  first.setHours(0, 0, 0, 0)
  second.setHours(0, 0, 0, 0)
  return Math.round((first.getTime() - second.getTime()) / (1000 * 60 * 60 * 24))
}

const seedStreakDays = () => {
  const today = new Date()
  const collection = []
  for (let i = 0; i < 12; i++) {
    if (i === 6 || i === 9) continue
    const target = new Date(today)
    target.setDate(today.getDate() - i)
    collection.push(toISODateString(target))
  }
  return collection.sort()
}

const calculateStreakMetrics = (days) => {
  if (!Array.isArray(days) || !days.length) {
    return { currentStreak: 0, longestStreak: 0, lastCheckIn: null, totalCheckIns: 0 }
  }

  const sorted = [...days].sort()
  let longest = 1
  let currentRun = 1

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = parseISODate(sorted[i - 1])
    const currentDate = parseISODate(sorted[i])
    const diff = differenceInDays(currentDate, prevDate)
    if (diff === 0) continue
    if (diff === 1) {
      currentRun += 1
    } else {
      currentRun = 1
    }
    if (currentRun > longest) longest = currentRun
  }

  const lastCheckIn = sorted[sorted.length - 1]
  const todayDiff = differenceInDays(new Date(), parseISODate(lastCheckIn))
  const currentStreak = todayDiff <= 1 ? currentRun : 0

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentRun),
    lastCheckIn,
    totalCheckIns: sorted.length,
  }
}

const getNextMilestone = (currentStreak) => {
  const milestones = [3, 7, 14, 21, 30]
  return milestones.find((goal) => goal > currentStreak) ?? (currentStreak || 0) + 1
}

const formatDisplayDate = (isoString) => {
  if (!isoString) return "Aún no registras una racha"
  const date = parseISODate(isoString)
  const formatted = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function AIChat({ userName, userEmail, onLogout, answers = {} }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userMode, setUserMode] = useState(null)
  const [showStreaks, setShowStreaks] = useState(false)
  const [streakDays, setStreakDays] = useState([])
  const messagesEndRef = useRef(null)
  const conversationHistoryRef = useRef([])

  const { logout } = useFirebaseAuth?.() ?? { logout: async () => {} }
  console.log("🔑 Gemini key en runtime:", process.env.NEXT_PUBLIC_GEMINI_API_KEY)
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const GEMINI_MODEL = "gemini-2.5-flash"

  const streakStats = useMemo(() => calculateStreakMetrics(streakDays), [streakDays])
  const selectedStreakDates = useMemo(
    () => streakDays.map((day) => parseISODate(day)).filter(Boolean),
    [streakDays]
  )
  const defaultCalendarMonth = selectedStreakDates[selectedStreakDates.length - 1] || new Date()
  const nextMilestone = getNextMilestone(streakStats.currentStreak)
  const daysToMilestone = Math.max(nextMilestone - streakStats.currentStreak, 0)

  // === Scroll automático ===
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollToBottom() }, [messages])
  useEffect(() => { if (!showStreaks) scrollToBottom() }, [showStreaks])

  // === Persistencia de rachas en localStorage ===
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(STREAK_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setStreakDays(parsed)
          return
        }
      }
      const seeded = seedStreakDays()
      setStreakDays(seeded)
      window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(seeded))
    } catch (err) {
      console.error("Error cargando rachas", err)
    }
  }, [])

  // === BIENVENIDA ===
  const showWelcome = () => {
    const welcomeText = `¡Hola ${userName || "amig@"}! 🌿
Bienvenido a tu espacio de calma.
Hoy podemos hacer distintas cosas:
1️⃣ Hablar y desahogarte  
2️⃣ Realizar ejercicios o rutinas  
3️⃣ Recibir consejos o ideas prácticas  

Escribe el número o la opción que prefieras para comenzar.`

    const hiddenContext = `
Eres Calma, una IA empática enfocada en bienestar emocional.
Usuario: ${userName || "Invitado"}
Correo: ${userEmail || "No proporcionado"}
Respuestas del onboarding: ${JSON.stringify(answers, null, 2)}
Cuando el usuario elija 1, 2 o 3:
1 = conversación empática
2 = ejercicio guiado
3 = consejo práctico
Habla con calidez y evita repetir saludos salvo si se reinicia el chat.
`

    setMessages([{ id: 1, role: "assistant", content: welcomeText }])
    conversationHistoryRef.current = [
      { role: "user", parts: [{ text: hiddenContext }] },
      { role: "model", parts: [{ text: welcomeText }] },
    ]
  }

  useEffect(() => { showWelcome() }, [userName, userEmail, answers])

  // === CERRAR SESIÓN ===
  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      setMessages([])
      setInput("")
      conversationHistoryRef.current = []
      setShowStreaks(false)
      toast.success("Sesión cerrada. ¡Hasta pronto!")
      onLogout?.()
    } catch {
      toast.error("Error al cerrar sesión")
    } finally {
      setIsLoggingOut(false)
    }
  }

  // === REINICIAR CHAT ===
  const handleRefreshChat = () => {
    if (isTyping) return
    setMessages([])
    setInput("")
    setUserMode(null)
    setShowStreaks(false)
    conversationHistoryRef.current = []
    toast.success("Chat reiniciado 🌱")
    showWelcome()
  }

  const handleToggleCalendar = () => setShowStreaks((prev) => !prev)

  const recordStreakCheckIn = () => {
    const todayISO = toISODateString(new Date())
    setStreakDays((prev) => {
      if (prev.includes(todayISO)) return prev
      const updated = [...prev, todayISO].sort()
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated))
      }
      return updated
    })
  }

  // === OBTENER CONTEXTO EMOCIONAL DESDE QUIZ ===
  const getEmotionalContext = () => {
    const mood = answers.q2 || ""
    const sleep = answers.q6 || ""
    const energy = answers.q5 || ""
    const social = answers.q3 || ""
    const goal = answers.q9 || ""
    const style = answers.q10 || ""
    const summary = `
Estado de ánimo: ${mood}.
Energía: ${energy}.
Sueño: ${sleep}.
Apoyo social: ${social}.
Objetivo: ${goal}.
Preferencia de acompañamiento: ${style}.
`
    return summary
  }

  // === ENVIAR A GEMINI ===
  const sendToGemini = async (userText) => {
    if (!GEMINI_API_KEY) {
      toast.error("Falta la clave de API de Gemini")
      return
    }

    const userMsg = { role: "user", parts: [{ text: userText }] }
    const placeholderId = Date.now()
    setIsTyping(true)
    setMessages((prev) => [...prev, { id: placeholderId, role: "assistant", content: "..." }])

    try {
      const emotionalContext = getEmotionalContext()

      const persistentContext = {
        role: "user",
        parts: [
          { text: `Contexto persistente del usuario:` },
          { text: `Nombre: ${userName || "Invitado"}` },
          { text: `Correo: ${userEmail || "No proporcionado"}` },
          { text: `Modo activo actual: ${userMode || "sin modo"}` },
          { text: `Contexto emocional y de bienestar: ${emotionalContext}` },
        ],
      }

      const body = JSON.stringify({
        contents: [persistentContext, ...conversationHistoryRef.current, userMsg],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      })

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      )

      const data = await res.json()
      console.log("Gemini response:", data)

      let text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text ||
        data?.output || data?.text || null

      if (!text || !text.trim()) {
        // Fallback según modo
        if (userMode === 3) {
          let topic = "bienestar general"
          if (emotionalContext.includes("baja")) topic = "energía baja"
          if (emotionalContext.includes("dormir mal") || emotionalContext.includes("Me cuesta dormir")) topic = "sueño y descanso"
          if (emotionalContext.includes("Regular") || emotionalContext.includes("Más o menos")) topic = "ánimo variable"
          text = `Puedo ofrecerte algunos consejos sobre ${topic} 🌱:
1️⃣ Empieza con algo pequeño que te haga sentir bien hoy.
2️⃣ Haz una pausa de 5 minutos para respirar profundo.
3️⃣ Evita saturarte con redes o noticias.
¿Quieres que profundice en estrategias para ${topic}?`
        } else if (userMode === 2) {
          text = "Vamos con un ejercicio breve ✨:\nInhala profundo 4 segundos… mantén 4 segundos… exhala lento 6 segundos 🌬️\n¿Quieres hacer otro ejercicio guiado?"
        } else {
          text = "Estoy aquí para escucharte 🌿, cuéntame un poco más."
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === placeholderId ? { ...m, content: text } : m))
      )
      conversationHistoryRef.current.push(userMsg, { role: "model", parts: [{ text }] })
    } catch (err) {
      toast.error("Error al conectar con Gemini")
      console.error(err)
    } finally {
      setIsTyping(false)
    }
  }

  // === ENVÍO Y MANEJO DE MODO ===
  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    let interpretedPrompt = trimmed.toLowerCase()

    // reiniciar menú
    if (["menu", "menú", "cambiar", "volver", "otra cosa"].some((w) => interpretedPrompt.includes(w))) {
      setUserMode(null)
      showWelcome()
      setInput("")
      return
    }

    // detectar elección inicial
    if (!userMode) {
      if (["1", "uno", "hablar"].includes(interpretedPrompt)) {
        setUserMode(1)
        interpretedPrompt = "El usuario eligió hablar y desahogarse. Inicia una conversación empática."
      } else if (["2", "dos", "ejercicio", "rutina"].includes(interpretedPrompt)) {
        setUserMode(2)
        interpretedPrompt = "El usuario eligió ejercicios guiados. Propón un ejercicio de respiración o mindfulness."
      } else if (["3", "tres", "consejo", "idea"].includes(interpretedPrompt)) {
        setUserMode(3)
        interpretedPrompt = `El usuario eligió recibir consejos prácticos. 
Sus respuestas emocionales del quiz son: ${getEmotionalContext()} 
Ofrece consejos adaptados a ese contexto.`
      } else {
        interpretedPrompt = `El usuario dijo "${trimmed}" antes de elegir modo. Invítalo a elegir 1️⃣, 2️⃣ o 3️⃣.`
      }
    } else {
      if (userMode === 1)
        interpretedPrompt = `Modo conversación empática. Usuario dice: "${trimmed}". Responde validando emociones y escuchando.`
      else if (userMode === 2)
        interpretedPrompt = `Modo ejercicios guiados. Usuario dice: "${trimmed}". Continúa con un ejercicio relajante.`
      else if (userMode === 3)
        interpretedPrompt = `Modo consejos prácticos. Usuario dice: "${trimmed}". Da recomendaciones realistas según su contexto: ${getEmotionalContext()}`
    }

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: trimmed }])
    setInput("")
    recordStreakCheckIn()
    sendToGemini(interpretedPrompt)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // === UI ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[600px] shadow-2xl border-2 flex flex-col">
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Calma
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                ¡Hola {userName || "amig@"}! Tu espacio de calma está listo 🌿
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={showStreaks ? "default" : "outline"} size="sm" onClick={handleToggleCalendar}>
                <CalendarDays className="mr-2 h-3.5 w-3.5" />
                {showStreaks ? "Volver al chat" : "Ver rachas"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleRefreshChat}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reiniciar
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-3.5 w-3.5" /> Cerrar sesión
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`flex-1 overflow-y-auto p-6 ${showStreaks ? "" : "space-y-4"}`}>
          {showStreaks ? (
            <div className="flex h-full flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold">Calendario de rachas</h2>
                <p className="text-sm text-muted-foreground">
                  Revisa tus check-ins diarios y celebra tu constancia con Calma.
                </p>
              </div>
              <div className="grid flex-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-card/50 p-4">
                    <p className="text-sm text-muted-foreground">Racha actual</p>
                    <p className="text-3xl font-semibold">{streakStats.currentStreak} días</p>
                    <p className="text-xs text-muted-foreground">
                      Tu mejor racha es de {streakStats.longestStreak} días.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Próximo objetivo</p>
                    <p className="text-lg font-medium">
                      {nextMilestone} días ({daysToMilestone} más)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mantén tu ritmo y alcanzas el siguiente hito.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-card/50 p-4">
                    <p className="text-sm text-muted-foreground">Último check-in</p>
                    <p className="text-lg font-medium">{formatDisplayDate(streakStats.lastCheckIn)}</p>
                    <p className="text-xs text-muted-foreground">
                      Has registrado {streakStats.totalCheckIns} días en total.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/80 p-4">
                  <Calendar
                    mode="multiple"
                    selected={selectedStreakDates}
                    defaultMonth={defaultCalendarMonth}
                    showOutsideDays
                    className="mx-auto"
                    modifiers={{ streak: selectedStreakDates }}
                    modifiersClassNames={{
                      streak: "bg-primary text-primary-foreground hover:bg-primary/90",
                    }}
                  />
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Los días resaltados muestran cuando volviste a tu espacio de calma.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className={m.role === "user" ? "bg-primary" : "bg-accent"}>
                    <AvatarFallback>
                      {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex-1 max-w-[80%] rounded-2xl p-4 ${
                      m.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="bg-accent">
                    <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl p-4 flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce delay-150" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce delay-300" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        <div className="border-t p-4 bg-card">
          {showStreaks ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mantén tu racha viva volviendo al chat y sumando un nuevo check-in.
              </p>
              <Button onClick={() => setShowStreaks(false)} size="sm">
                Regresar al chat
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              {userMode && (
                <span className="text-xs text-muted-foreground px-3 py-1 bg-primary/10 rounded-full">
                  🌼 Modo: {userMode === 1 ? "Conversación" : userMode === 2 ? "Ejercicios" : "Consejos"}
                </span>
              )}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  userMode
                    ? "Escribe tu mensaje (o 'menú' para volver al inicio)..."
                    : "Escribe tu mensaje..."
                }
                className="flex-1 text-base py-6"
                disabled={isTyping}
              />
              <Button onClick={handleSend} size="lg" disabled={isTyping || !input.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

  // ult code
