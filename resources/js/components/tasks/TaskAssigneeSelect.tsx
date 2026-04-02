import axios from 'axios';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Employee = {
    id: number;
    name: string;
    email?: string;
};

type Props = {
    id?: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    helperText?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
};

export default function TaskAssigneeSelect({
    id = 'task-assignee',
    label = 'Assign To Employee',
    value,
    onChange,
    error,
    helperText,
    placeholder = 'Select an employee',
    required = false,
    disabled = false,
}: Props) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadEmployees = async (): Promise<void> => {
            setLoading(true);

            try {
                const response = await axios.get('/admin/data/users/assignment');

                if (isMounted) {
                    setEmployees(response.data.users ?? []);
                }
            } catch (error) {
                console.error('Failed to load employees for task assignment:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadEmployees();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label}
                {required ? ' *' : ''}
            </Label>
            <Select
                value={value}
                onValueChange={onChange}
                disabled={disabled || loading}
            >
                <SelectTrigger id={id} aria-invalid={!!error}>
                    <SelectValue
                        placeholder={
                            loading ? 'Loading employees...' : placeholder
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {loading ? (
                        <SelectItem value="__loading" disabled>
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading employees...
                            </span>
                        </SelectItem>
                    ) : employees.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                            No employees found
                        </SelectItem>
                    ) : (
                        employees.map((employee) => (
                            <SelectItem
                                key={employee.id}
                                value={employee.id.toString()}
                            >
                                {employee.name}
                                {employee.email ? ` (${employee.email})` : ''}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            {helperText && !error && (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
