import React, {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type MemberSession = {
  authenticated: boolean;
  memberEmail: string | null;
  displayName: string | null;
};

type MemberAuthContextValue = {
  session: MemberSession;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  login: (returnTo?: string) => void;
  logout: (returnTo?: string) => void;
};

const defaultSession: MemberSession = {
  authenticated: false,
  memberEmail: null,
  displayName: null,
};

let cachedSession: MemberSession | null = null;
let sessionFetchPromise: Promise<MemberSession> | null = null;

const MemberAuthContext = createContext<MemberAuthContextValue | null>(null);
const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_PROXY_URL;

function buildAuthUrl(action: string, returnTo?: string) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("action", action);

  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }

  return url.toString();
}

async function fetchSessionState(): Promise<MemberSession> {
  if (cachedSession) {
    return cachedSession;
  }

  if (sessionFetchPromise) {
    return sessionFetchPromise;
  }

  sessionFetchPromise = (async () => {
  const response = await fetch(buildAuthUrl("session"), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Session check failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to load session state.");
  }

    const session = {
    authenticated: Boolean(data.session?.authenticated),
    memberEmail: data.session?.memberEmail ?? null,
    displayName: data.session?.displayName ?? null,
    };

    cachedSession = session;
    return session;
  })();

  try {
    return await sessionFetchPromise;
  } finally {
    sessionFetchPromise = null;
  }
}

export function MemberAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<MemberSession>(defaultSession);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const nextSession = await fetchSessionState();
      setSession(nextSession);
      setError(null);
    } catch (err: any) {
      setSession(defaultSession);
      cachedSession = defaultSession;
      setError(err.message || "Nepodařilo se načíst stav přihlášení.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo<MemberAuthContextValue>(
    () => ({
      session,
      loading,
      error,
      refreshSession,
      login(returnTo?: string) {
        window.location.href = buildAuthUrl(
          "login",
          returnTo || window.location.href
        );
      },
      logout(returnTo?: string) {
        cachedSession = defaultSession;
        window.location.href = buildAuthUrl(
          "logout",
          returnTo || window.location.origin
        );
      },
    }),
    [session, loading, error, refreshSession]
  );

  return React.createElement(MemberAuthContext.Provider, { value }, children);
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (!context) {
    throw new Error("useMemberAuth must be used inside MemberAuthProvider.");
  }

  return context;
}
