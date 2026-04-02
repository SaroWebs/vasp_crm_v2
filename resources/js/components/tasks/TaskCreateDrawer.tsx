import React, { useEffect, useState } from 'react';
import {
    Drawer,
    TextInput,
    Textarea,
    Button,
    Group,
    Box,
    Alert,
    Text,
    Stack,
    Badge,
    Flex,
    ActionIcon,
    Divider
} from '@mantine/core';
import {
    AlertCircle,
    FileText,
    Plus,
    Save,
    RefreshCw,
    Loader2,
    X
} from 'lucide-react';
import axios from 'axios';
import { useDisclosure } from '@mantine/hooks';
import TaskDurationPicker from '@/components/tasks/TaskDurationPicker';

interface TaskCreateDrawerProps {
    onSuccess?: () => void;
}

const TaskCreateDrawer: React.FC<TaskCreateDrawerProps> = ({
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [loadingTaskTypes, setLoadingTaskTypes] = useState(false);
    const [loadingSlaPolicies, setLoadingSlaPolicies] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [generatedTaskCode, setGeneratedTaskCode] = useState('');
    const [loadingData, setLoadingData] = useState(false);
    const [filteredSlaPolicies, setFilteredSlaPolicies] = useState<{ value: string; label: string; priority?: string }[]>([]);
    const [minDueDate, setMinDueDate] = useState<string>('');
    const [loadingMinDueDate, setLoadingMinDueDate] = useState(false);

    // Form state - simplified for self-assigned tasks
    const [formData, setFormData] = useState(() => {
        // Default to today in Asia/Kolkata timezone
        const today = new Date().toLocaleString("sv-SE", {
            timeZone: "Asia/Kolkata",
            hour12: false
        }).slice(0, 16);
        
        return {
            title: '',
            description: '',
            task_code: '',
            state: 'Draft',
            start_at: today,
            due_at: today,
            estimate_hours: '' as string,
            task_type_id: '',
            sla_policy_id: ''
        };
    });

    // State for advanced options toggle
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Calculate min due date using API based on working hours and holidays
    // If minimum due date is found then set default due date in formData
    const fetchMinDueDate = async (estimateHours?: string, startAt?: string) => {
        const hours = Number.parseFloat(estimateHours || '0');
        if (!hours || hours <= 0) {
            const baseDate = startAt ? new Date(startAt) : new Date();
            const now = baseDate.toISOString().slice(0, 16);
            setMinDueDate(now);
            setFormData(prev => ({
                ...prev,
                due_at: prev.due_at || now
            }));
            return;
        }

        setLoadingMinDueDate(true);
        try {
            const baseDate = startAt ? new Date(startAt) : undefined;
            const res = await axios.get('/data/tasks/calculate-min-due-date', {
                params: { 
                    estimate_hours: hours,
                    start_at: baseDate ? baseDate.toISOString() : undefined
                }
            });
            if (res.data?.data?.min_due_date) {
                const minDate = res.data.data.min_due_date.slice(0, 16);
                setMinDueDate(minDate);
                setFormData(prev => ({
                    ...prev,
                    due_at: (!prev.due_at || new Date(prev.due_at).getTime() < new Date(minDate).getTime()) ? minDate : prev.due_at
                }));
            }
        } catch {
            // Fallback to simple calculation if API fails
            console.warn('Failed to calculate min due date from API, using fallback');
            const baseDate = startAt ? new Date(startAt) : new Date();
            const fallbackDate = new Date(baseDate.getTime() + (hours * 60 * 60 * 1000));
            const minDate = fallbackDate.toISOString().slice(0, 16);
            setMinDueDate(minDate);
            setFormData(prev => ({
                ...prev,
                due_at: (!prev.due_at || new Date(prev.due_at).getTime() < new Date(minDate).getTime()) ? minDate : prev.due_at
            }));
        } finally {
            setLoadingMinDueDate(false);
        }
    };

    // Update minimum due date when estimate hours or start_at change, with 2s debounce
    useEffect(() => {
        if (formData.estimate_hours) {
            const handler = setTimeout(() => {
                fetchMinDueDate(formData.estimate_hours, formData.start_at);
            }, 2000);
            return () => clearTimeout(handler);
        } else {
            fetchMinDueDate(formData.estimate_hours, formData.start_at);
        }
    }, [formData.estimate_hours, formData.start_at]);

    const [taskTypes, setTaskTypes] = useState<{ value: string; label: string; code?: string }[]>([]);

    const generateTaskCode = () => {
        const prefix = 'TASK';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        const code = `${prefix}-${timestamp}-${random}`;
        setGeneratedTaskCode(code);
        setFormData(prev => ({ ...prev, task_code: code }));
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const fetchTaskTypes = async () => {
        setLoadingTaskTypes(true);
        try {
            const res = await axios.get('/data/task-types');
            const options = (res.data?.data || res.data || []).map((t: any) => ({
                value: String(t.id),
                label: t.name,
                code: t.code,
            }));
            setTaskTypes(options);
        } catch (err: any) {
            console.error('Failed to load task types', err);
            setError(err.response?.data?.message || 'Failed to load task types');
        } finally {
            setLoadingTaskTypes(false);
        }
    };

    const fetchSlaPolicies = async (taskTypeId: string | null) => {
        if (!taskTypeId) {
            setFilteredSlaPolicies([]);
            return;
        }

        setLoadingSlaPolicies(true);
        try {
            const res = await axios.get(`/data/task-types/${taskTypeId}/sla-policies`);
            const options = (res.data?.data || res.data || []).map((p: any) => ({
                value: String(p.id),
                label: `${p.name} (${p.priority || 'N/A'})`,
                priority: p.priority,
            }));
            setFilteredSlaPolicies(options);
        } catch (err: any) {
            console.error('Failed to load SLA policies', err);
            setError(err.response?.data?.message || 'Failed to load SLA policies');
        } finally {
            setLoadingSlaPolicies(false);
        }
    };

    useEffect(() => {
        if (opened) {
            setLoadingData(true);
            generateTaskCode();
            // Set initial min due date based on default start_at
            const today = new Date().toLocaleString("sv-SE", {
                timeZone: "Asia/Kolkata",
                hour12: false
            }).slice(0, 16);
            setMinDueDate(today);
            fetchTaskTypes().finally(() => {
                setLoadingData(false);
            });
        }
    }, [opened]);

    useEffect(() => {
        if (formData.task_type_id) {
            fetchSlaPolicies(formData.task_type_id);
        } else {
            setFilteredSlaPolicies([]);
        }
    }, [formData.task_type_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formDataObj = new FormData();

        // Add all form fields
        formDataObj.append('title', formData.title);
        formDataObj.append('description', formData.description);
        formDataObj.append('task_code', formData.task_code);
        formDataObj.append('task_type_id', formData.task_type_id || '');
        formDataObj.append('sla_policy_id', formData.sla_policy_id || '');
        formDataObj.append('state', formData.state);
        formDataObj.append('start_at', formData.start_at);
        formDataObj.append('due_at', formData.due_at);
        formDataObj.append('estimate_hours', formData.estimate_hours || '');
        formDataObj.append('tags', JSON.stringify([]));
        formDataObj.append('metadata', '');

        axios.post('/self/tasks', formDataObj, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
            .then((res) => {
                console.log(res.data);
                // Reset to default values with today's date
                const today = new Date().toLocaleString("sv-SE", {
                    timeZone: "Asia/Kolkata",
                    hour12: false
                }).slice(0, 16);
                setFormData({
                    title: '',
                    description: '',
                    task_code: '',
                    state: 'Draft',
                    start_at: today,
                    due_at: today,
                    estimate_hours: '',
                    task_type_id: '',
                    sla_policy_id: ''
                });
                setFilteredSlaPolicies([]);
                if(onSuccess) onSuccess();
                close();
            })
            .catch((err) => {
                console.error('Error creating task:', err);
                setError(err.response?.data?.message || 'Failed to create task');
            })
            .finally(() => {
                console.info('Completed');
                setLoading(false);
            });
    };

    return (
        <>
            <ActionIcon
                onClick={open}
                variant="filled"
                color="blue"
                size="lg"
                aria-label="Create Task"
            >
                <Plus size={20} />
            </ActionIcon>

            <Drawer
                opened={opened}
                onClose={close}
                title={
                    <Flex align="center" gap="md">
                        <Badge color="blue" variant="light">
                            <FileText size={18} />
                        </Badge>
                        <Text size="lg" fw={600}>Create New Task</Text>
                    </Flex>
                }
                size="md"
                position="right"
                overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
                closeOnEscape={false}
                closeOnClickOutside={false}
                zIndex={9999}
                className='bg-white'
            >
                {loadingData && (
                    <Alert
                        icon={<Loader2 size={16} />}
                        title="Loading"
                        color="blue"
                        mb="md"
                    >
                        Loading task data...
                    </Alert>
                )}

                {error && (
                    <Alert
                        icon={<AlertCircle size={16} />}
                        title="Error"
                        color="red"
                        mb="md"
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box mt="md">
                        <Stack gap="md">
                            {/* Task Code with Generate Button */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <TextInput
                                    label="Task Code"
                                    placeholder="Enter task code or generate one"
                                    required
                                    value={formData.task_code}
                                    onChange={(e) => handleInputChange('task_code', e.target.value)}
                                    disabled={loading}
                                    style={{ flex: 1 }}
                                />
                                <ActionIcon
                                    onClick={generateTaskCode}
                                    variant="filled"
                                    color="blue"
                                    size="lg"
                                    aria-label="Generate Task Code"
                                    disabled={loading}
                                >
                                    <RefreshCw size={16} />
                                </ActionIcon>
                            </div>
                            {generatedTaskCode && (
                                <Text size="xs" c="dimmed">
                                    Generated: {generatedTaskCode}
                                </Text>
                            )}

                            {/* Task Title */}
                            <TextInput
                                label="Task Title"
                                placeholder="Enter task title"
                                required
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                leftSection={<FileText size={16} />}
                                disabled={loading}
                            />

                            {/* Description */}
                            <Textarea
                                label="Description"
                                placeholder="Describe the task..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                minRows={4}
                                disabled={loading}
                            />

                            <TaskDurationPicker
                                id="estimate_hours"
                                label="Estimated Duration"
                                value={formData.estimate_hours}
                                onChange={(value) => handleInputChange('estimate_hours', value)}
                                required
                                disabled={loading}
                                helperText="Choose a duration using days, hours, and minutes."
                            />

                            {/* Start Time */}
                            <TextInput
                                label="Start Time"
                                placeholder="Select start time"
                                type="datetime-local"
                                value={formData.start_at}
                                onChange={(e) => handleInputChange('start_at', e.target.value)}
                                disabled={loading}
                            />

                            {/* Due Date */}
                            <div className="space-y-2">
                                <TextInput
                                    label="Due Date"
                                    placeholder="Select due date"
                                    type="datetime-local"
                                    value={formData.due_at}
                                    onChange={(e) => handleInputChange('due_at', e.target.value)}
                                    min={minDueDate}
                                    disabled={loading}
                                />
                                {formData.estimate_hours && Number.parseFloat(formData.estimate_hours) > 0 && (
                                    <Text size="xs" c="dimmed">
                                        {loadingMinDueDate ? 'Calculating...' : `Minimum due date based on ${formData.estimate_hours} hours: ${minDueDate ? new Date(minDueDate).toLocaleString() : 'N/A'}`}
                                    </Text>
                                )}
                            </div>

                            {/* Advanced Options Toggle */}
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="showAdvanced"
                                    checked={showAdvanced}
                                    onChange={(e) => setShowAdvanced(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <label htmlFor="showAdvanced" className="text-sm font-medium cursor-pointer">
                                    Show Advanced Options
                                </label>
                            </div>

                            {/* Advanced Fields */}
                            {showAdvanced && (
                            <>
                                {/* Task Type */}
                                <div>
                                    <label
                                        htmlFor="task-type-select"
                                        className="block mb-1 text-sm font-medium text-gray-700"
                                    >
                                        Task Type
                                    </label>
                                    <select
                                        id="task-type-select"
                                        value={formData.task_type_id}
                                        onChange={(e) => {
                                            handleInputChange('task_type_id', e.target.value || '');
                                            handleInputChange('sla_policy_id', '');
                                        }}
                                        disabled={loadingTaskTypes}
                                        className={`w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none bg-white text-gray-900 ${loadingTaskTypes ? 'bg-gray-100' : ''}`}
                                    >
                                        <option value="">{loadingTaskTypes ? 'Loading...' : 'Select task type'}</option>
                                        {taskTypes.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                                <div className="mb-4">
                                    <label htmlFor="sla-policy-select" className="block mb-1 text-sm font-medium text-gray-700">
                                        SLA Policy
                                    </label>
                                    <select
                                        id="sla-policy-select"
                                        value={formData.sla_policy_id}
                                        onChange={e => handleInputChange('sla_policy_id', e.target.value || '')}
                                        disabled={loading || loadingSlaPolicies || filteredSlaPolicies.length === 0}
                                        className={`w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none bg-white text-gray-900 ${loading || loadingSlaPolicies ? 'bg-gray-100' : ''}`}
                                    >
                                        <option value="">
                                            {loadingSlaPolicies
                                                ? "Loading..."
                                                : formData.task_type_id
                                                    ? "Select SLA policy"
                                                    : "Select a task type first"}
                                        </option>
                                        {filteredSlaPolicies.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {(filteredSlaPolicies.length === 0 && formData.task_type_id) && (
                                        <p className="text-xs text-gray-400 mt-1">No SLA policies for this type</p>
                                    )}
                                </div>
                            </>
                            )}
                        </Stack>
                    </Box>

                    <Divider my="md" />

                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="outline"
                            onClick={close}
                            disabled={loading}
                            leftSection={<X size={16} />}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || loadingData || !formData.title || !formData.task_code || !formData.estimate_hours}
                            leftSection={loading ? <Loader2 size={16} /> : <Save size={16} />}
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </Group>
                </form>
            </Drawer>
        </>
    );
};

export default TaskCreateDrawer;
