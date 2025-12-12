import { Suspense } from "react";
import AceptarInvitacionClient from "./aceptar-invitacion-client";

function LoadingFallback() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md text-center">
        Cargando invitación...
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AceptarInvitacionClient />
    </Suspense>
  );
}

