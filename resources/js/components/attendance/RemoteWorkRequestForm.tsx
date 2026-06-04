import { useState } from 'react';
import axios from 'axios';
import { Button, Textarea, Stack, Alert } from '@mantine/core';
import { CheckCircle2, XCircle } from 'lucide-react';
import { DateInput } from '@mantine/dates';

interface RemoteWorkRequestFormProps {
    auth: any;
    onSuccess?: () => void;
}

interface FormData {
    start_date: string;
    end_date: string;
    reason: string;
}

export function RemoteWorkRequestForm({ auth, onSuccess }: RemoteWorkRequestFormProps) {
    const [formData, setFormData] = useState<FormData>({
        start_date: '',
        end_date: '',
        reason: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.start_date || !formData.end_date || !formData.reason) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const response = await axios.post('/api/my/remote-work', formData);
            setMessage({ type: 'success', text: response.data.message });
            setFormData({
                start_date: '',
                end_date: '',
                reason: '',
            });
            onSuccess?.();
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message ?? 'Failed to submit remote work request.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <DateInput
                        label="Start Date"
                        value={formData.start_date ? new Date(formData.start_date) : null}
                        onChange={(date) => setFormData({ ...formData, start_date: date ? date.toString().split('T')[0] : '' })}
                        required
                        flex={1}
                    />
                    <DateInput
                        label="End Date"
                        value={formData.end_date ? new Date(formData.end_date) : null}
                        onChange={(date) => setFormData({ ...formData, end_date: date ? date.toString().split('T')[0] : '' })}
                        required
                        flex={1}
                    />
                </div>

                <Textarea
                    label="Reason"
                    placeholder="Enter reason for remote work"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.currentTarget.value })}
                    required
                    minRows={3}
                />

                {message && (
                    <Alert
                        color={message.type === 'success' ? 'green' : 'red'}
                        icon={message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        withCloseButton
                        onClose={() => setMessage(null)}
                    >
                        {message.text}
                    </Alert>
                )}

                <Button type="submit" loading={submitting} mt="sm">
                    Submit Remote Work Request
                </Button>
            </Stack>
        </form>
    );
}