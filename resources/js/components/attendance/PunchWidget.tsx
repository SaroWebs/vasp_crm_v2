import { useEffect, useState } from 'react';
import { Alert, Button, Switch, Tooltip } from '@mantine/core';
import { Fingerprint, Info, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

interface PunchWidgetProps {
    auth: {
        user?: {
            employee?: unknown;
        } | null;
    } | null;
    onPunchSuccess?: () => void;
}

export function PunchWidget({ auth, onPunchSuccess }: PunchWidgetProps) {
    const [loading, setLoading] = useState(false);
    const [isRemote, setIsRemote] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [hasEmployeeCode, setHasEmployeeCode] = useState<boolean | null>(null);
    const [canManualRemotePunch, setCanManualRemotePunch] = useState(false);
    const [loadingCode, setLoadingCode] = useState(true);

    useEffect(() => {
        const checkEmployeeCode = async () => {
            setLoadingCode(true);
            try {
                const response = await axios.get('/api/my/attendance/today');
                const data = response.data.data;
                setHasEmployeeCode(data.shift !== null || data.punch_in !== null);
                setCanManualRemotePunch(Boolean(data.shift?.can_manual_remote_punch));
            } catch (error: unknown) {
                const err = error as { response?: { status?: number; data?: { message?: string } } };

                if (err.response?.status === 404 && err.response?.data?.message?.includes('Employee code')) {
                    setHasEmployeeCode(false);
                } else {
                    setHasEmployeeCode(true);
                }
            } finally {
                setLoadingCode(false);
            }
        };

        if (auth?.user?.employee) {
            checkEmployeeCode();
        } else {
            setLoadingCode(false);
        }
    }, [auth]);

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

    if (loadingCode) {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <Switch checked={false} disabled label="Remote" labelPosition="left" />
                    <Button disabled loading size="md">
                        Punch
                    </Button>
                </div>
            </div>
        );
    }

    if (!hasEmployeeCode) {
        return (
            <div className="flex flex-col gap-3">
                <Alert
                    color="yellow"
                    icon={<Info size={16} />}
                    title="Biometric ID Required"
                >
                    Your employee code is not set up. Please contact admin to generate your biometric employee ID.
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <Tooltip
                    label={
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                            First punch = <strong>Punch In</strong>.<br />
                            Second punch = <strong>Punch Out</strong>.<br />
                            Remote punch is shown only for approved remote or field work days.
                        </div>
                    }
                    withArrow
                    multiline
                    w={200}
                >
                    <div className="flex flex-col gap-2">
                        {canManualRemotePunch ? (
                            <Switch
                                checked={isRemote}
                                onChange={(e) => setIsRemote(e.currentTarget.checked)}
                                label="Remote"
                                labelPosition="left"
                            />
                        ) : (
                            <Alert color="yellow" icon={<Info size={16} />}>
                                Manual remote punch is available only after admin approves remote work or field work for today.
                            </Alert>
                        )}
                        {canManualRemotePunch && isRemote && (
                            <Button
                                onClick={handlePunch}
                                loading={loading}
                                leftSection={<Fingerprint size={16} />}
                                size="md"
                            >
                                Punch
                            </Button>
                        )}
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
