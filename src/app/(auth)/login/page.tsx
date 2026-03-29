import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Загрузка…</p>}>
      <LoginForm />
    </Suspense>
  );
}
