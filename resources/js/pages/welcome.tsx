import { dashboard } from '@/routes/admin';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, CheckCircle, Users, ArrowRight } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative min-h-[99vh] flex flex-col overflow-hidden">
                {/* Parallax Background Pattern */}
                <div
                    aria-hidden
                    className="pointer-events-none select-none fixed inset-0 z-0"
                    style={{
                        background:
                            'linear-gradient(120deg, var(--tw-gradient-stops)), url("data:image/svg+xml,%3csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3crect x=\'39\' width=\'2\' height=\'80\' fill=\'%23e5e7eb\' fill-opacity=\'0.2\'/%3e%3crect y=\'41\' width=\'80\' height=\'2\' fill=\'%23e5e7eb\' fill-opacity=\'0.2\'/%3e%3c/svg%3e") repeat',
                        backgroundSize: 'cover, 80px 80px',
                        backgroundPosition: 'center, top left',
                        backgroundAttachment: 'fixed',
                        zIndex: 0,
                        minHeight: '100vh',
                    }}
                />
                <div className="relative z-10 flex flex-col min-h-[99vh] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 bg-opacity-80">
                    {/* Header */}
                    <header className="border-b bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm">
                        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Ticket className="h-8 w-8 text-slate-900 dark:text-slate-100" />
                                <h1 className="text-2xl text-slate-900 dark:text-slate-100 font-bold">VASP Ticket</h1>
                            </div>
                            <div className="flex gap-3">
                                {auth?.user ? (
                                    <Link href={dashboard()}>
                                        <Button>Go to Dashboard</Button>
                                    </Link>
                                ) : (
                                    <Link href="/admin/login">
                                        <Button>Login</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Hero Section */}
                    <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center">
                        <div className="text-center max-w-3xl mb-16">
                            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-transparent bg-clip-text">
                                Streamline Your Support Workflow
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8">
                                Efficient ticket management for organizations to raise issues and teams to manage tasks seamlessly.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Link href="/admin/login">
                                    <Button size="lg" className="gap-2">
                                        Get Started <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
                            <Card className="border-2 border-slate-200/70 dark:border-slate-800 hover:border-teal-500/50 transition-colors bg-white/70 dark:bg-slate-900/60 shadow-sm">
                                <CardHeader>
                                    <Ticket className="h-12 w-12 text-teal-600 dark:text-teal-400 mb-4" />
                                    <CardTitle className="text-slate-900 dark:text-slate-100">Organization Ticket Raising</CardTitle>
                                    <CardDescription>
                                        Organization users can submit support tickets with detailed descriptions and track status in real-time.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="border-2 border-slate-200/70 dark:border-slate-800 hover:border-teal-500/50 transition-colors bg-white/70 dark:bg-slate-900/60 shadow-sm">
                                <CardHeader>
                                    <CheckCircle className="h-12 w-12 text-teal-600 dark:text-teal-400 mb-4" />
                                    <CardTitle className="text-slate-900 dark:text-slate-100">Efficient Team Workflows</CardTitle>
                                    <CardDescription>
                                        Teams benefit from streamlined ticket assignment, progress tracking, and workflow automation for better productivity.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="border-2 border-slate-200/70 dark:border-slate-800 hover:border-teal-500/50 transition-colors bg-white/70 dark:bg-slate-900/60 shadow-sm">
                                <CardHeader>
                                    <Users className="h-12 w-12 text-teal-600 dark:text-teal-400 mb-4" />
                                    <CardTitle className="text-slate-900 dark:text-slate-100">Advanced Access Control</CardTitle>
                                    <CardDescription>
                                        Robust user authentication with secure access controls and role-based permissions.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-6">
                        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                            <p>&copy; {new Date().getFullYear()} VASP Ticket. All rights reserved.</p>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
