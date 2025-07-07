import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex h-screen flex-col bg-black overflow-hidden">
      {/* Container superior - ajustado para caber na tela */}
      <div className="h-[55vh] relative">
        <div className="absolute inset-0">
          <Image
            src="/images/microesferas-bg.jpeg"
            alt="Microesferas Superior"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Container do meio (container preto com conteúdo) - altura aumentada */}
      <div className="z-10 w-full max-w-md px-5 py-6 flex flex-col items-center justify-center gap-6 bg-black mx-auto -mt-20 h-[75vh]">
        {/* Título principal - com margem superior */}
        <div className="mt-8">
          <Image
            src="/images/car-logo-complete.png"
            alt="CAR+ Microesferas Premium"
            width={300}
            height={120}
            className="mx-auto"
            priority
          />
        </div>

        {/* Subtítulo */}
        <p className="font-barlow font-normal text-[15px] leading-[140%] text-center text-[#8E8E8E]">
          A CAR+ melhorará sua viagem durante toda
          <br />a vida útil dos seus pneus.
        </p>

        {/* Botões */}
        <div className="w-full flex flex-col gap-3 mt-2">
          {/* Botão Calculadora */}
          <Link
            href="/calculadora"
            className="w-full bg-[#fdc300] rounded-full py-4 font-barlow font-bold text-[20px] leading-[100%] text-white text-center"
          >
            Ir para Calculadora
          </Link>

          {/* Botão Login */}
          <Link
            href="/login"
            className="w-full bg-[#2C2B34] rounded-full py-4 font-barlow font-bold text-[20px] leading-[100%] text-white text-center"
          >
            Login
          </Link>

          {/* Botão Cadastro - com margem inferior */}
          <Link
            href="/cadastro"
            className="w-full border border-[#fdc300] rounded-full py-4 font-barlow font-bold text-[20px] leading-[100%] text-white text-center bg-transparent mb-8"
          >
            Cadastro
          </Link>
        </div>
      </div>

      {/* Container inferior - reduzido */}
      <div className="h-[15vh] relative -mt-15">
        <div className="absolute inset-0">
          <Image
            src="/images/microesferas-bg.jpeg"
            alt="Microesferas Inferior"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </main>
  )
}
