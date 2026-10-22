import {
  ConvertError,
  convertPage,
  type ConvertErrorKind,
} from "@/features/url-to-markdown/convert";

const STATUS: Record<ConvertErrorKind, number> = {
  "invalid-url": 400,
  "no-content": 422,
  unreachable: 502,
};

function errorResponse(error: ConvertError) {
  return Response.json(
    { error: { kind: error.kind, title: error.title, text: error.text } },
    { status: STATUS[error.kind] }
  );
}

export async function POST(request: Request) {
  let url = "";
  try {
    const body = await request.json();
    if (typeof body?.url === "string") url = body.url;
  } catch {
    // 본문이 JSON이 아니면 빈 주소로 취급해 invalid-url 오류가 된다.
  }

  try {
    return Response.json(await convertPage(url));
  } catch (error) {
    if (error instanceof ConvertError) return errorResponse(error);
    throw error;
  }
}
