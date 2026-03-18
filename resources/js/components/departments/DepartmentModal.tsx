import { useEffect, useRef, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { type Department } from '@/types';

interface DepartmentModalProps {
    open: boolean;
    department?: Department | null;
    onClose: () => void;
    mode: 'create' | 'edit';
    onSuccess: () => void;
}

export default function DepartmentModal({ open, department, onClose, mode, onSuccess }: DepartmentModalProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
        color: '#3B82F6'
    });

    // Helper function to show feedback
    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedbackMessage({ type, message });
    };

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && department) {
                setFormData({
                    name: department.name,
                    description: department.description || '',
                    status: (department.status || 'active') as 'active' | 'inactive',
                    color: department.color || '#3B82F6'
                });
            } else {
                // Reset form for create mode
                setFormData({
                    name: '',
                    description: '',
                    status: 'active',
                    color: '#3B82F6'
                });
            }
            setFeedbackMessage(null);
        }
    }, [open, mode, department]);

    const isEdit = mode === 'edit';
    const title = isEdit ? 'Edit Department' : 'Create Department';
    const description = isEdit ? 'Make changes to the department details below.' : 'Create a new department with the details below.';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validate form
        if (!formData.name.trim()) {
            showFeedback('error', 'Department name is required.');
            setLoading(false);
            return;
        }

        if (isEdit && department) {
            // Update existing department
            axios.patch(`/admin/departments/${department.id}`, formData)
                .then((response) => {
                    showFeedback('success', 'Department updated successfully!');
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 1500);
                })
                .catch((error) => {
                    console.error('Department update failed:', error);
                    const message = error.response?.data?.message || error.response?.data?.errors?.name?.[0] || 'Failed to update department. Please check your inputs.';
                    showFeedback('error', message);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            // Create new department
            axios.post('/admin/departments', formData)
                .then((response) => {
                    showFeedback('success', 'Department created successfully!');
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 1500);
                })
                .catch((error) => {
                    console.error('Department creation failed:', error);
                    const message = error.response?.data?.message || error.response?.data?.errors?.name?.[0] || 'Failed to create department. Please check your inputs.';
                    showFeedback('error', message);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[98vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                    {department && (
                        <div className="text-sm text-yellow-600 mt-2">
                            You are editing <span className='font-semibold uppercase'>{department.name}</span>
                        </div>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                ref={nameInput}
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Department name"
                                autoComplete="off"
                                autoFocus
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Department description"
                                autoComplete="off"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select 
                                value={formData.status} 
                                onValueChange={(value) => handleInputChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="color">Color</Label>
                            <Input
                                id="color"
                                name="color"
                                type="color"
                                value={formData.color}
                                onChange={(e) => handleInputChange('color', e.target.value)}
                                placeholder="#3B82F6"
                                autoComplete="off"
                            />
                            <p className="text-xs text-muted-foreground">
                                Choose a color to represent this department
                            </p>
                        </div>
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setFeedbackMessage(null);
                            onClose();
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={loading || !formData.name.trim()} 
                        onClick={handleSubmit}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                {isEdit ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            isEdit ? 'Update Department' : 'Create Department'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}