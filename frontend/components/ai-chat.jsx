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
  const messagesEndRef = useRef(null)
  const { logout } = useFirebaseAuth?.() ?? { logout: async () => {} }

  // === 🔑 CONFIGURACIÓN GEMINI 2.5 FUNCIONAL ===
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const MODEL = "gemini-2.5-flash"
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

  // === AUTOSCROLL ===
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => scrollToBottom(), [messages])

  // === LOGOUT ===
  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      setMessages([])
      setInput("")
      toast.success("Sesión cerrada. ¡Hasta pronto!")
      onLogout?.()
    } catch {
      toast.error("Error al cerrar sesión")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleRefresh = () => {
    setMessages([])
    setInput("")
    toast.success("Chat reiniciado")
  }

  // === ENVÍO DE MENSAJE ===
  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) {
      toast.warning("Escribe un mensaje primero")
      return
    }
    if (!API_KEY) {
      toast.error("Falta la API Key de Gemini en .env.local")
      return
    }

    const userMsg = { id: Date.now(), role: "user", content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    try {
      const context = `
Eres Calma, un asistente empático y claro.
Usuario: ${userName || "Invitado"} (${userEmail || "sin correo"}).
Respuestas del onboarding: ${JSON.stringify(answers, null, 2)}.
Responde de forma breve, comprensiva y práctica.
      `
      const body = {
        contents: [
          { role: "user", parts: [{ text: context }] },
          { role: "user", parts: [{ text: trimmed }] },
        ],
      }

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        console.error("Gemini response:", data)
        throw new Error(data?.error?.message || "Fallo de API Gemini")
      }

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "No tengo una respuesta disponible por ahora."

      const aiMsg = { id: userMsg.id + 1, role: "assistant", content: text }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      console.error("Gemini error:", err)
      toast.error(`Error al conectar con Gemini: ${err.message}`)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[600px] shadow-2xl border-2 flex flex-col">
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-accent/10 flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Calma
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              ¡Hola {userName || "amig@"}! Bienvenido a tu espacio de calma 💬
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isTyping}>
              <RefreshCw className="mr-1 h-4 w-4" /> Reiniciar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar className={msg.role === "user" ? "bg-primary" : "bg-accent"}>
                <AvatarFallback>
                  {msg.role === "user" ? <User /> : <Bot />}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2 items-center text-muted-foreground text-sm">
              <Bot className="h-5 w-5" />
              <span>Escribiendo...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-4 bg-card flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={isTyping}
            className="flex-1 text-base py-6"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  )
}