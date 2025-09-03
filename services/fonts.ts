import { Archivo, Lato } from "next/font/google";

export const archivo = Archivo({
  display: "swap",
  variable: "--font-archivo",
  subsets: ["latin"]
});

export const lato = Lato({
  display: "swap",
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"]
});
