import AppLayout from '@/layouts/app-layout';
import { Department, PaginatedItem, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DepartmentModal from '@/components/departments/DepartmentModal';
import DepartmentList from '@/components/departments/DepartmentList';
import DepartmentDetails from '@/components/departments/DepartmentDetails';
import AddUserModal from '@/components/departments/AddUserModal';
import DeleteDepartmentModal from '@/components/departments/DeleteDepartmentModal';
import DepartmentFilters from '@/components/departments/DepartmentFilters';
import DepartmentPagination from '@/components/departments/DepartmentPagination';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Departments', href: '/departments' },
];

interface DepartmentsIndexProps {
    userPermissions?: string[];
    isSuperAdmin?: boolean;
}


interface AvailableUser {
    id: number;
    name: string;
    email: string;
}

export default function DepartmentsIndex(props: DepartmentsIndexProps) {
    const {
        userPermissions = [],
        isSuperAdmin = false
    } = props;

    const [departments, setDepartments] = useState<PaginatedItem>({} as PaginatedItem);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        per_page: 10
    });
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [selectedUsersForAssignment, setSelectedUsersForAssignment] = useState<number[]>([]);
    const [assigningUsers, setAssigningUsers] = useState(false);
    const [removingUserId, setRemovingUserId] = useState<number | null>(null);
    const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);

    // Department Modal State
    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [departmentModalMode, setDepartmentModalMode] = useState<'create' | 'edit'>('create');
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const canCreateDepartment = userPermissions.includes('department.create') || isSuperAdmin;
    const canManageEmployees = userPermissions.includes('department.update') || isSuperAdmin;
    const canDeleteDepartment = userPermissions.includes('department.delete') || isSuperAdmin;

    const fetchDepartments = () => {
        setLoading(true);
        setError(null);

        axios.get('/admin/departments/data', { params: filters })
            .then(res => {
                const departmentsData = res.data || {};
                setDepartments(departmentsData);

                // Update selected department with fresh data if it exists
                if (selectedDepartment && departmentsData.data) {
                    const updatedDepartment = departmentsData.data.find((dept: Department) => dept.id === selectedDepartment.id);
                    if (updatedDepartment) {
                        setSelectedDepartment(updatedDepartment);
                    }
                }
            })
            .catch(err => {
                console.error('Failed to load departments:', err);
                setError('Failed to load departments. Please try again.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get('search') || '';
        const page = parseInt(urlParams.get('page') || '1');
        const per_page = parseInt(urlParams.get('per_page') || '10');

        setFilters({ search, page, per_page });

        fetchDepartments();
        // eslint-disable-next-line
    }, []);

    const handleFilterChange = (key: string, value: string | number) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1
        }));
    };


    const handleApplyFilters = () => fetchDepartments();

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
        fetchDepartments();
    };

    const handleDepartmentClick = (department: Department) => {
        if (selectedDepartment?.id === department.id) {
            setSelectedDepartment(null);
            return;
        }
        setSelectedDepartment(department);
        loadAvailableUsers(department);
    };

    const loadAvailableUsers = (dept?: Department) => {
        if (!(dept || selectedDepartment)) return;

        setLoadingAvailableUsers(true);
        axios.get('/admin/departments/available-users')
            .then(res => setAvailableUsers(res.data || []))
            .catch(err => {
                console.error('Failed to load available users:', err);
                setError('Failed to load available users. Please try again.');
            })
            .finally(() => setLoadingAvailableUsers(false));
    };

    const handleAssignUsers = () => {
        if (!selectedDepartment || selectedUsersForAssignment.length === 0) return;

        setAssigningUsers(true);
        axios.post(`/admin/departments/${selectedDepartment.id}/bulk-assign`, {
            user_ids: selectedUsersForAssignment
        })
            .then(() => {
                setShowAddUserModal(false);
                setSelectedUsersForAssignment([]);
                fetchDepartments();
                setError(null);
            })
            .catch(err => {
                console.error('Failed to assign users:', err);
                setError(err.response?.data?.message || 'Failed to assign users. Please try again.');
            })
            .finally(() => setAssigningUsers(false));
    };

    const handleRemoveUser = (userId: number) => {
        if (!selectedDepartment) return;

        setRemovingUserId(userId);
        axios.delete(`/admin/departments/${selectedDepartment.id}/remove-user/${userId}`)
            .then(() => {
                fetchDepartments();
                setError(null);
            })
            .catch(err => {
                console.error('Failed to remove user:', err);
                setError(err.response?.data?.message || 'Failed to remove user. Please try again.');
            })
            .finally(() => setRemovingUserId(null));
    };

    // Department Modal Handlers
    const handleOpenCreateModal = () => {
        setDepartmentModalMode('create');
        setEditingDepartment(null);
        setShowDepartmentModal(true);
    };

    const handleOpenEditModal = (department: Department) => {
        setDepartmentModalMode('edit');
        setEditingDepartment(department);
        setShowDepartmentModal(true);
    };

    const handleCloseDepartmentModal = () => {
        setShowDepartmentModal(false);
        setEditingDepartment(null);
    };

    const handleDepartmentModalSuccess = () => {
        fetchDepartments();
        setError(null);
    };

    // Delete Modal Handlers
    const handleOpenDeleteModal = (department: Department) => {
        setDeletingDepartment(department);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingDepartment(null);
    };

    const handleDeleteDepartment = () => {
        if (!deletingDepartment) return;

        setIsDeleting(true);
        axios.delete(`/admin/departments/${deletingDepartment.id}`)
            .then(() => {
                setShowDeleteModal(false);
                setDeletingDepartment(null);
                fetchDepartments();
                setSelectedDepartment(null);
                setError(null);
            })
            .catch(err => {
                console.error('Failed to delete department:', err);
                setError(err.response?.data?.message || 'Failed to delete department. Please try again.');
            })
            .finally(() => setIsDeleting(false));
    };

    const totalDepartments = departments.total || 0;
    const currentPage = departments.current_page || 1;
    const lastPage = departments.last_page || 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                        <p className="text-muted-foreground">
                            Manage organizational departments and their members
                        </p>
                    </div>
                    {canCreateDepartment && (
                        <Button onClick={handleOpenCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Department
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <DepartmentFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={handleApplyFilters}
                />

                {/* Error State */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-sm text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Loading departments...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="animate-pulse p-2 border rounded">
                                            <div className="h-4 bg-gray-200 rounded mb-1"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-2 lg:col-span-2">
                            <CardContent>
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="animate-pulse p-2 border rounded">
                                            <div className="h-4 bg-gray-200 rounded mb-1"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <DepartmentList
                            departments={departments}
                            selectedDepartment={selectedDepartment}
                            onDepartmentClick={handleDepartmentClick}
                            canCreateDepartment={canCreateDepartment}
                            onCreateDepartment={handleOpenCreateModal}
                            loading={loading}
                            filters={filters}
                        />

                        <div className="md:col-span-2 lg:col-span-2">
                            {selectedDepartment ? (
                                <DepartmentDetails
                                    department={selectedDepartment}
                                    canManageEmployees={canManageEmployees}
                                    canDeleteDepartment={canDeleteDepartment}
                                    onEditDepartment={handleOpenEditModal}
                                    onDeleteDepartment={handleOpenDeleteModal}
                                    onAddUser={() => setShowAddUserModal(true)}
                                    onRemoveUser={handleRemoveUser}
                                    removingUserId={removingUserId}
                                />
                            ) : (
                                <Card className="flex items-center justify-center h-full">
                                    <CardContent className="w-full">
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-muted-foreground">Select a department to view details</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                {!loading && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Common department management tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {canCreateDepartment && (
                                    <Button variant="outline" onClick={handleOpenCreateModal}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Department
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {!loading && (
                    <DepartmentPagination
                        currentPage={currentPage}
                        lastPage={lastPage}
                        totalDepartments={totalDepartments}
                        filters={filters}
                        onPageChange={handlePageChange}
                    />
                )}

                {/* Add User Modal */}
                <AddUserModal
                    open={showAddUserModal}
                    department={selectedDepartment}
                    availableUsers={availableUsers}
                    selectedUsers={selectedUsersForAssignment}
                    onClose={() => {
                        setShowAddUserModal(false);
                        setSelectedUsersForAssignment([]);
                    }}
                    onUserToggle={(userId) => {
                        if (selectedUsersForAssignment.includes(userId)) {
                            setSelectedUsersForAssignment(
                                selectedUsersForAssignment.filter(id => id !== userId)
                            );
                        } else {
                            setSelectedUsersForAssignment([
                                ...selectedUsersForAssignment,
                                userId
                            ]);
                        }
                    }}
                    onAssignUsers={handleAssignUsers}
                    loadingAvailableUsers={loadingAvailableUsers}
                    assigningUsers={assigningUsers}
                />

                {/* Department Modal */}
                <DepartmentModal
                    open={showDepartmentModal}
                    department={editingDepartment}
                    onClose={handleCloseDepartmentModal}
                    mode={departmentModalMode}
                    onSuccess={handleDepartmentModalSuccess}
                />

                {/* Delete Department Modal */}
                <DeleteDepartmentModal
                    open={showDeleteModal}
                    department={deletingDepartment}
                    onClose={handleCloseDeleteModal}
                    onDelete={handleDeleteDepartment}
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
