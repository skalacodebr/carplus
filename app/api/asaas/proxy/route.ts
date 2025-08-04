import { NextRequest, NextResponse } from "next/server";

const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmRjMDg1ODFiLTE3MTAtNGY2OC04ZjI3LWE2Y2Y1NmNkMzE5Njo6JGFhY2hfZWNhYmM1MGMtNjUyYi00NjdlLWFhZGQtYTdhZWM5OWY0MGU1";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, method, data } = await req.json();

    console.log("=== ASAAS PROXY ===");
    console.log("Endpoint:", endpoint);
    console.log("Method:", method);
    console.log("Payload:", JSON.stringify(data, null, 2));

    const url = `https://api.asaas.com/v3/${endpoint}`;
    console.log("URL completa:", url);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: method === "GET" ? undefined : JSON.stringify(data),
    });

    console.log("Status da resposta:", response.status);
    console.log("Headers da resposta:", Object.fromEntries(response.headers.entries()));

    // Ler o body apenas uma vez
    const responseText = await response.text();
    console.log("Resposta como texto:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Erro ao fazer parse do JSON da resposta:", jsonError);
      return NextResponse.json({ 
        error: true, 
        message: "Resposta inválida do Asaas",
        details: { responseText, status: response.status }
      }, { status: 500 });
    }

    console.log("Resposta do Asaas:", JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData, { status: response.status });

  } catch (error) {
    console.error("Erro na API do proxy Asaas:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json({ 
      error: true, 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

