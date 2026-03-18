import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Department } from '@/types';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

interface EmployeeInfoFormProps {
    employee: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        department_id?: number;
        department?: Department;
        user_id?: number;
    };
    departments: Department[];
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

export default function EmployeeInfoForm({ 
    employee, 
    departments, 
    onSuccess, 
    onError 
}: EmployeeInfoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, patch, errors } = useForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        department_id: employee.department_id?.toString() || employee.department?.id?.toString() || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await patch(`/admin/employees/${employee.id}`, {
                onSuccess: () => {
                    onSuccess?.();
                },
                onError: (err) => {
                    onError?.(err);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Employee Information</CardTitle>
                <CardDescription>
                    Update the basic information for this employee
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Enter name"
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Enter email"
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Enter phone number"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department_id">Department *</Label>
                            <Select
                                value={data.department_id}
                                onValueChange={(value) => setData('department_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((department) => (
                                        <SelectItem key={department.id} value={department.id.toString()}>
                                            {department.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.department_id && (
                                <p className="text-sm text-red-600">{errors.department_id}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Employee Info'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}