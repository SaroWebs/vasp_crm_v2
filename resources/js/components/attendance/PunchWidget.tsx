import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import axios from 'axios';

interface PunchWidgetProps {
    onPunchSuccess?: () => void;
}

export function PunchWidget({ onPunchSuccess }: PunchWidgetProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handlePunch = async (mode: 'office' | 'remote' = 'office') => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await axios.post('/api/my/attendance/punch', {
                mode,
            });

            setMessage({
                type: 'success',
                text: response.data.message,
            });

            onPunchSuccess?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to record punch. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-6">
                <div className="flex gap-3">
                    <Button
                        onClick={() => handlePunch('office')}
                        disabled={loading}
                        className="gap-2"
                        size="lg"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogIn className="h-4 w-4" />
                        )}
                        Punch (Office)
                    </Button>
                    <Button
                        onClick={() => handlePunch('remote')}
                        disabled={loading}
                        variant="outline"
                        className="gap-2"
                        size="lg"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="h-4 w-4" />
                        )}
                        Punch (Remote)
                    </Button>
                </div>

                {message && (
                    <p
                        className={`text-sm ${
                            message.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}
                    >
                        {message.text}
                    </p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                    Click to record your attendance. First click = Punch In, second click = Punch Out.
                </p>
            </CardContent>
        </Card>
    );
}