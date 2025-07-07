import { NextResponse } from "next/server"
import { processarRepasses } from "@/lib/repasses"

export async function POST() {
  try {
    await processarRepasses()

    return NextResponse.json({
      success: true,
      message: "Repasses processados com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao processar repasses:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro ao processar repasses",
      },
      { status: 500 },
    )
  }
}
