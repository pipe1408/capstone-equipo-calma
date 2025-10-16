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
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import AIChat from "@/components/ai-chat"

// Firebase
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

  const questions = [
    { id: "q1", question: "¿Cuál es tu nombre?", type: "text", placeholder: "Escribe tu nombre completo" },
    {
      id: "q2",
      question: "¿Qué te trae por aquí?",
      type: "radio",
      options: ["Busco información", "Quiero aprender algo nuevo", "Necesito ayuda con un proyecto", "Solo estoy explorando"],
    },
    {
      id: "q3",
      question: "¿Cuáles son tus intereses? (Selecciona todos los que apliquen)",
      type: "checkbox",
      options: ["Tecnología", "Diseño", "Negocios", "Educación", "Entretenimiento"],
    },
    {
      id: "q4",
      question: "¿Con qué frecuencia usarías esta plataforma?",
      type: "radio",
      options: ["Diariamente", "Varias veces por semana", "Una vez por semana", "Ocasionalmente"],
    },
    { id: "q5", question: "¿Qué esperas lograr con nosotros?", type: "text", placeholder: "Cuéntanos tus objetivos" },
  ]

  const currentQuestionIndex = questions.findIndex((q) => q.id === step)
  const progress =
    step === "consent"
      ? 0
      : step === "email"
      ? 85
      : step === "verify"
      ? 90
      : step === "password"
      ? 95
      : step === "complete"
      ? 100
      : ((currentQuestionIndex + 1) / questions.length) * 80

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isGmailAccount = (email) => email.toLowerCase().endsWith("@gmail.com")

  const setErr = (msg) => {
    setError(msg)
    if (msg) toast.error(msg)
  }

  const goToChatIfAuthed = () => {
    const isAuthed = !!(auth.currentUser || user)
    if (isAuthed) {
      setStep("complete")
      setTimeout(() => setShowChat(true), 1200)
    } else {
      toast.info("Debes iniciar sesión con Firebase para continuar")
      setStep("email")
    }
  }

  const handleConsent = () => {
    setErr("")
    setStep("q1")
  }

  const handleAnswer = (questionId, value) => {
    setErr("")
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex]
    const val = answers[currentQuestion.id]
    if (!val || (Array.isArray(val) && val.length === 0)) {
      return setErr("Por favor responde esta pregunta antes de continuar")
    }
    setErr("")
    if (currentQuestionIndex === questions.length - 1) setStep("email")
    else setStep(questions[currentQuestionIndex + 1].id)
  }

  const handleEmailSubmit = () => {
    if (!email) return setErr("Por favor ingresa tu correo electrónico")
    if (!validateEmail(email)) return setErr("Por favor ingresa un correo electrónico válido")
    setErr("")
    setStep("confirm-email")
  }

  const handleConfirmEmail = async () => {
    if (email !== confirmEmail) return setErr("Los correos electrónicos no coinciden")
    setErr("")
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      toast.success("Correo confirmado ✅")
      setStep("verify")
    } catch {
      setErr("No se pudo confirmar el correo. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return setErr("Por favor ingresa el código de 6 dígitos")
    setIsLoading(true)
    setErr("")
    try {
      await new Promise((r) => setTimeout(r, 800))
      const correctCode = "123456"
      if (verificationCode !== correctCode) {
        return setErr("Código incorrecto. Por favor intenta de nuevo.")
      }
      toast.success("Código verificado 🎉")
      if (isGmailAccount(email)) {
        goToChatIfAuthed()
      } else {
        setStep("password")
      }
    } catch {
      setErr("Error al verificar el código. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setErr("")
    try {
      await new Promise((r) => setTimeout(r, 600))
      toast.info(`Código reenviado a ${email}`)
    } catch {
      setErr("No se pudo reenviar el código")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!password) return setErr("Por favor ingresa una contraseña")
    if (password.length < 8) return setErr("La contraseña debe tener al menos 8 caracteres")
    setErr("")
    setIsLoading(true)
    try {
      await register(email, password)
      toast.success("Cuenta creada ✅")
      goToChatIfAuthed()
    } catch {
      setErr("No se pudo crear la cuenta. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErr("")
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      toast.success("Autenticado con Google ✅")
      goToChatIfAuthed()
    } catch {
      setErr("No se pudo iniciar sesión con Google")
    } finally {
      setIsLoading(false)
    }
  }

  if (showChat) {
    return <AIChat userName={answers.q1 || "tu cuenta"} userEmail={email} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Bienvenido al Oasis
            </CardTitle>
            {step !== "consent" && step !== "complete" && (
              <span className="text-sm text-muted-foreground font-medium">
                {Math.round(progress)}%
              </span>
            )}
          </div>
          {step !== "consent" && step !== "complete" && (
            <Progress value={progress} className="h-2" />
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "consent" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  Tratamiento de Datos Personales
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                  <p>
                    Al continuar, aceptas que recopilemos y procesemos tu
                    información personal de acuerdo con nuestra política de
                    privacidad.
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Recopilamos datos para mejorar tu experiencia</li>
                    <li>Tu información está protegida y encriptada</li>
                    <li>Puedes solicitar la eliminación de tus datos</li>
                    <li>No compartimos tu información sin tu consentimiento</li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={handleConsent}
                className="w-full text-sm sm:text-base py-6 font-semibold"
                size="lg"
              >
                Acepto el tratamiento de datos
              </Button>
            </div>
          )}

          {/* 🔹 PREGUNTAS con flechas */}
          {questions.map(
            (question, index) =>
              step === question.id && (
                <div
                  key={question.id}
                  className="space-y-6 animate-in fade-in duration-500"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {question.question}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Pregunta {index + 1} de {questions.length}
                    </p>
                  </div>

                  {displayError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{displayError}</AlertDescription>
                    </Alert>
                  )}

                  {question.type === "text" && (
                    <Input
                      placeholder={question.placeholder}
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleAnswer(question.id, e.target.value)
                      }
                      className="text-base py-6"
                    />
                  )}

                  {question.type === "radio" && (
                    <RadioGroup
                      value={answers[question.id]}
                      onValueChange={(value) =>
                        handleAnswer(question.id, value)
                      }
                      className="space-y-3"
                    >
                      {question.options.map((option) => (
                        <div
                          key={option}
                          className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <RadioGroupItem value={option} id={option} />
                          <Label
                            htmlFor={option}
                            className="flex-1 cursor-pointer text-base"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === "checkbox" && (
                    <div className="space-y-3">
                      {question.options.map((option) => (
                        <div
                          key={option}
                          className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={option}
                            checked={(answers[question.id] || []).includes(
                              option
                            )}
                            onCheckedChange={(checked) => {
                              const current = answers[question.id] || []
                              const updated = checked
                                ? [...current, option]
                                : current.filter((item) => item !== option)
                              handleAnswer(question.id, updated)
                            }}
                          />
                          <Label
                            htmlFor={option}
                            className="flex-1 cursor-pointer text-base"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🔸 Flechas de navegación */}
                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={() =>
                        index === 0
                          ? setStep("consent")
                          : setStep(questions[index - 1].id)
                      }
                      className={`flex items-center gap-2 ${
                        index === 0 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={index === 0}
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    <Button
                      onClick={handleNext}
                      className="flex items-center gap-2 text-base py-6 font-semibold"
                      size="lg"
                    >
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
          )}

          {/* 🔹 Pasos de email / verify / password / complete (sin cambios) */}

          {step === "email" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-semibold text-foreground">
                Crea tu cuenta
              </h3>
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo electrónico para continuar
              </p>
              {displayError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-base py-6"
              />
              <Button
                onClick={handleEmailSubmit}
                className="w-full text-base py-6 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Procesando..." : "Continuar"}
              </Button>
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full text-base py-6 font-semibold bg-transparent"
                disabled={isLoading}
              >
                Continuar con Google
              </Button>
            </div>
          )}

          {step === "confirm-email" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-semibold text-foreground">
                Confirma tu correo
              </h3>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="text-base py-6"
              />
              <Button
                onClick={handleConfirmEmail}
                className="w-full text-base py-6 font-semibold"
                disabled={isLoading}
              >
                Confirmar
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-semibold text-foreground">
                Verifica tu correo
              </h3>
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={(value) => {
                  setVerificationCode(value)
                  setErr("")
                }}
              >
                <InputOTPGroup>
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button
                onClick={handleVerifyCode}
                className="w-full text-base py-6 font-semibold"
                disabled={isLoading || verificationCode.length !== 6}
              >
                Verificar código
              </Button>
              <Button
                onClick={handleResendCode}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                Reenviar código
              </Button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-semibold text-foreground">
                Crea tu contraseña
              </h3>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-base py-6"
              />
              <Button
                onClick={handlePasswordSubmit}
                className="w-full text-base py-6 font-semibold"
                disabled={isLoading}
              >
                Crear cuenta
              </Button>
            </div>
          )}

          {step === "complete" && (
            <div className="space-y-6 animate-in fade-in duration-500 text-center py-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <CheckCircle2 className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                ¡Bienvenido a Calma, {answers.q1 || "amig@"}!
              </h3>
              <p className="text-muted-foreground">
                Tu cuenta ha sido creada exitosamente
              </p>
              <p className="text-sm text-muted-foreground">{email}</p>
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Preparando tu experiencia...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}