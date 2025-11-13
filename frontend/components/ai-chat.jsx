"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, LogOut } from "lucide-react"
import { toast } from "sonner"
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"

export default function AIChat({ userName, userEmail, onLogout }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const messagesEndRef = useRef(null)
  const { logout } = useFirebaseAuth?.() ?? { logout: async () => {} }

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollToBottom() }, [messages])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      setMessages([])
      setInput("")
      toast.success("Sesión cerrada. ¡Hasta pronto!")
      onLogout?.()
    } catch (err) {
      const msgErr = err instanceof Error ? err.message : "No pudimos cerrar sesión"
      toast.error(msgErr)
      console.error("Logout error:", err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) {
      toast.warning("Escribe un mensaje primero")
      return
    }

    const userMessage = { id: messages.length + 1, role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      // Aquí iría tu llamada real a la API del chat:
      // const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ msg: input, userName, userEmail }) })
      // if (!res.ok) throw new Error('El servidor no respondió correctamente')
      // const data = await res.json()
      await new Promise((r) => setTimeout(r, 800))

      const aiMessage = {
        id: userMessage.id + 1,
        role: "assistant",
        content:
          "Esta es una respuesta de demostración. Aquí se conectará tu IA real para proporcionar respuestas inteligentes y personalizadas.",
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const msgErr = err instanceof Error ? err.message : "Error inesperado"
      toast.error(`Chat falló: ${msgErr}`)
      console.error("Chat error:", err)
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
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Calma
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                ¡Hola {userName || 'amig@'}! Bienvenido a tu espacio de calma. ¿En qué puedo ayudarte hoy?
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                En línea
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3 max-w-md">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Bot className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Comienza una conversación</h3>
                <p className="text-sm text-muted-foreground">
                  Escribe un mensaje para empezar a chatear con tu asistente de IA
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-in fade-in duration-500 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className={message.role === "user" ? "bg-primary" : "bg-accent"}>
                <AvatarFallback>
                  {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex-1 max-w-[80%] rounded-2xl p-4 ${
                  message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-in fade-in duration-500">
              <Avatar className="bg-accent">
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-4 bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1 text-base py-6"
              disabled={isTyping}
            />
            <Button onClick={handleSend} size="lg" className="px-6" disabled={isTyping || !input.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
