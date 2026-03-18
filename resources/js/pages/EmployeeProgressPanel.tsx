import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { Card, Button, Group, Text, Title, Input } from '@mantine/core';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Clock, Users, ListCheck, Filter, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EmployeeProgressPanel({ auth, progressData, filterOptions }: {
  auth: any;
  progressData: any;
  filterOptions: {
    date?: string;
    from_date?: string;
    to_date?: string;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(progressData.data || []);
  const [stats, setStats] = useState({
    total_employees: progressData.total_employees || 0,
    total_time: progressData.total_time || 0,
    total_tasks: progressData.total_tasks || 0,
    avg_time_per_employee: progressData.avg_time_per_employee || 0,
  });
  const [filters, setFilters] = useState({
    date: filterOptions.date || '',
    from_date: filterOptions.from_date || '',
    to_date: filterOptions.to_date || '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);

      const response = await fetch(`/admin/api/employee-progress?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setStats({
          total_employees: result.total_employees,
          total_time: result.total_time,
          total_tasks: result.total_tasks,
          avg_time_per_employee: result.avg_time_per_employee,
        });
      }
    } catch (error) {
      console.error('Error fetching employee progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (value: string | null) => {
    setFilters({ ...filters, date: value || '' });
  };


  const clearFilters = () => {
    setFilters({ date: '', from_date: '', to_date: '' });
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
    },
    {
      title: 'Employee Progress',
      href: '/employee-progress',
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Employee Progress" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Filter Section */}
          <Card className="mb-6" shadow="sm" padding="md">
            <Group gap="md" align="center">
              <Group gap="xs" align="center">
                <Calendar className="w-5 h-5 text-gray-500" />
                <Text fw={600}>Filter by Date:</Text>
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  placeholder="Select date"
                />
              </Group>

              <Group gap="xs" align="center">
                <Filter className="w-5 h-5 text-gray-500" />
                <Text fw={600}>Date Range:</Text>
                <Input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                  placeholder="From date"
                />
                <Text>to</Text>
                <Input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                  placeholder="To date"
                />
              </Group>

              <Button variant="default" onClick={clearFilters} leftSection={<X className="w-4 h-4" />}>
                Clear Filters
              </Button>
            </Group>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card shadow="sm" padding="md">
              <Group gap="xs" align="center">
                <Users className="w-6 h-6 text-blue-500" />
                <Text c="dimmed">Total Employees</Text>
              </Group>
              <Title order={3}>{stats.total_employees}</Title>
            </Card>

            <Card shadow="sm" padding="md">
              <Group gap="xs" align="center">
                <Clock className="w-6 h-6 text-green-500" />
                <Text c="dimmed">Total Time (hours)</Text>
              </Group>
              <Title order={3}>{stats.total_time.toFixed(2)}</Title>
            </Card>

            <Card shadow="sm" padding="md">
              <Group gap="xs" align="center">
                <ListCheck className="w-6 h-6 text-purple-500" />
                <Text c="dimmed">Total Tasks Completed</Text>
              </Group>
              <Title order={3}>{stats.total_tasks}</Title>
            </Card>

            <Card shadow="sm" padding="md">
              <Text c="dimmed">Avg Time per Employee</Text>
              <Title order={3}>{Number(stats.avg_time_per_employee).toFixed(2)}</Title>
            </Card>
          </div>

          {/* Employee Progress Table */}
          <Card shadow="sm" padding="md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Time (hours)</TableHead>
                  <TableHead>Tasks Completed</TableHead>
                  <TableHead>Average Time per Task</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/admin/employees/${item.id}`} className="text-blue-600 hover:underline">
                        {item.user_name}
                      </Link>
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.total_time.toFixed(2)}</TableCell>
                    <TableCell>{item.tasks_completed}</TableCell>
                    <TableCell>{(item.total_time / item.tasks_completed).toFixed(2) || '0.00'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
