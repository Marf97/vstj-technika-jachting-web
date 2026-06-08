<?php

class MemberAuth
{
    private string $clientId;
    private string $tenantId;
    private string $clientSecret;
    private string $redirectUri;
    private array $memberEmails;
    private array $adminEmails;
    private string $sessionName;
    private string $sessionSecret;

    public function __construct()
    {
        Config::getAllowedOrigins();

        $this->clientId = $this->requireEnv('MEMBER_OIDC_CLIENT_ID');
        $this->tenantId = $this->requireEnv('MEMBER_OIDC_TENANT_ID');
        $this->clientSecret = $this->requireEnv('MEMBER_OIDC_CLIENT_SECRET');
        $this->redirectUri = $this->requireEnv('MEMBER_OIDC_REDIRECT_URI');
        $this->memberEmails = $this->parseEmailList(getenv('MEMBER_EMAILS') ?: '');
        $this->adminEmails = $this->parseEmailList(getenv('MEMBER_ADMIN_EMAILS') ?: '');

        if (empty($this->memberEmails) && empty($this->adminEmails)) {
            $this->memberEmails = $this->parseEmailList($this->requireEnv('MEMBER_ALLOWED_EMAIL'));
        }

        $this->sessionName = getenv('MEMBER_SESSION_NAME') ?: 'vstj_member_session';
        $this->sessionSecret = $this->requireEnv('MEMBER_SESSION_SECRET');
    }

    public function beginLogin(?string $returnTo = null): void
    {
        $this->startSession();

        $state = $this->randomString(32);
        $nonce = $this->randomString(32);
        $codeVerifier = $this->randomString(64);
        $codeChallenge = $this->base64UrlEncode(hash('sha256', $codeVerifier, true));

        $_SESSION['member_auth_state'] = $state;
        $_SESSION['member_auth_nonce'] = $nonce;
        $_SESSION['member_auth_code_verifier'] = $codeVerifier;
        $_SESSION['member_auth_return_to'] = $this->normalizeReturnTo($returnTo);

        $config = $this->getOpenIdConfiguration();
        $authorizeUrl = $config['authorization_endpoint'] . '?' . http_build_query([
            'client_id' => $this->clientId,
            'response_type' => 'code',
            'redirect_uri' => $this->redirectUri,
            'response_mode' => 'query',
            'scope' => 'openid profile email',
            'state' => $state,
            'nonce' => $nonce,
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => 'S256',
            'prompt' => 'login',
        ]);

        header('Location: ' . $authorizeUrl, true, 302);
        exit;
    }

    public function handleCallback(): void
    {
        $this->startSession();

        $error = $_GET['error'] ?? null;
        if ($error) {
            throw new Exception('Microsoft login failed: ' . ($_GET['error_description'] ?? $error));
        }

        $code = $_GET['code'] ?? null;
        $state = $_GET['state'] ?? null;

        if (!$code || !$state) {
            throw new Exception('Missing authorization code or state.');
        }

        if (!isset($_SESSION['member_auth_state']) || !hash_equals($_SESSION['member_auth_state'], $state)) {
            throw new Exception('Invalid login state.');
        }

        $codeVerifier = $_SESSION['member_auth_code_verifier'] ?? null;
        $expectedNonce = $_SESSION['member_auth_nonce'] ?? null;
        $returnTo = $_SESSION['member_auth_return_to'] ?? $this->defaultReturnTo();

        if (!$codeVerifier || !$expectedNonce) {
            throw new Exception('Missing OIDC session context.');
        }

        $tokens = $this->exchangeAuthorizationCode($code, $codeVerifier);
        $claims = $this->validateIdToken($tokens['id_token'] ?? '', $expectedNonce);
        $email = $this->extractEmail($claims);
        $role = $this->resolveRole($email);

        if ($role === null) {
            throw new Exception('The signed-in account is not allowed to access the member area.');
        }

        session_regenerate_id(true);
        $_SESSION['member'] = [
            'authenticated' => true,
            'memberEmail' => $email,
            'displayName' => $claims['name'] ?? $email,
            'role' => $role,
            'capabilities' => $this->getCapabilitiesForRole($role),
            'idTokenExpiresAt' => intval($claims['exp'] ?? 0),
            'authenticatedAt' => time(),
        ];

        unset(
            $_SESSION['member_auth_state'],
            $_SESSION['member_auth_nonce'],
            $_SESSION['member_auth_code_verifier'],
            $_SESSION['member_auth_return_to']
        );

        header('Location: ' . $this->normalizeReturnTo($returnTo), true, 302);
        exit;
    }

    public function logout(?string $returnTo = null): void
    {
        $this->startSession();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }

