import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Schemas for validation
const signUpSchema = z.object({
  firstName: z.string().min(2, 'Nome é obrigatório'),
  lastName: z.string().min(2, 'Sobrenome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

const Login = () => {
  const { session } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true); // Start with sign-up view
  const [loading, setLoading] = useState(false);

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: errorsSignUp },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    formState: { errors: errorsSignIn },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Registro bem-sucedido! Verifique seu e-mail para confirmação.');
    }
  };

  const onSignIn = async (data: SignInFormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
    // No success toast needed, as the AuthProvider will handle the redirect
  };

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Sistema de Agendamento</h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Crie sua conta para continuar' : 'Faça login para continuar'}
          </p>
        </div>

        {isSignUp ? (
          <form onSubmit={handleSubmitSignUp(onSignUp)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" {...registerSignUp('firstName')} />
                {errorsSignUp.firstName && <p className="text-xs text-destructive">{errorsSignUp.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" {...registerSignUp('lastName')} />
                {errorsSignUp.lastName && <p className="text-xs text-destructive">{errorsSignUp.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...registerSignUp('email')} />
              {errorsSignUp.email && <p className="text-xs text-destructive">{errorsSignUp.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...registerSignUp('password')} />
              {errorsSignUp.password && <p className="text-xs text-destructive">{errorsSignUp.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitSignIn(onSignIn)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-signin">E-mail</Label>
              <Input id="email-signin" type="email" {...registerSignIn('email')} />
              {errorsSignIn.email && <p className="text-xs text-destructive">{errorsSignIn.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signin">Senha</Label>
              <Input id="password-signin" type="password" {...registerSignIn('password')} />
              {errorsSignIn.password && <p className="text-xs text-destructive">{errorsSignIn.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">
            {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Registre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;