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
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { currentTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
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
      setIsSignUp(false); // Switch to login view after successful sign up
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
  };

  if (session) {
    return <Navigate to="/" />;
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full lg:grid lg:grid-cols-2"
    >
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-[380px] space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-foreground">
              {isSignUp ? 'Crie sua Conta' : 'Bem-vindo de Volta!'}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? 'Preencha os campos para se registrar.' : 'Insira suas credenciais para acessar.'}
            </p>
          </div>

          {isSignUp ? (
            <motion.form
              key="signup"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmitSignUp(onSignUp)}
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" {...registerSignUp('firstName')} placeholder="João" />
                  {errorsSignUp.firstName && <p className="text-xs text-destructive">{errorsSignUp.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input id="lastName" {...registerSignUp('lastName')} placeholder="Silva" />
                  {errorsSignUp.lastName && <p className="text-xs text-destructive">{errorsSignUp.lastName.message}</p>}
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...registerSignUp('email')} placeholder="seu@email.com" />
                {errorsSignUp.email && <p className="text-xs text-destructive">{errorsSignUp.email.message}</p>}
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" {...registerSignUp('password')} />
                {errorsSignUp.password && <p className="text-xs text-destructive">{errorsSignUp.password.message}</p>}
              </motion.div>
              <motion.div variants={itemVariants}>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              key="signin"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmitSignIn(onSignIn)}
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email-signin">E-mail</Label>
                <Input id="email-signin" type="email" {...registerSignIn('email')} placeholder="seu@email.com" />
                {errorsSignIn.email && <p className="text-xs text-destructive">{errorsSignIn.email.message}</p>}
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password-signin">Senha</Label>
                <Input id="password-signin" type="password" {...registerSignIn('password')} />
                {errorsSignIn.password && <p className="text-xs text-destructive">{errorsSignIn.password.message}</p>}
              </motion.div>
              <motion.div variants={itemVariants}>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </motion.div>
            </motion.form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button onClick={() => setIsSignUp(!isSignUp)} className="ml-1 font-semibold text-primary hover:underline underline-offset-4">
              {isSignUp ? 'Entre' : 'Registre-se'}
            </button>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex items-center justify-center bg-muted flex-col text-center p-8"
           style={{
             backgroundColor: `hsl(${currentTheme.background.hue} ${currentTheme.background.saturation}% ${currentTheme.background.lightness}%)`,
             transition: 'background-color 0.5s ease-in-out',
           }}
      >
        <motion.div
          key={currentTheme.id}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="space-y-4"
        >
          <span className="text-8xl">{currentTheme.emoji}</span>
          <h2 className="text-4xl font-bold text-primary">Sistema de Atendimento CRA</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Gestão de atendimentos, insights automáticos e visualizações interativas para otimizar o fluxo do CRA.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Login;