        session_destroy();
        header('Location: ' . $this->normalizeReturnTo($returnTo), true, 302);
        exit;
    }

    public function getSessionState(): array
    {
        $this->startSession();

        $member = $_SESSION['member'] ?? null;
        if (!is_array($member) || empty($member['authenticated'])) {
            return [
                'authenticated' => false,
                'memberEmail' => null,
                'displayName' => null,
                'role' => null,
                'capabilities' => [],
            ];
        }

        if (!empty($member['idTokenExpiresAt']) && time() >= intval($member['idTokenExpiresAt'])) {
            unset($_SESSION['member']);
            return [
                'authenticated' => false,
                'memberEmail' => null,
                'displayName' => null,
                'role' => null,
                'capabilities' => [],
            ];
        }

        $role = $this->resolveRole($member['memberEmail'] ?? null) ?? ($member['role'] ?? null);
        if ($role === null) {
            unset($_SESSION['member']);
            return [
                'authenticated' => false,
                'memberEmail' => null,
                'displayName' => null,
                'role' => null,
                'capabilities' => [],
            ];
        }

        return [
            'authenticated' => true,
            'memberEmail' => $member['memberEmail'] ?? null,
            'displayName' => $member['displayName'] ?? null,
            'role' => $role,
            'capabilities' => $member['capabilities'] ?? $this->getCapabilitiesForRole($role),
        ];
    }

    public function requireMember(): array
    {
        $session = $this->getSessionState();
        if (empty($session['authenticated'])) {
            throw new Exception('Authentication required.');
        }

        return $session;
    }

    public function requireCapability(string $capability): array
    {
        $session = $this->requireMember();
        $capabilities = $session['capabilities'] ?? [];

        if (!is_array($capabilities) || !in_array($capability, $capabilities, true)) {
            throw new Exception('Permission denied.');
        }

        return $session;
    }

    public function getPendingReturnTo(): string
    {
        $this->startSession();
        $returnTo = $_SESSION['member_auth_return_to'] ?? null;
        return $this->normalizeReturnTo($returnTo);
    }

    private function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['SERVER_PORT']) && intval($_SERVER['SERVER_PORT']) === 443)
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        session_name($this->sessionName);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.cookie_samesite', 'Lax');

        session_start();
    }

    private function exchangeAuthorizationCode(string $code, string $codeVerifier): array
    {
        $config = $this->getOpenIdConfiguration();

        return $this->postForm($config['token_endpoint'], [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'code_verifier' => $codeVerifier,
        ]);
    }

    private function validateIdToken(string $idToken, string $expectedNonce): array
    {
        if ($idToken === '') {
            throw new Exception('Missing ID token.');
        }

        $parts = explode('.', $idToken);
        if (count($parts) !== 3) {
            throw new Exception('Invalid ID token format.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $header = json_decode($this->base64UrlDecode($encodedHeader), true);
        $payload = json_decode($this->base64UrlDecode($encodedPayload), true);
        $signature = $this->base64UrlDecode($encodedSignature);

        if (!is_array($header) || !is_array($payload)) {
            throw new Exception('Unable to decode ID token.');
        }

        if (($header['alg'] ?? null) !== 'RS256') {
            throw new Exception('Unsupported ID token algorithm.');
        }

        $kid = $header['kid'] ?? null;
        if (!$kid) {
            throw new Exception('Missing key ID in ID token.');
        }

        $keys = $this->getSigningKeys();
        $pem = $this->findSigningKeyPem($keys, $kid);
        $signedData = $encodedHeader . '.' . $encodedPayload;
        $verified = openssl_verify($signedData, $signature, $pem, OPENSSL_ALGO_SHA256);

        if ($verified !== 1) {
            throw new Exception('Invalid ID token signature.');
        }

        $issuer = rtrim($payload['iss'] ?? '', '/');
        $expectedIssuer = 'https://login.microsoftonline.com/' . $this->tenantId . '/v2.0';
        if ($issuer !== $expectedIssuer) {
            throw new Exception('Unexpected ID token issuer.');
        }

        if (($payload['aud'] ?? null) !== $this->clientId) {
            throw new Exception('Unexpected ID token audience.');
        }

        $now = time();
        if (!isset($payload['exp']) || $now >= intval($payload['exp'])) {
            throw new Exception('The login token has expired.');
        }

        if (isset($payload['nbf']) && $now < intval($payload['nbf'])) {
            throw new Exception('The login token is not valid yet.');
        }

        if (($payload['nonce'] ?? null) !== $expectedNonce) {
            throw new Exception('Invalid ID token nonce.');
        }

        return $payload;
    }

    private function getOpenIdConfiguration(): array
    {
        $cacheKey = 'member_openid_config_' . md5($this->tenantId);
        $cached = $this->readCache($cacheKey, 86400);
        if ($cached !== null) {
            return $cached;
        }

        $url = 'https://login.microsoftonline.com/' . rawurlencode($this->tenantId) . '/v2.0/.well-known/openid-configuration';
        $config = $this->getJson($url);
        $this->writeCache($cacheKey, $config);

        return $config;
    }

    private function getSigningKeys(): array
    {
        $cacheKey = 'member_openid_keys_' . md5($this->tenantId);
        $cached = $this->readCache($cacheKey, 86400);
        if ($cached !== null) {
            return $cached['keys'] ?? [];
        }

        $config = $this->getOpenIdConfiguration();
        $keys = $this->getJson($config['jwks_uri']);
        $this->writeCache($cacheKey, $keys);

        return $keys['keys'] ?? [];
    }

    private function findSigningKeyPem(array $keys, string $kid): string
    {
        foreach ($keys as $key) {
            if (($key['kid'] ?? null) === $kid && !empty($key['x5c'][0])) {
                $certificate = chunk_split($key['x5c'][0], 64, "\n");
                return "-----BEGIN CERTIFICATE-----\n" . $certificate . "-----END CERTIFICATE-----\n";
            }
        }

        throw new Exception('Unable to find a signing certificate for the ID token.');
    }

    private function postForm(string $url, array $data): array
    {
        $payload = http_build_query($data);
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n" .
                    "Accept: application/json\r\n",
                'content' => $payload,
                'ignore_errors' => true,
                'timeout' => 30,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            throw new Exception('Failed to call Microsoft token endpoint.');
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new Exception('Invalid token endpoint response.');
        }

        if (isset($decoded['error'])) {
            $message = $decoded['error_description'] ?? $decoded['error'];
            throw new Exception('Token exchange failed: ' . $message);
        }

        return $decoded;
    }

    private function getJson(string $url): array
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Accept: application/json\r\n",
                'ignore_errors' => true,
                'timeout' => 30,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            throw new Exception('Failed to fetch Microsoft OpenID configuration.');
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new Exception('Invalid JSON response from Microsoft.');
        }

        return $decoded;
    }

    private function normalizeReturnTo(?string $returnTo): string
    {
        $fallback = $this->defaultReturnTo();

        if (!$returnTo) {
            return $fallback;
        }

        $returnTo = trim($returnTo);
        if ($returnTo === '') {
            return $fallback;
        }

        if (str_starts_with($returnTo, '/')) {
            return $fallback . $returnTo;
        }

        $parts = parse_url($returnTo);
        if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
            return $fallback;
        }

        $origin = $parts['scheme'] . '://' . $parts['host'];
        if (isset($parts['port'])) {
            $origin .= ':' . $parts['port'];
        }

        foreach (Config::getAllowedOrigins() as $allowedOrigin) {
            if (rtrim($allowedOrigin, '/') === $origin) {
                return $returnTo;
            }
        }

        return $fallback;
    }

    private function defaultReturnTo(): string
    {
        $origins = Config::getAllowedOrigins();
        return rtrim($origins[0] ?? '/', '/');
    }

    private function readCache(string $key, int $ttl): ?array
    {
        $cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $key . '.json';
        if (!file_exists($cacheFile)) {
            return null;
        }

        $contents = @file_get_contents($cacheFile);
        if ($contents === false) {
            return null;
        }

        $decoded = json_decode($contents, true);
        if (!is_array($decoded) || empty($decoded['expires']) || time() >= intval($decoded['expires'])) {
            return null;
        }

        return $decoded['value'] ?? null;
    }

    private function writeCache(string $key, array $value): void
    {
        $cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $key . '.json';
        $payload = [
            'expires' => time() + 86400,
            'value' => $value,
        ];

        @file_put_contents($cacheFile, json_encode($payload));
        @chmod($cacheFile, 0600);
    }

    private function extractEmail(array $claims): ?string
    {
        $candidates = [
            $claims['preferred_username'] ?? null,
            $claims['email'] ?? null,
            $claims['upn'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '') {
                return strtolower($candidate);
            }
        }

        return null;
    }

    private function parseEmailList(string $value): array
    {
        $emails = array_map('trim', explode(',', $value));
        $emails = array_map('strtolower', $emails);
        return array_values(array_filter($emails, fn ($email) => $email !== ''));
    }

    private function resolveRole(?string $email): ?string
    {
        if (!$email) {
            return null;
        }

        $normalizedEmail = strtolower($email);
        if (in_array($normalizedEmail, $this->adminEmails, true)) {
            return 'admin';
        }

        if (in_array($normalizedEmail, $this->memberEmails, true)) {
            return 'member';
        }

        return null;
    }

    private function getCapabilitiesForRole(string $role): array
    {
        $capabilities = [
            'calendar:view',
            'reservation:create',
        ];

        if ($role === 'admin') {
            $capabilities[] = 'reservation:approve';
            $capabilities[] = 'reservation:cancel';
            $capabilities[] = 'club_event:create';
            $capabilities[] = 'club_event:delete';
        }

        return $capabilities;
    }

    private function requireEnv(string $name): string
    {
        $value = getenv($name);
        if ($value === false || $value === '') {
            throw new Exception('Missing required environment variable: ' . $name);
        }

        return $value;
    }

    private function randomString(int $bytes): string
    {
        return $this->base64UrlEncode(random_bytes($bytes));
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder > 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($value, '-_', '+/'));
    }
}
