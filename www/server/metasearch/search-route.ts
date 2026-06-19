export type DxMetasearchSearchRoute = {
  path: "/api/v1/search";
  runtime: "dx-www-axum";
};

export const dxMetasearchSearchRoute = {
  path: "/api/v1/search",
  runtime: "dx-www-axum",
} as const satisfies DxMetasearchSearchRoute;

export async function createDxMetasearchSearchResponse(_request: Request): Promise<Response> {
  return Response.json(
    {
      error: "dx-www-metasearch-runtime-unavailable",
      message: "DX Metasearch search is served by the DX WWW Axum runtime.",
    },
    { status: 501 },
  );
}
