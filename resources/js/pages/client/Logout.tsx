import { Head } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';

export default function ClientLogout() {
    return (
        <>
            <Head title="Logged Out" />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        You have been logged out successfully
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        You can close this window now
                    </p>
                </div>
            </div>
        </>
    );
}
