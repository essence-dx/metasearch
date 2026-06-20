import { createDxMetasearchSearchResponse } from "../../../../server/metasearch/search-route";

export async function GET(request: Request): Promise<Response> {
  return createDxMetasearchSearchResponse(request);
}
