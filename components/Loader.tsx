import AppLayout from "@/layouts/AppLayout";
import { Loader2 } from "lucide-react";
import React from "react";

export default function Loader() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
        <Loader2 className="size-10 animate-spin mb-2" />
        <p className="text-lg text-gray-600">Fetching details...</p>
      </div>
    </AppLayout>
  );
}
