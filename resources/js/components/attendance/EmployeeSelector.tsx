import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Employee {
    id: number;
    name: string;
}

interface EmployeeSelectorProps {
    employees: Array<{ id: number; name: string }>;
    selectedEmployeeId: number | null;
    onEmployeeChange: (id: number | null) => void;
}

export function EmployeeSelector({ employees, selectedEmployeeId, onEmployeeChange }: EmployeeSelectorProps) {
    return (
        <Select
            value={selectedEmployeeId ? String(selectedEmployeeId) : undefined}
            onValueChange={(value) => onEmployeeChange(value ? Number(value) : null)}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
                {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}