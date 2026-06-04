import { useState } from 'react';
import axios from 'axios';
import { Alert, Button, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { CheckCircle2, XCircle } from 'lucide-react';

interface FieldWorkRequestFormProps {
    auth: any;
    onSuccess?: () => void;
}

interface FormData {
    start_date: string;
    end_date: string;
    location: string;
    description: string;
    custom_start_time: string;
    custom_end_time: string;
}

function formatDate(value: Date | string | null): string {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

export function FieldWorkRequestForm({ auth: _auth, onSuccess }: FieldWorkRequestFormProps) {
    const [formData, setFormData] = useState<FormData>({
        start_date: '',
        end_date: '',
        location: '',
        description: '',
        custom_start_time: '',
        custom_end_time: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.start_date || !formData.end_date || !formData.location) {
            setMessage({ type: 'error', text: 'Please fill in the required fields.' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const payload = {
                start_date: formData.start_date,
                end_date: formData.end_date,
                location: formData.location,
                description: formData.description || null,
                custom_start_time: formData.custom_start_time || null,
                custom_end_time: formData.custom_end_time || null,
            };
            const response = await axios.post('/api/my/field-work', payload);
            setMessage({ type: 'success', text: response.data.message });
            setFormData({
                start_date: '',
                end_date: '',
                location: '',
                description: '',
                custom_start_time: '',
                custom_end_time: '',
            });
            onSuccess?.();
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message ?? 'Failed to submit field work request.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <Group grow>
                    <DateInput
                        label="Start Date"
                        value={formData.start_date ? new Date(formData.start_date) : null}
                        onChange={(date) => setFormData({ ...formData, start_date: formatDate(date) })}
                        required
                    />
                    <DateInput
                        label="End Date"
                        value={formData.end_date ? new Date(formData.end_date) : null}
                        onChange={(date) => setFormData({ ...formData, end_date: formatDate(date) })}
                        required
                    />
                </Group>

                <TextInput
                    label="Location"
                    placeholder="Client office, site, city, or route"
                    value={formData.location}
                    onChange={(event) => setFormData({ ...formData, location: event.currentTarget.value })}
                    required
                />

                <Group grow>
                    <TimeInput
                        label="Custom Start"
                        value={formData.custom_start_time}
                        onChange={(event) => setFormData({ ...formData, custom_start_time: event.currentTarget.value })}
                    />
                    <TimeInput
                        label="Custom End"
                        value={formData.custom_end_time}
                        onChange={(event) => setFormData({ ...formData, custom_end_time: event.currentTarget.value })}
                    />
                </Group>

                <Textarea
                    label="Description"
                    placeholder="Describe the field work"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.currentTarget.value })}
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
                    Submit Field Work Request
                </Button>
            </Stack>
        </form>
    );
}
