import axios, {
    AxiosHeaders,
    type AxiosInstance,
    type InternalAxiosRequestConfig,
} from 'axios';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
const configuredAxiosInstances = new WeakSet<AxiosInstance>();

function readCookie(name: string): string | null {
    const encodedName = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie
        .split('; ')
        .find((cookieEntry) => cookieEntry.startsWith(encodedName));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.slice(encodedName.length));
}

function resolveUrl(
    url: string | URL | null | undefined,
    baseUrl?: string | null,
): URL | null {
    if (!url) {
        return null;
    }

    try {
        if (url instanceof URL) {
            return url;
        }

        const base = baseUrl
            ? new URL(baseUrl, window.location.origin)
            : window.location.origin;

        return new URL(url, base);
    } catch {
        return null;
    }
}

function shouldAttachCsrfToken(
    method: string | undefined,
    url: URL | null,
): boolean {
    const normalizedMethod = (method ?? 'GET').toUpperCase();

    return (
        !safeMethods.has(normalizedMethod) &&
        (url === null || url.origin === window.location.origin)
    );
}

function currentCsrfToken(): string | null {
    return (
        readCookie('XSRF-TOKEN') ??
        document.head.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ??
        null
    );
}

function withCsrfHeaders(
    headers: Headers | AxiosHeaders,
    csrfToken: string | null,
): void {
    headers.delete('X-CSRF-TOKEN');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (csrfToken) {
        headers.set('X-XSRF-TOKEN', csrfToken);
        return;
    }

    headers.delete('X-XSRF-TOKEN');
}

export function configureAxiosInstance(instance: AxiosInstance): AxiosInstance {
    if (configuredAxiosInstances.has(instance)) {
        return instance;
    }

    configuredAxiosInstances.add(instance);

    instance.defaults.withCredentials = true;
    instance.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    delete instance.defaults.headers.common['X-CSRF-TOKEN'];

    (
        instance.defaults as typeof instance.defaults & {
            withXSRFToken?: boolean;
        }
    ).withXSRFToken = true;

    instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        const headers = AxiosHeaders.from(config.headers);

        withCsrfHeaders(
            headers,
            shouldAttachCsrfToken(
                config.method,
                resolveUrl(config.url, config.baseURL),
            )
                ? currentCsrfToken()
                : null,
        );

        config.headers = headers;

        return config;
    });

    return instance;
}

let fetchProtectionInstalled = false;

export function installFetchCsrfProtection(): void {
    if (fetchProtectionInstalled) {
        return;
    }

    fetchProtectionInstalled = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = (async (
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<Response> => {
        const request = input instanceof Request ? input : undefined;
        const resolvedUrl = resolveUrl(
            input instanceof URL
                ? input
                : (request?.url ?? (typeof input === 'string' ? input : null)),
        );
        const headers = new Headers(request?.headers);

        if (init?.headers) {
            new Headers(init.headers).forEach((value, key) => {
                headers.set(key, value);
            });
        }

        withCsrfHeaders(
            headers,
            shouldAttachCsrfToken(init?.method ?? request?.method, resolvedUrl)
                ? currentCsrfToken()
                : null,
        );

        const credentials =
            init?.credentials ??
            request?.credentials ??
            (resolvedUrl?.origin === window.location.origin
                ? 'same-origin'
                : undefined);
        const requestInit: RequestInit = {
            ...init,
            headers,
        };

        if (credentials) {
            requestInit.credentials = credentials;
        }

        return nativeFetch(input, requestInit);
    }) as typeof window.fetch;
}

export function bootstrapHttp(): void {
    configureAxiosInstance(axios);
    installFetchCsrfProtection();
}
