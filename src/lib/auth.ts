const clientId = import.meta.env.VITE_AAD_CLIENT_ID as string;
const tenantId = import.meta.env.VITE_AAD_TENANT_ID as string;
const clientSecret = import.meta.env.VITE_AAD_CLIENT_SECRET as string;

// App-only scopes for Microsoft Graph
export const GRAPH_SCOPES = ["https://graph.microsoft.com/.default"];

export async function acquireTokenForApp(): Promise<string> {
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    scope: GRAPH_SCOPES[0],
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to acquire app token: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.access_token as string;
}
