import { Select } from '@mantine/core';

interface EmployeeSelectorProps {
    employees: Array<{ id: number; name: string }>;
    selectedEmployeeId: number | null;
    onEmployeeChange: (id: number | null) => void;
}

export function EmployeeSelector({ employees, selectedEmployeeId, onEmployeeChange }: EmployeeSelectorProps) {
    return (
        <Select
            placeholder="Select employee"
            value={selectedEmployeeId ? String(selectedEmployeeId) : null}
            onChange={(value) => onEmployeeChange(value ? Number(value) : null)}
            data={employees.map((employee) => ({
                value: String(employee.id),
                label: employee.name,
            }))}
            searchable
            clearable
            nothingFoundMessage="No employees found"
        />
    );
}
