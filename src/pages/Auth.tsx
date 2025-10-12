import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Lock, Eye, EyeOff, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DocumentType {
  id: string;
  code: string;
  name: string;
}

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupDocumentType, setSignupDocumentType] = useState("");
  const [signupDocumentNumber, setSignupDocumentNumber] = useState("");
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/");
      }
    };
    checkUser();

    // Fetch document types
    const fetchDocumentTypes = async () => {
      const { data } = await supabase
        .from('document_types')
        .select('id, code, name')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) {
        setDocumentTypes(data);
      }
    };
    fetchDocumentTypes();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("¡Bienvenido de vuelta!");
        window.location.href = "/";
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setMessage(error.message || "Error al iniciar sesión");
      setMessageType("error");
      toast.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!signupDocumentType || !signupDocumentNumber.trim()) {
      toast.error("Tipo y número de documento son obligatorios");
      return;
    }
    
    setLoading(true);
    setMessage("");

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupFullName,
            document_type_code: signupDocumentType,
            document_number: signupDocumentNumber,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setMessage("¡Cuenta creada! Revisa tu email para confirmar tu cuenta.");
        setMessageType("success");
        toast.success("¡Cuenta creada exitosamente!");
        
        // Clear form
        setSignupEmail("");
        setSignupPassword("");
        setSignupFullName("");
        setSignupDocumentType("");
        setSignupDocumentNumber("");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setMessage(error.message || "Error al crear la cuenta");
      setMessageType("error");
      toast.error("Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen farfalla-hero-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/f9953d83-e6cc-4f4f-85ac-c7a1f7220021.png" 
            alt="Farfalla Estudio"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-poppins font-bold text-white mb-2">
            Bienvenido a Farfalla Estudio
          </h1>
          <p className="text-white/90">
            Accede a tu cuenta o crea una nueva
          </p>
        </div>

        <Card className="farfalla-glass border-white/20">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="login" className="text-farfalla-ink data-[state=active]:bg-white data-[state=active]:text-farfalla-ink">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-farfalla-ink data-[state=active]:bg-white data-[state=active]:text-farfalla-ink">
                Registrarse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardHeader>
                <CardTitle className="text-farfalla-ink">Iniciar Sesión</CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para acceder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tu contraseña"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="farfalla-btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle className="text-farfalla-ink">Crear Cuenta</CardTitle>
                <CardDescription>
                  Regístrate para comenzar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-10"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-document-type">Tipo de Documento *</Label>
                    <Select value={signupDocumentType} onValueChange={setSignupDocumentType} required>
                      <SelectTrigger id="signup-document-type">
                        <SelectValue placeholder="Selecciona tipo de documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.code}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-document-number">Número de Documento *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="signup-document-number"
                        type="text"
                        placeholder="Número de documento"
                        value={signupDocumentNumber}
                        onChange={(e) => setSignupDocumentNumber(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="farfalla-btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>

          {message && (
            <div className="p-6 pt-0">
              <Alert className={messageType === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
                <AlertDescription className={messageType === "error" ? "text-red-700" : "text-green-700"}>
                  {message}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:text-farfalla-pink"
          >
            ← Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;