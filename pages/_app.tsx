import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Providers } from "../components/Providers";
import { Header } from "../components/header";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Header />
      <Component {...pageProps} />
    </Providers>
  );
}
