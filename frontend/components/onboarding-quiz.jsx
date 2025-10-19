"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import AIChat from "@/components/ai-chat"
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"
import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

export default function OnboardingQuiz() {
  const [step, setStep] = useState("consent")
  const [answers, setAnswers] = useState({})
  const [email, setEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showChat, setShowChat] = useState(false)
  const { user, register, error: authError } =
    useFirebaseAuth?.() ?? { user: null, register: async () => {}, error: "" }
  const displayError = error || authError

  const q = [
    { id: "q1", question: "¿Cuál es tu nombre?", type: "text", placeholder: "Escribe tu nombre completo" },
    { id: "q2", question: "¿Qué te trae por aquí?", type: "radio", options: ["Busco información", "Quiero aprender algo nuevo", "Necesito ayuda con un proyecto", "Solo estoy explorando"] },
    { id: "q3", question: "¿Cuáles son tus intereses? (Selecciona todos los que apliquen)", type: "checkbox", options: ["Tecnología", "Diseño", "Negocios", "Educación", "Entretenimiento"] },
    { id: "q4", question: "¿Con qué frecuencia usarías esta plataforma?", type: "radio", options: ["Diariamente", "Varias veces por semana", "Una vez por semana", "Ocasionalmente"] },
    { id: "q5", question: "¿Qué esperas lograr con nosotros?", type: "text", placeholder: "Cuéntanos tus objetivos" },
  ]
  const idx = q.findIndex(x => x.id === step)
  const progress = step === "consent" ? 0 :
    step === "email" ? 85 :
    step === "verify" ? 90 :
    step === "password" ? 95 :
    step === "complete" ? 100 :
    ((idx + 1) / q.length) * 80

  const setErr = m => (setError(m), m && toast.error(m))
  const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const isGmail = e => e.toLowerCase().endsWith("@gmail.com")
  const wait = ms => new Promise(r => setTimeout(r, ms))

  const goToChatIfAuthed = () => {
    if (auth.currentUser || user) {
      setStep("complete")
      setTimeout(() => setShowChat(true), 1200)
    } else {
      toast.info("Debes iniciar sesión con Firebase para continuar")
      setStep("email")
    }
  }

  const handleNext = () => {
    const current = q[idx], val = answers[current.id]
    if (!val || (Array.isArray(val) && !val.length)) return setErr("Por favor responde esta pregunta antes de continuar")
    setErr("")
    setStep(idx === q.length - 1 ? "email" : q[idx + 1].id)
  }

  const actions = {
    consent: () => (setErr(""), setStep("q1")),
    email: () => !email ? setErr("Por favor ingresa tu correo electrónico")
      : !validateEmail(email) ? setErr("Por favor ingresa un correo electrónico válido")
      : (setErr(""), setStep("confirm-email")),
    confirm: async () => {
      if (email !== confirmEmail) return setErr("Los correos electrónicos no coinciden")
      setErr(""), setIsLoading(true)
      try { await wait(800); toast.success("Correo confirmado ✅"); setStep("verify") }
      catch { setErr("No se pudo confirmar el correo.") }
      finally { setIsLoading(false) }
    },
    verify: async () => {
      if (verificationCode.length !== 6) return setErr("Por favor ingresa el código de 6 dígitos")
      setIsLoading(true), setErr("")
      try {
        await wait(800)
        if (verificationCode !== "123456") return setErr("Código incorrecto.")
        toast.success("Código verificado 🎉")
        isGmail(email) ? goToChatIfAuthed() : setStep("password")
      } catch { setErr("Error al verificar el código.") }
      finally { setIsLoading(false) }
    },
    resend: async () => {
      setIsLoading(true); setErr("")
      try { await wait(600); toast.info(`Código reenviado a ${email}`) }
      catch { setErr("No se pudo reenviar el código") }
      finally { setIsLoading(false) }
    },
    password: async () => {
      if (!password) return setErr("Por favor ingresa una contraseña")
      if (password.length < 8) return setErr("La contraseña debe tener al menos 8 caracteres")
      setErr(""), setIsLoading(true)
      try { await register(email, password); toast.success("Cuenta creada ✅"); goToChatIfAuthed() }
      catch { setErr("No se pudo crear la cuenta.") }
      finally { setIsLoading(false) }
    },
    google: async () => {
      setIsLoading(true); setErr("")
      try { await signInWithPopup(auth, new GoogleAuthProvider()); toast.success("Autenticado con Google ✅"); goToChatIfAuthed() }
      catch { setErr("No se pudo iniciar sesión con Google") }
      finally { setIsLoading(false) }
    }
  }

  if (showChat) return <AIChat userName={answers.q1 || "tu cuenta"} userEmail={email} />

  const showError = displayError && (
    <Alert variant="destructive"><AlertCircle className="h-4 w-4" />
      <AlertDescription>{displayError}</AlertDescription></Alert>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Bienvenido al Oasis</CardTitle>
            {step !== "consent" && step !== "complete" && <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>}
          </div>
          {step !== "consent" && step !== "complete" && <Progress value={progress} className="h-2" />}
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "consent" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Tratamiento de Datos Personales</h3>
              <p className="text-muted-foreground text-sm">Al continuar, aceptas nuestra política de privacidad.</p>
              <Button onClick={actions.consent} className="w-full py-6 font-semibold">Acepto el tratamiento de datos</Button>
            </div>
          )}

          {q.map((ques, i) => step === ques.id && (
            <div key={ques.id} className="space-y-6">
              <h3 className="text-xl font-semibold">{ques.question}</h3>
              <p className="text-sm text-muted-foreground">Pregunta {i + 1} de {q.length}</p>
              {showError}
              {ques.type === "text" && (
                <Input placeholder={ques.placeholder} value={answers[ques.id] || ""} onChange={e => setAnswers({ ...answers, [ques.id]: e.target.value })} />
              )}
              {ques.type === "radio" && (
                <RadioGroup value={answers[ques.id]} onValueChange={v => setAnswers({ ...answers, [ques.id]: v })}>
                  {ques.options.map(opt => (
                    <div key={opt} className="flex items-center gap-2 p-3 border rounded">
                      <RadioGroupItem value={opt} id={opt} /><Label htmlFor={opt}>{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {ques.type === "checkbox" && ques.options.map(opt => {
                const sel = answers[ques.id] || []
                return (
                  <div key={opt} className="flex items-center gap-2 p-3 border rounded">
                    <Checkbox id={opt} checked={sel.includes(opt)} onCheckedChange={c => {
                      const up = c ? [...sel, opt] : sel.filter(o => o !== opt)
                      setAnswers({ ...answers, [ques.id]: up })
                    }} /><Label htmlFor={opt}>{opt}</Label>
                  </div>
                )
              })}
              <div className="flex justify-between pt-4">
                <Button variant="outline" disabled={!i} onClick={() => setStep(i ? q[i - 1].id : "consent")}><ChevronLeft />Anterior</Button>
                <Button onClick={handleNext}><ChevronRight />Siguiente</Button>
              </div>
            </div>
          ))}

          {step === "email" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Crea tu cuenta</h3>
              {showError}
              <Input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <Button onClick={actions.email} disabled={isLoading}>{isLoading ? "Procesando..." : "Continuar"}</Button>
              <Button variant="outline" onClick={actions.google} disabled={isLoading}>Continuar con Google</Button>
            </div>
          )}

          {step === "confirm-email" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Confirma tu correo</h3>
              <Input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} />
              <Button onClick={actions.confirm} disabled={isLoading}>Confirmar</Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Verifica tu correo</h3>
              <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                <InputOTPGroup>{[...Array(6)].map((_, i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
              </InputOTP>
              <Button onClick={actions.verify} disabled={isLoading || verificationCode.length !== 6}>Verificar código</Button>
              <Button variant="ghost" onClick={actions.resend} disabled={isLoading}>Reenviar código</Button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Crea tu contraseña</h3>
              <Input type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
              <Button onClick={actions.password} disabled={isLoading}>Crear cuenta</Button>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center"><div className="rounded-full bg-primary/10 p-6"><CheckCircle2 className="h-16 w-16 text-primary" /></div></div>
              <h3 className="text-2xl font-bold">¡Bienvenido a Calma, {answers.q1 || "amig@"}!</h3>
              <p className="text-muted-foreground">{email}</p>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Preparando tu experiencia...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}