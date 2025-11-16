"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, LogOut, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"

export default function AIChat({ userName, userEmail, onLogout, answers = {} }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userMode, setUserMode] = useState(null)
  const messagesEndRef = useRef(null)
  const conversationHistoryRef = useRef([])

  const { logout } = useFirebaseAuth?.() ?? { logout: async () => {} }
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const GEMINI_MODEL = "gemini-2.5-flash"

  // === Scroll automático ===
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollToBottom() }, [messages])

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
    conversationHistoryRef.current = []
    toast.success("Chat reiniciado 🌱")
    showWelcome()
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
              <Button variant="secondary" size="sm" onClick={handleRefreshChat}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reiniciar
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-3.5 w-3.5" /> Cerrar sesión
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
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
        </CardContent>

        <div className="border-t p-4 bg-card">
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
        </div>
      </Card>
    </div>
  )
}

  // ult code