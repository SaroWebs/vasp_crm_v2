import { useEffect, useState } from 'react';
import { Button, Switch, Tooltip, Alert } from '@mantine/core';
import { Fingerprint, Info, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

interface PunchWidgetProps {
    onPunchSuccess?: () => void;
}

export function PunchWidget({ onPunchSuccess }: PunchWidgetProps) {
    const [loading, setLoading] = useState(false);
    const [isRemote, setIsRemote] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 4000);
        return () => clearTimeout(timer);
    }, [message]);

    const handlePunch = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await axios.post('/api/my/attendance/punch', {
                mode: isRemote ? 'remote' : 'office',
            });
            setMessage({ type: 'success', text: response.data.message });
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
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <Tooltip
                    label={
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                            First punch = <strong>Punch In</strong>.<br />
                            Second punch = <strong>Punch Out</strong>.<br />
                            Toggle <em>Remote</em> if working from home.
                        </div>
                    }
                    withArrow
                    multiline
                    w={200}
                >
                    <div className="flex flex-col gap-2">

                        <Switch
                            checked={isRemote}
                            onChange={(e) => setIsRemote(e.currentTarget.checked)}
                            label="Remote"
                            labelPosition="left"
                        />
                        <Button
                            onClick={handlePunch}
                            loading={loading}
                            leftSection={<Fingerprint size={16} />}
                            size="md"
                        >
                            Punch
                        </Button>
                    </div>
                </Tooltip>
            </div>

            {message && (
                <div className="absolute top-4 right-4">
                    <Alert
                        color={message.type === 'success' ? 'green' : 'red'}
                        icon={message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        withCloseButton
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                </div>
            )}
        </div>
    );
}
