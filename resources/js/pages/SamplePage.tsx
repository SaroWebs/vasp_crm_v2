import EmployeeTaskProgress from "@/components/admin/employees/EmployeeTaskProgress";
import TaskTimeline from "@/components/admin/TaskTimeline";
import MajorTasks from "@/components/tasks/MajorTasks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { Users } from "lucide-react";
import { useState } from "react";

// TaskTimeline
interface Employee {
    id: number;
    name: string;
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sample Page',
        href: '/sample',
    },
];
export default function SamplePage() {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [employees, setEmployees] = useState<Employee[]>([]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sample Page" />
            <div className="p-4">
                <TaskTimeline />
            </div>
            <div className="p-4">
                <MajorTasks employees={employees || []} />
            </div>
            <div className="">
                <Card>
                    <CardHeader>
                        <div className="">
                            <CardTitle>Employee Progress</CardTitle>
                            <CardDescription>
                                Task time entries and progress tracking
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Employee Selection */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedEmployeeId}
                                        onChange={(e) => {
                                            setSelectedEmployeeId(e.target.value);
                                        }}
                                    >
                                        <option value="all">All employees</option>
                                        {(employees || []).map((employee) => (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >
                                                {employee.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Employee Task Progress Component */}
                            {selectedEmployeeId === 'all' ? (
                                <EmployeeTaskProgress employeeId="all" />
                            ) : selectedEmployeeId ? (
                                <EmployeeTaskProgress
                                    employeeId={Number(selectedEmployeeId)}
                                />
                            ) : (
                                <EmployeeTaskProgress employeeId="all" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}