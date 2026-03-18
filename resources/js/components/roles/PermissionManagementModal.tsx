import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    level: number;
    is_default: boolean;
    permissions: Permission[];
}

interface PermissionManagementModalProps {
    open: boolean;
    role: Role;
    permissions: Record<string, Permission[]>;
    onClose: () => void;
}

export default function PermissionManagementModal({
    open,
    role,
    permissions,
    onClose
}: PermissionManagementModalProps) {
    // State for permission management
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [selectedPermissionIdsForRemoval, setSelectedPermissionIdsForRemoval] = useState<number[]>([]);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isAddingPermissions, setIsAddingPermissions] = useState(false);
    const [isBulkRemovingPermissions, setIsBulkRemovingPermissions] = useState(false);
    const [newItems, setNewItems] = useState<number | null>(0);
    const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
    const [permissionsToRemove, setPermissionsToRemove] = useState<Permission[]>([]);

    useEffect(() => {
        setNewItems(selectedPermissionIds.length);
    }, [selectedPermissionIds]);

    // Helper function to show feedback
    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedbackMessage({ type, message });
    };

    useEffect(() => {
        if (open && role) {
            // Reset state when modal opens
            setSelectedPermissionIds([]);
            setSelectedPermissionIdsForRemoval([]);
            setFeedbackMessage(null);
            setShowRemoveConfirmation(false);
            setPermissionsToRemove([]);
        }
    }, [open, role]);

    const handleAddPermissions = () => {
        if (!role || selectedPermissionIds.length === 0) return;

        // Double-check that we're not trying to add already assigned permissions
        const alreadyAssignedIds = role.permissions.map(p => p.id);
        const newPermissionIds = selectedPermissionIds.filter(id => !alreadyAssignedIds.includes(id));

        if (newPermissionIds.length === 0) {
            showFeedback('error', 'All selected permissions are already assigned to this role.');
            return;
        }

        setIsAddingPermissions(true);
        setFeedbackMessage(null);

        axios.post(`/admin/roles/${role.id}/permissions`, { permission_ids: newPermissionIds })
            .then(() => {
                showFeedback('success', `${newPermissionIds.length} permission(s) added successfully!`);
                setSelectedPermissionIds([]);
                setTimeout(() => window.location.reload(), 1500);
            })
            .catch((error) => {
                console.error('Failed to add permissions:', error);
                showFeedback('error', 'Failed to add permissions. Please try again.');
            })
            .finally(() => {
                setIsAddingPermissions(false);
            });
    };

    const handleBulkRemovePermissions = () => {
        if (!role || selectedPermissionIdsForRemoval.length === 0) return;

        const permissionsToRemoveList = role.permissions.filter(p =>
            selectedPermissionIdsForRemoval.includes(p.id)
        );

        setPermissionsToRemove(permissionsToRemoveList);
        setShowRemoveConfirmation(true);
    };

    const confirmBulkRemovePermissions = () => {
        if (!role || permissionsToRemove.length === 0) return;

        setIsBulkRemovingPermissions(true);
        setFeedbackMessage(null);
        setShowRemoveConfirmation(false);

        // Create an array of permission IDs to remove
        const permissionIdsToRemove = permissionsToRemove.map(p => p.id);

        // Make individual delete requests for each permission
        const deletePromises = permissionIdsToRemove.map(permissionId => {
            return new Promise<void>((resolve, reject) => {
                axios.delete(`/admin/roles/${role.id}/permissions/${permissionId}`)
                    .then(() => resolve())
                    .catch(() => reject());
            });
        });

        Promise.all(deletePromises)
            .then(() => {
                showFeedback('success', `${permissionIdsToRemove.length} permission(s) removed successfully!`);
                setSelectedPermissionIdsForRemoval([]);
                setPermissionsToRemove([]);
                setTimeout(() => window.location.reload(), 1500);
            })
            .catch(() => {
                showFeedback('error', 'Failed to remove some permissions. Please try again.');
            })
            .finally(() => {
                setIsBulkRemovingPermissions(false);
            });
    };

    // Get available permissions (not already assigned to this role)
    const getAvailablePermissions = () => {
        if (!role || !permissions) return {};

        const assignedPermissionIds = role.permissions.map(p => p.id);
        const available: Record<string, Permission[]> = {};

        Object.entries(permissions).forEach(([module, modulePermissions]) => {
            available[module] = modulePermissions.filter(p => !assignedPermissionIds.includes(p.id));
        });

        // Filter out empty modules
        return Object.fromEntries(
            Object.entries(available).filter(([, perms]) => perms.length > 0)
        );
    };

    const availablePermissions = getAvailablePermissions();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[98vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Permissions - {role.name}</DialogTitle>
                    <DialogDescription>
                        Add or remove permissions for this role. Current permissions: {role.permissions.length}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Feedback Message */}
                    {feedbackMessage && (
                        <Alert className={`${feedbackMessage.type === 'error'
                            ? 'border-red-200 bg-red-50 text-red-800'
                            : 'border-green-200 bg-green-50 text-green-800'
                            } relative`}>
                            <div className="flex justify-between items-center">
                                <span>{feedbackMessage.message}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFeedbackMessage(null)}
                                    className="h-auto p-1 hover:bg-transparent"
                                >
                                    ×
                                </Button>
                            </div>
                        </Alert>
                    )}

                    {/* Two Column Layout for Better Flow */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Current Permissions Column */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Current Permissions ({role.permissions.length})</h3>
                            </div>

                            {role.permissions.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                                    <p className="text-muted-foreground">No permissions assigned to this role.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Add permissions from the panel on the right.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 max-h-[50vh] overflow-y-auto border rounded-lg p-4">
                                        {Object.entries(
                                            role.permissions.reduce((acc, permission) => {
                                                if (!acc[permission.module]) acc[permission.module] = [];
                                                acc[permission.module].push(permission);
                                                return acc;
                                            }, {} as Record<string, Permission[]>)
                                        ).map(([module, modulePermissions]) => (
                                            <div key={module} className="space-y-3">
                                                <h4 className="font-semibold text-sm uppercase tracking-wide text-primary bg-muted px-2 py-1 rounded">
                                                    {module}
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-2">
                                                    {modulePermissions.map((permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex items-center justify-between p-2 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                                                        >
                                                            <div className="flex items-center space-x-2 flex-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPermissionIdsForRemoval.includes(permission.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedPermissionIdsForRemoval(prev => [...prev, permission.id]);
                                                                        } else {
                                                                            setSelectedPermissionIdsForRemoval(prev => prev.filter(id => id !== permission.id));
                                                                        }
                                                                    }}
                                                                    className="rounded border-gray-300"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="text-xs font-medium">{permission.name}</div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedPermissionIdsForRemoval.length > 0 && (
                                        <div className="border-t pt-4">
                                            <Button
                                                onClick={handleBulkRemovePermissions}
                                                disabled={isBulkRemovingPermissions}
                                                variant="destructive"
                                                className="w-full"
                                                size="lg"
                                            >
                                                {isBulkRemovingPermissions
                                                    ? 'Removing Permissions...'
                                                    : `Remove ${selectedPermissionIdsForRemoval.length} Selected Permission${selectedPermissionIdsForRemoval.length > 1 ? 's' : ''}`
                                                }
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Add Permissions Column */}
                        <div className="space-y-4">
                            <div className="">
                                <h3 className="text-lg font-medium">Available Permissions</h3>
                                {newItems && newItems > 0 ? (
                                    <Badge variant="secondary">
                                        {newItems} selected
                                    </Badge>
                                ) : null}
                            </div>

                            {Object.entries(availablePermissions).every(([, modulePermissions]) => modulePermissions.length === 0) ? (
                                <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                                    <p className="text-muted-foreground">All available permissions are already assigned.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[50vh] overflow-y-auto border rounded-lg p-4">
                                    {Object.entries(availablePermissions).map(([module, modulePermissions]) => (
                                        modulePermissions.length > 0 && (
                                            <div key={module} className="space-y-3">
                                                <div className="flex bg-muted px-2 py-1 rounded">
                                                    <h4 className="font-semibold text-sm uppercase tracking-wide text-primary ">
                                                        {module}
                                                    </h4>
                                                    {/* Select All Checkbox */}
                                                    <label className="flex items-center space-x-2 ml-auto">
                                                        <span className="text-sm text-muted-foreground">Select All</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={modulePermissions.every((p) => selectedPermissionIds.includes(p.id))}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPermissionIds(prev => [
                                                                        ...prev,
                                                                        ...modulePermissions.map((p) => p.id)
                                                                    ]);
                                                                } else {
                                                                    setSelectedPermissionIds(prev => [
                                                                        ...prev.filter((id) => !modulePermissions.some((p) => p.id === id))
                                                                    ]);
                                                                }
                                                            }}
                                                            className="ml-auto rounded border-gray-300"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-2">
                                                    {modulePermissions.map((permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex items-center space-x-3 p-2 px-1.5 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissionIds.includes(permission.id)}
                                                                onChange={(e) => {
                                                                    // Safety check - this permission should not already be assigned
                                                                    if (role && role.permissions.some(p => p.id === permission.id)) {
                                                                        console.warn('Attempted to select already assigned permission:', permission.id);
                                                                        return;
                                                                    }

                                                                    if (e.target.checked) {
                                                                        setSelectedPermissionIds(prev => [...prev, permission.id]);
                                                                    } else {
                                                                        setSelectedPermissionIds(prev => prev.filter(id => id !== permission.id));
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium">{permission.name}</div>
                                                                {permission.description && (
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                        {permission.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                            {newItems && newItems > 0 ? (
                                <div className="border-t pt-4">
                                    <Button
                                        onClick={handleAddPermissions}
                                        disabled={isAddingPermissions}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {isAddingPermissions
                                            ? 'Adding Permissions...'
                                            : `Add ${newItems} Selected Permission${newItems > 1 ? 's' : ''}`
                                        }
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </DialogFooter>

                {/* Bulk Remove Confirmation Dialog */}
                <Dialog open={showRemoveConfirmation} onOpenChange={setShowRemoveConfirmation}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Bulk Permission Removal</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove the following {permissionsToRemove.length} permission{permissionsToRemove.length > 1 ? 's' : ''} from this role?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {permissionsToRemove.map((permission) => (
                                <div key={permission.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                    <span className="text-sm font-medium">{permission.name}</span>
                                    <Badge variant="secondary">{permission.module}</Badge>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowRemoveConfirmation(false)}
                                disabled={isBulkRemovingPermissions}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmBulkRemovePermissions}
                                disabled={isBulkRemovingPermissions}
                            >
                                {isBulkRemovingPermissions ? 'Removing...' : 'Remove Permissions'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}