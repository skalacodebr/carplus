import { NextRequest, NextResponse } from "next/server";

const ASAAS_API_KEY = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjU2NTNjYjc2LTI1ZDctNDRjNy05NzExLWVjNDI4NzM5MmJhZDo6JGFhY2hfNWIyMWMxMTUtYjVmNy00MDNkLWIwM2MtMGNkMDk5ZGNjZTNk";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, method, data } = await req.json();

    console.log("Endpoint:", endpoint);
    console.log("Method:", method);
    console.log("Payload:", data);

    const response = await fetch(`https://sandbox.asaas.com/api/v3/${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: method === "GET" ? undefined : JSON.stringify(data),
    });

    const responseData = await response.json();
    return NextResponse.json(responseData, { status: response.status });

  } catch (error) {
    console.error("Erro na API do proxy Asaas:", error);
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}

