"use client";
import { useActionState } from "react";
import { login } from "./actions";
export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action}>
      <label>
        Correo electrónico
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="admin-primary" disabled={pending || !configured}>
        {pending ? "Entrando…" : "Entrar al estudio ↗"}
      </button>
    </form>
  );
}
