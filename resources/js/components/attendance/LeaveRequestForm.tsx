import { useState } from 'react';
import axios from 'axios';
import { Button, Select, Textarea, Stack, Group, Alert } from '@mantine/core';
import { CheckCircle2, XCircle } from 'lucide-react';
import { DateInput } from '@mantine/dates';

interface LeaveType {
    id: number;
    name: string;
    default_hours?: number;
}

interface LeaveRequestFormProps {
    auth: any;
    leaveTypes: LeaveType[];
    onSuccess?: () => void;
}

interface FormData {
    leave_type_id: number | null;
    start_date: string;
    end_date: string;
    reason: string;
}

export function LeaveRequestForm({ auth, leaveTypes, onSuccess }: LeaveRequestFormProps) {
    const [formData, setFormData] = useState<FormData>({
        leave_type_id: null,
        start_date: '',
        end_date: '',
        reason: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.leave_type_id || !formData.start_date || !formData.end_date || !formData.reason) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const response = await axios.post('/api/my/leaves', formData);
            setMessage({ type: 'success', text: response.data.message });
            setFormData({
                leave_type_id: null,
                start_date: '',
                end_date: '',
                reason: '',
            });
            onSuccess?.();
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message ?? 'Failed to submit leave request.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack >
                <Select
                    label="Leave Type"
                    placeholder="Select leave type"
                    value={formData.leave_type_id?.toString() ?? null}
                    onChange={(value) => setFormData({ ...formData, leave_type_id: value ? Number(value) : null })}
                    data={leaveTypes.map((lt) => ({ value: lt.id.toString(), label: lt.name }))}
                    required
                />

                <Group grow>
                    <DateInput
                        label="Start Date"
                        value={formData.start_date ? new Date(formData.start_date) : null}
                        onChange={(date) => setFormData({ ...formData, start_date: date ? date.toString().split('T')[0] : '' })}
                        required
                    />
                    <DateInput
                        label="End Date"
                        value={formData.end_date ? new Date(formData.end_date) : null}
                        onChange={(date) => setFormData({ ...formData, end_date: date ? date.toString().split('T')[0] : '' })}
                        required
                    />
                </Group>

                <Textarea
                    label="Reason"
                    placeholder="Enter reason for leave"
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
                    Submit Leave Request
                </Button>
            </Stack>
        </form>
    );
}