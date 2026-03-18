import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { type Department } from '@/types';

interface DeleteDepartmentModalProps {
    open: boolean;
    department: Department | null;
    onClose: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}

export default function DeleteDepartmentModal({
    open,
    department,
    onClose,
    onDelete,
    isDeleting
}: DeleteDepartmentModalProps) {
    if (!open || !department) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Delete Department</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete the department <strong>{department.name}</strong>?
                        This action cannot be undone.
                    </p>
                    {department.users && department.users.length > 0 && (
                        <p className="text-sm text-red-600 mt-2">
                            Warning: This department has {department.users.length} assigned user{department.users.length !== 1 ? 's' : ''}.
                            Users must be reassigned before deletion.
                        </p>
                    )}
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={isDeleting || (department.users && department.users.length > 0)}
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Department'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}