import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface ClientLayoutProps {
    client: {
        name: string;
        code: string;
    };
    title?: string;
}

export default function ClientLayout({
    client,
    title,
    children,
}: PropsWithChildren<ClientLayoutProps>) {
    return (
        <AppShell variant="header">
            <header className="border-b bg-background">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex flex-col">
                        <Link
                            href={`/c/${client.code}/tickets`}
                            className="text-lg font-semibold"
                        >
                            {client.name}
                        </Link>
                        {title ? (
                            <span className="text-sm text-muted-foreground">
                                {title}
                            </span>
                        ) : null}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => router.post(`/c/${client.code}/logout`)}
                    >
                        Logout
                    </Button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl p-6">{children}</main>
        </AppShell>
    );
}

