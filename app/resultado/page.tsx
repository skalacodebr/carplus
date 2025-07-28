"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function Resultado() {
  const searchParams = useSearchParams()
  const [tamanhoRoda, setTamanhoRoda] = useState("")
  const [altura, setAltura] = useState("")
  const [largura, setLargura] = useState("")
  const [resultado, setResultado] = useState("")
  const [cor, setCor] = useState("")

  useEffect(() => {
    // Recuperar os parâmetros da URL
    const tamanho = searchParams.get("tamanhoRoda") || ""
    const alt = searchParams.get("altura") || ""
    const larg = searchParams.get("largura") || ""
    const res = searchParams.get("resultado") || "LTP60"
    const backgroundColor = searchParams.get("cor") || "#4A4953"

    setTamanhoRoda(tamanho)
    setAltura(alt)
    setLargura(larg)
    setResultado(res)
    setCor(backgroundColor)
  }, [searchParams])

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#2C2B34] px-5 py-10">
      {/* Logo */}
      <div className="mb-1">
        <Image src="/images/car-logo-complete.png" alt="CAR+ Logo" width={280} height={100} priority />
      </div>

      {/* Título e subtítulo */}
      <div className="text-center mb-8 -mt-2">
        <p className="text-gray-400 text-sm">Calculadora de Pacotes de Microesferas</p>
      </div>

      {/* Dados inseridos */}
      <div className="w-full max-w-md flex flex-col gap-4 relative">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Image src="/images/calendar-icon.png" alt="Calendário" width={20} height={20} />
          </div>
          <div className="w-full bg-[#3A3942] text-white py-4 pl-12 pr-4 rounded-[16px]">{tamanhoRoda || "R17"}</div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Image src="/images/calendar-icon.png" alt="Calendário" width={20} height={20} />
          </div>
          <div className="w-full bg-[#3A3942] text-white py-4 pl-12 pr-4 rounded-[16px]">{altura || "12.50"}</div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Image src="/images/calendar-icon.png" alt="Calendário" width={20} height={20} />
          </div>
          <div className="w-full bg-[#3A3942] text-white py-4 pl-12 pr-4 rounded-[16px]">{largura || "35"}</div>
        </div>

        {/* Resultado - Use the color from the package */}
        <div
          className="text-white py-6 px-4 rounded-[50px] text-center absolute w-full"
          style={{
            height: "77px",
            top: "223px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: cor,
          }}
        >
          <h2 className="text-xl font-bold">{resultado}</h2>
          <p className="text-gray-300">Pacote recomendado</p>
        </div>

        {/* Espaçador para compensar o posicionamento absoluto */}
        <div className="h-24"></div>

        {/* Botão de recalcular */}
        <Link href="/calculadora" className="w-full bg-[#fdc300] text-white py-4 rounded-full font-bold mt-4 text-center">
          Recalcular
        </Link>
      </div>
    </main>
  )
}
