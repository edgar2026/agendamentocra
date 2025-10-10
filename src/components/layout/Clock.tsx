import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Limpa o intervalo quando o componente é desmontado
    return () => {
      clearInterval(timerId);
    };
  }, []); // O array de dependências vazio garante que o efeito seja executado apenas uma vez na montagem

  return (
    <div className="text-xl font-mono font-semibold text-foreground">
      {time.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    </div>
  );
}